-- Travel Lounge 2026 - Policies Backup
-- Generated: 2026-05-08

-- Enable RLS on all tables
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popular_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_posts ENABLE ROW LEVEL SECURITY;

-- Site Settings
CREATE POLICY "Allow public read access to site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage site_settings" ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Room Types
CREATE POLICY "Public can read room_types" ON public.room_types FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage room_types" ON public.room_types FOR ALL TO public USING ((auth.role() = 'authenticated'::text)) WITH CHECK ((auth.role() = 'authenticated'::text));

-- Reviews
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_admin_manage" ON public.reviews FOR ALL TO public USING (true) WITH CHECK (true);

-- Admins
CREATE POLICY "Allow public read for front-page team members" ON public.admins FOR SELECT TO anon, authenticated USING (((show_on_front_page = true) AND (is_active = true)));
CREATE POLICY "staff_read_all" ON public.admins FOR SELECT TO public USING (is_authorized_staff());
CREATE POLICY "staff_privileged_manage" ON public.admins FOR ALL TO public USING ((is_elevated_admin() OR (user_id = auth.uid()))) WITH CHECK ((is_elevated_admin() OR (user_id = auth.uid())));

-- Bookings
CREATE POLICY "Guest and Authenticated can insert bookings" ON public.bookings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT TO public USING (((auth.uid() IS NOT NULL) AND (customer_id IN ( SELECT customers.id FROM customers WHERE (customers.user_id = auth.uid())))));
CREATE POLICY "Staff can manage all bookings" ON public.bookings FOR ALL TO authenticated USING (is_authorized_staff()) WITH CHECK (is_authorized_staff());
CREATE POLICY "ops_staff_manage_bookings" ON public.bookings FOR ALL TO public USING (is_authorized_staff()) WITH CHECK (is_authorized_staff());

-- Customers
CREATE POLICY "Guest can insert customer record" ON public.customers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can only view/update self" ON public.customers FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Staff can manage all customers" ON public.customers FOR ALL TO authenticated USING (is_authorized_staff()) WITH CHECK (is_authorized_staff());
CREATE POLICY "staff_manage_customers" ON public.customers FOR ALL TO public USING (is_authorized_staff()) WITH CHECK (is_authorized_staff());

-- Booking Items
CREATE POLICY "Guest can insert booking items" ON public.booking_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view own items" ON public.booking_items FOR SELECT TO public USING ((EXISTS ( SELECT 1 FROM (bookings b JOIN customers c ON ((b.customer_id = c.id))) WHERE ((b.id = booking_items.booking_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Staff can manage all items" ON public.booking_items FOR ALL TO authenticated USING (is_authorized_staff()) WITH CHECK (is_authorized_staff());

-- Services
CREATE POLICY "catalog_staff_manage" ON public.services FOR ALL TO public USING (is_authorized_staff()) WITH CHECK (is_authorized_staff());
CREATE POLICY "catalog_public_read" ON public.services FOR SELECT TO public USING (true);
CREATE POLICY "staff_manage_services" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_services" ON public.services FOR SELECT TO anon, authenticated USING ((is_active = true));

-- Categories
CREATE POLICY "categories_staff_manage" ON public.categories FOR ALL TO public USING (is_authorized_staff()) WITH CHECK (is_authorized_staff());
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "staff_manage_categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_categories" ON public.categories FOR SELECT TO anon, authenticated USING ((is_active = true));

-- Service Pricing
CREATE POLICY "Authenticated admins can manage service_pricing" ON public.service_pricing FOR ALL TO public USING ((auth.role() = 'authenticated'::text)) WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Public can read service_pricing" ON public.service_pricing FOR SELECT TO public USING (true);
