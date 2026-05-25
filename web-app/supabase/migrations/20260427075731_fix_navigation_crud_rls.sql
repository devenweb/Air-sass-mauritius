-- Fix RLS permissions for Core Management Tables
-- This migration ensures the Admin App can perform CRUD operations
-- Applied on: 2026-04-27

-- 1. NAVIGATIONS
ALTER TABLE public.navigations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage navigations" ON public.navigations;
DROP POLICY IF EXISTS "Navigations are viewable by everyone" ON public.navigations;
CREATE POLICY "staff_manage_navigations" ON public.navigations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_navigations" ON public.navigations FOR SELECT TO anon, authenticated USING (is_active = true);

-- 2. ROOM_TYPES
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage room types" ON public.room_types;
DROP POLICY IF EXISTS "Room types are viewable by everyone" ON public.room_types;
CREATE POLICY "staff_manage_room_types" ON public.room_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_room_types" ON public.room_types FOR SELECT TO anon, authenticated USING (true);

-- 3. SERVICE_PRICING
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage service pricing" ON public.service_pricing;
CREATE POLICY "staff_manage_service_pricing" ON public.service_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_service_pricing" ON public.service_pricing FOR SELECT TO anon, authenticated USING (true);

-- 4. SITE_SETTINGS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON public.site_settings;
CREATE POLICY "staff_manage_site_settings" ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

-- 5. HERO_SLIDES
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Hero slides are viewable by everyone" ON public.hero_slides;
CREATE POLICY "staff_manage_hero_slides" ON public.hero_slides FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_hero_slides" ON public.hero_slides FOR SELECT TO anon, authenticated USING (is_active = true);

-- 6. FAQS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage faqs" ON public.faqs;
DROP POLICY IF EXISTS "FAQs are viewable by everyone" ON public.faqs;
CREATE POLICY "staff_manage_faqs" ON public.faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_faqs" ON public.faqs FOR SELECT TO anon, authenticated USING (is_published = true);

-- 7. HOTEL_ROOMS
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage hotel rooms" ON public.hotel_rooms;
DROP POLICY IF EXISTS "Hotel rooms are viewable by everyone" ON public.hotel_rooms;
CREATE POLICY "staff_manage_hotel_rooms" ON public.hotel_rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_hotel_rooms" ON public.hotel_rooms FOR SELECT TO anon, authenticated USING (true);
