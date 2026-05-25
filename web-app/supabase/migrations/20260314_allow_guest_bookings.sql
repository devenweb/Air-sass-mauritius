-- Migration to allow Guest Bookings
-- Applied on: 2026-03-14

-- 1. Allow public to insert into customers (for lead generation/guest booking)
DROP POLICY IF EXISTS "Public can insert customers" ON public.customers;
CREATE POLICY "Public can insert customers" ON public.customers 
    FOR INSERT WITH CHECK (true);

-- 2. Allow public to insert into bookings
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Public can insert bookings" ON public.bookings 
    FOR INSERT WITH CHECK (true);

-- 3. Allow public to insert into booking_items
DROP POLICY IF EXISTS "Public can insert booking_items" ON public.booking_items;
CREATE POLICY "Public can insert booking_items" ON public.booking_items 
    FOR INSERT WITH CHECK (true);

-- Ensure RPC is accessible (if not already handled by SECURITY DEFINER)
-- Note: create_booking_v1 is usually defined as SECURITY DEFINER in this stack
-- so it bypasses RLS for internal operations, but let's ensure the grant is there.
GRANT EXECUTE ON FUNCTION public.create_booking_v1(JSONB, JSONB[]) TO anon, authenticated;
