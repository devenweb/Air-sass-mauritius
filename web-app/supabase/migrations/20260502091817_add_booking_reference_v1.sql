-- Add booking_reference column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_reference TEXT UNIQUE;

-- Create a function to generate a random alphanumeric string
CREATE OR REPLACE FUNCTION public.generate_booking_reference() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude easily confused chars like 0, O, 1, I
  result TEXT := 'TL-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update create_booking_v1 to include booking_reference
CREATE OR REPLACE FUNCTION public.create_booking_v1(p_booking_data jsonb, p_items_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_booking_id UUID;
  v_customer_id UUID;
  v_current_user_id UUID;
  v_is_valid_user BOOLEAN;
  v_booking_ref TEXT;
  v_result JSONB;
BEGIN
  -- Get the current user ID from the session
  v_current_user_id := auth.uid();
  
  -- Validate input data
  IF p_booking_data IS NULL OR p_items_data IS NULL THEN
    RAISE EXCEPTION 'Booking data cannot be null';
  END IF;
  
  -- Validate customer ownership
  v_customer_id := (p_booking_data->>'customer_id')::UUID;
  
  -- Authorization check
  IF v_current_user_id IS NOT NULL AND v_customer_id = v_current_user_id THEN
    v_is_valid_user := TRUE;
  ELSIF public.is_admin_or_staff() THEN
    v_is_valid_user := TRUE;
  ELSE
    v_is_valid_user := EXISTS (
      SELECT 1 FROM public.customers 
      WHERE id = v_customer_id AND email = auth.email()
    );
  END IF;
  
  IF NOT v_is_valid_user THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create booking for this customer';
  END IF;

  -- Generate a unique booking reference
  LOOP
    v_booking_ref := public.generate_booking_reference();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE booking_reference = v_booking_ref);
  END LOOP;

  -- Insert the booking
  INSERT INTO bookings (
    customer_id,
    start_date,
    end_date,
    status,
    payment_status,
    pax_adults,
    pax_children,
    amount,
    tax_amount,
    activity_type,
    activity_name,
    description,
    booking_reference,
    created_at,
    updated_at
  ) VALUES (
    v_customer_id,
    (p_booking_data->>'start_date')::TIMESTAMP WITH TIME ZONE,
    (p_booking_data->>'end_date')::TIMESTAMP WITH TIME ZONE,
    COALESCE(p_booking_data->>'status', 'pending'),
    COALESCE(p_booking_data->>'payment_status', 'pending'),
    GREATEST(COALESCE((p_booking_data->>'pax_adults')::INTEGER, 1), 1),
    GREATEST(COALESCE((p_booking_data->>'pax_children')::INTEGER, 0), 0),
    GREATEST(COALESCE((p_booking_data->>'amount')::NUMERIC, 0), 0),
    GREATEST(COALESCE((p_booking_data->>'tax_amount')::NUMERIC, 0), 0),
    p_booking_data->>'activity_type',
    p_booking_data->>'activity_name',
    LEFT(p_booking_data->>'description', 2000),
    v_booking_ref,
    COALESCE((p_booking_data->>'created_at')::TIMESTAMP WITH TIME ZONE, NOW()),
    NOW()
  ) RETURNING id INTO v_booking_id;

  -- Insert booking items
  INSERT INTO booking_items (
    booking_id,
    service_id,
    service_name,
    service_category,
    amount,
    created_at
  )
  SELECT 
    v_booking_id,
    (item->>'service_id')::UUID,
    LEFT(item->>'service_name', 255),
    LEFT(item->>'service_category', 50),
    GREATEST(COALESCE((item->>'amount')::NUMERIC, 0), 0),
    NOW()
  FROM jsonb_array_elements(p_items_data) AS item
  WHERE item->>'service_id' IS NOT NULL 
    AND item->>'service_name' IS NOT NULL 
    AND item->>'service_category' IS NOT NULL;

  -- Build and return result
  v_result := jsonb_build_object(
    'id', v_booking_id,
    'reference', v_booking_ref,
    'success', TRUE,
    'customer_id', v_customer_id
  );

  RETURN v_result;
END;
$function$;
