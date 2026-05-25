-- SAFER TRIGGER: Handles bidirectional sync and prevents wiping out prices
CREATE OR REPLACE FUNCTION public.fn_sync_service_pricing_gross()
RETURNS TRIGGER AS $$
DECLARE
    v_fee NUMERIC;
BEGIN
    -- Fallback logic for fee
    v_fee := NEW.service_fee;
    IF v_fee IS NULL AND NEW.variant_id IS NOT NULL AND NEW.variant_id::text != 'meal_supplements' THEN
        SELECT service_fee INTO v_fee FROM public.room_types WHERE id = NEW.variant_id;
    END IF;
    IF v_fee IS NULL THEN
        SELECT service_fee INTO v_fee FROM public.services WHERE id = NEW.service_id;
    END IF;
    v_fee := COALESCE(v_fee, 0);

    -- Standard Pricing Logic: If net_price is 0 but gross price exists, reverse-calculate
    -- This handles migration and prevents accidental wipes from older clients
    IF (NEW.net_price IS NULL OR NEW.net_price = 0) AND (NEW.price IS NOT NULL AND NEW.price > 0) THEN
        NEW.net_price := NEW.price / (1 + v_fee / 100);
    ELSE
        NEW.price := NEW.net_price * (1 + v_fee / 100);
    END IF;

    IF (NEW.net_price_teen IS NULL OR NEW.net_price_teen = 0) AND (NEW.price_teen IS NOT NULL AND NEW.price_teen > 0) THEN
        NEW.net_price_teen := NEW.price_teen / (1 + v_fee / 100);
    ELSE
        NEW.price_teen := NEW.net_price_teen * (1 + v_fee / 100);
    END IF;

    IF (NEW.net_price_child IS NULL OR NEW.net_price_child = 0) AND (NEW.price_child IS NOT NULL AND NEW.price_child > 0) THEN
        NEW.net_price_child := NEW.price_child / (1 + v_fee / 100);
    ELSE
        NEW.price_child := NEW.net_price_child * (1 + v_fee / 100);
    END IF;

    IF (NEW.net_price_infant IS NULL OR NEW.net_price_infant = 0) AND (NEW.price_infant IS NOT NULL AND NEW.price_infant > 0) THEN
        NEW.net_price_infant := NEW.price_infant / (1 + v_fee / 100);
    ELSE
        NEW.price_infant := NEW.net_price_infant * (1 + v_fee / 100);
    END IF;
    
    -- Handle tiered occupancy pricing JSONB
    IF NEW.net_occupancy_pricing IS NOT NULL THEN
        SELECT jsonb_object_agg(key, 
            jsonb_build_object(
                'price',  (COALESCE((value->>'price')::NUMERIC, 0)  * (1 + v_fee / 100)),
                'teen',   (COALESCE((value->>'teen')::NUMERIC, 0)   * (1 + v_fee / 100)),
                'child',  (COALESCE((value->>'child')::NUMERIC, 0)  * (1 + v_fee / 100)),
                'infant', (COALESCE((value->>'infant')::NUMERIC, 0) * (1 + v_fee / 100))
            )
        ) INTO NEW.occupancy_pricing
        FROM jsonb_each(NEW.net_occupancy_pricing);
    ELSIF NEW.occupancy_pricing IS NOT NULL THEN
        -- Reverse calculate net occupancy if missing
        SELECT jsonb_object_agg(key, 
            jsonb_build_object(
                'price',  (COALESCE((value->>'price')::NUMERIC, 0)  / (1 + v_fee / 100)),
                'teen',   (COALESCE((value->>'teen')::NUMERIC, 0)   / (1 + v_fee / 100)),
                'child',  (COALESCE((value->>'child')::NUMERIC, 0)  / (1 + v_fee / 100)),
                'infant', (COALESCE((value->>'infant')::NUMERIC, 0) / (1 + v_fee / 100))
            )
        ) INTO NEW.net_occupancy_pricing
        FROM jsonb_each(NEW.occupancy_pricing);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Repair existing data that might have been zeroed out if price was 0 but we have a backup in net_price?
-- Actually, if they are both 0, we can't do much. 
-- But if net_price is > 0 and price is 0, we just need to trigger an update.
UPDATE public.service_pricing 
SET updated_at = NOW() 
WHERE (price IS NULL OR price = 0) AND (net_price > 0);

-- One more thing: If net_price was 0 and price was > 0, we already fixed the trigger, so let's trigger it.
UPDATE public.service_pricing 
SET updated_at = NOW() 
WHERE (net_price IS NULL OR net_price = 0) AND (price > 0);
