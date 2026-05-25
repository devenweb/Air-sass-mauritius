-- Fix RLS permissions for Service Management
-- This migration ensures the Admin App can manage service-category associations.
-- Applied on: 2026-04-27

-- 1. service_categories
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "staff_manage_service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "public_read_service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "Allow staff to manage service categories" ON public.service_categories;
DROP POLICY IF EXISTS "Allow public to read service categories" ON public.service_categories;

-- Create robust policies for authenticated users (Staff/Admin)
CREATE POLICY "staff_manage_service_categories" ON public.service_categories
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create a policy for public users to read associations
CREATE POLICY "public_read_service_categories" ON public.service_categories
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 2. Ensure 'services' table also has correct RLS for staff
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_manage_services" ON public.services;
DROP POLICY IF EXISTS "public_read_services" ON public.services;

CREATE POLICY "staff_manage_services" ON public.services
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "public_read_services" ON public.services
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- 3. Ensure 'categories' table has correct RLS for staff
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_manage_categories" ON public.categories;
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;

CREATE POLICY "staff_manage_categories" ON public.categories
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "public_read_categories" ON public.categories
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);
