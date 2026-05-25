-- 1. Drop existing triggers and rules
DROP TRIGGER IF EXISTS update_services_updated_at ON public.services CASCADE;
DROP TRIGGER IF EXISTS trg_service_pricing_updated_at ON public.service_pricing CASCADE;
DROP TRIGGER IF EXISTS tr_sync_service_pricing_gross ON public.service_pricing CASCADE;
DROP TRIGGER IF EXISTS tr_recalc_service_pricing_on_svc_fee_change ON public.services CASCADE;
DROP TRIGGER IF EXISTS tr_recalc_service_pricing_on_room_fee_change ON public.room_types CASCADE;

-- 2. Drop existing tables if they exist
DROP TABLE IF EXISTS public."profiles" CASCADE;
DROP TABLE IF EXISTS public."products" CASCADE;
DROP TABLE IF EXISTS public."product_categories" CASCADE;
DROP TABLE IF EXISTS public."orders" CASCADE;
DROP TABLE IF EXISTS public."order_items" CASCADE;
DROP TABLE IF EXISTS public."invoices" CASCADE;
DROP TABLE IF EXISTS public."invoice_items" CASCADE;
DROP TABLE IF EXISTS public."auth_audit_logs" CASCADE;
DROP TABLE IF EXISTS public."reviews" CASCADE;
DROP TABLE IF EXISTS public."editorial_posts" CASCADE;
DROP TABLE IF EXISTS public."popular_destinations" CASCADE;
DROP TABLE IF EXISTS public."hotel_rooms" CASCADE;
DROP TABLE IF EXISTS public."service_pricing" CASCADE;
DROP TABLE IF EXISTS public."booking_items" CASCADE;
DROP TABLE IF EXISTS public."bookings" CASCADE;
DROP TABLE IF EXISTS public."partners" CASCADE;
DROP TABLE IF EXISTS public."navigations" CASCADE;
DROP TABLE IF EXISTS public."popup_ads" CASCADE;
DROP TABLE IF EXISTS public."subscribers" CASCADE;
DROP TABLE IF EXISTS public."inquiries" CASCADE;
DROP TABLE IF EXISTS public."content_blocks" CASCADE;
DROP TABLE IF EXISTS public."faqs" CASCADE;
DROP TABLE IF EXISTS public."hero_slides" CASCADE;
DROP TABLE IF EXISTS public."room_types" CASCADE;
DROP TABLE IF EXISTS public."service_categories" CASCADE;
DROP TABLE IF EXISTS public."services" CASCADE;
DROP TABLE IF EXISTS public."customers" CASCADE;
DROP TABLE IF EXISTS public."email_templates" CASCADE;
DROP TABLE IF EXISTS public."admins" CASCADE;
DROP TABLE IF EXISTS public."categories" CASCADE;
DROP TABLE IF EXISTS public."site_settings" CASCADE;

-- 3. Drop custom functions if they exist
DROP FUNCTION IF EXISTS public.is_authorized_staff() CASCADE;
DROP FUNCTION IF EXISTS public.is_elevated_admin() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.fn_sync_service_pricing_gross() CASCADE;
DROP FUNCTION IF EXISTS public.fn_recalc_service_pricing_on_fee_change() CASCADE;

-- 4. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 5. Create Custom Functions
CREATE OR REPLACE FUNCTION public.is_authorized_staff()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins 
        WHERE (user_id = auth.uid() OR email = (auth.jwt()->>'email')::text)
        AND is_active = true
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_elevated_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins 
        WHERE (user_id = auth.uid() OR email = (auth.jwt()->>'email')::text)
        AND role IN ('super_admin', 'admin', 'director')
        AND is_active = true
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_sync_service_pricing_gross()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_fee NUMERIC;
BEGIN
    v_fee := NEW.service_fee;
    IF v_fee IS NULL AND NEW.variant_id IS NOT NULL AND NEW.variant_id::text != 'meal_supplements' THEN
        SELECT service_fee INTO v_fee FROM public.room_types WHERE id::text = NEW.variant_id::text;
    END IF;
    IF v_fee IS NULL THEN
        SELECT service_fee INTO v_fee FROM public.services WHERE id = NEW.service_id;
    END IF;
    v_fee := COALESCE(v_fee, 0);
    NEW.price        := NEW.net_price        * (1 + v_fee / 100);
    NEW.price_teen   := NEW.net_price_teen   * (1 + v_fee / 100);
    NEW.price_child  := NEW.net_price_child  * (1 + v_fee / 100);
    NEW.price_infant := NEW.net_price_infant * (1 + v_fee / 100);
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
    ELSE
        NEW.occupancy_pricing := NULL;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_recalc_service_pricing_on_fee_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (TG_TABLE_NAME = 'services') THEN
        UPDATE public.service_pricing SET updated_at = NOW() WHERE service_id = NEW.id;
    ELSIF (TG_TABLE_NAME = 'room_types') THEN
        UPDATE public.service_pricing SET updated_at = NOW() WHERE variant_id = NEW.id::text;
    END IF;
    RETURN NEW;
END;
$function$;


-- 6. Create Table Schemas
CREATE TABLE IF NOT EXISTS public."admins" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "username" character varying NOT NULL,
    "email" character varying NOT NULL,
    "role" character varying DEFAULT 'admin'::character varying,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now(),
    "name" text,
    "bio" text,
    "photo_url" text,
    "linkedin_url" text,
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "show_on_front_page" boolean DEFAULT true,
    "user_id" uuid,
    "title" text
);

CREATE TABLE IF NOT EXISTS public."auth_audit_logs" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid,
    "action" text NOT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "ip_address" text,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."booking_items" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "booking_id" uuid NOT NULL,
    "service_name" text NOT NULL,
    "service_category" text,
    "amount" numeric NOT NULL DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT now(),
    "service_id" uuid
);

CREATE TABLE IF NOT EXISTS public."bookings" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" uuid,
    "service_type" text NOT NULL,
    "service_name" text NOT NULL,
    "description" text,
    "check_in_date" timestamp with time zone NOT NULL,
    "check_out_date" timestamp with time zone,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "amount" numeric NOT NULL DEFAULT 0.00,
    "tax_amount" numeric DEFAULT 0.00,
    "total_price" numeric,
    "currency" text DEFAULT 'USD'::text,
    "payment_status" text DEFAULT 'Pending'::text,
    "status" text DEFAULT 'Pending'::text,
    "pax_adults" integer DEFAULT 1,
    "pax_children" integer DEFAULT 0,
    "lounge_name" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "pax_teens" integer DEFAULT 0,
    "pax_infants" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public."categories" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" character varying NOT NULL,
    "slug" character varying NOT NULL,
    "icon" character varying,
    "image_url" text,
    "link" character varying,
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now(),
    "description" text,
    "show_on_home" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public."content_blocks" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "page_slug" text NOT NULL,
    "section_key" text NOT NULL,
    "content" jsonb NOT NULL,
    "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public."customers" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text,
    "address" text,
    "country" text,
    "is_subscriber" boolean DEFAULT false,
    "newsletter_opt_in_date" timestamp with time zone,
    "marketing_tags" text[],
    "status" text DEFAULT 'Active'::text,
    "total_bookings_count" integer DEFAULT 0,
    "total_spend" numeric DEFAULT 0.00,
    "last_interaction_at" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "user_id" uuid
);

CREATE TABLE IF NOT EXISTS public."editorial_posts" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "slug" text NOT NULL,
    "excerpt" text,
    "content" text,
    "featured_image" text,
    "tags" text[],
    "status" text DEFAULT 'draft'::text,
    "published_at" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now(),
    "author_id" uuid,
    "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."email_templates" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" character varying NOT NULL,
    "subject" character varying,
    "body" text,
    "variables" jsonb DEFAULT '[]'::jsonb,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."faqs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "category" text NOT NULL DEFAULT 'General'::text,
    "question" text NOT NULL,
    "answer" text NOT NULL,
    "order_index" integer DEFAULT 0,
    "is_published" boolean DEFAULT true,
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public."hero_slides" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "image_url" text NOT NULL,
    "subtitle" text,
    "title" text NOT NULL,
    "description" text,
    "cta_text" text DEFAULT 'Explore'::text,
    "cta_link" text DEFAULT '/search'::text,
    "order_index" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "video_url" text,
    "media_type" character varying DEFAULT 'image'::character varying,
    "alignment" text DEFAULT 'center'::text,
    "overlay_opacity" double precision DEFAULT 0.4,
    "tag" text,
    "cta" text,
    "link" text,
    "animation_type" text DEFAULT 'fade'::text,
    "duration" integer DEFAULT 6000,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "mobile_image_url" text,
    "badge_text" text,
    "badge_color" text DEFAULT '#EF4444'::text
);

CREATE TABLE IF NOT EXISTS public."hotel_rooms" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "service_id" uuid,
    "name" text,
    "type" text,
    "price_per_night" numeric DEFAULT 0,
    "total_units" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "size" text,
    "bed" text,
    "view" text,
    "features" jsonb,
    "image_url" text,
    "max_occupancy" integer DEFAULT 2,
    "meal_plan" text DEFAULT 'Room Only'::text,
    "cancellation_policy" text,
    "deposit_policy" text,
    "updated_at" timestamp with time zone DEFAULT now(),
    "is_active" boolean DEFAULT true,
    "min_stay_days" integer DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public."inquiries" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text,
    "subject" text NOT NULL,
    "message" text NOT NULL,
    "status" text DEFAULT 'unread'::text,
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "source" text,
    "lead_data" jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public."invoice_items" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_id" uuid NOT NULL,
    "item_description" text NOT NULL,
    "quantity" integer DEFAULT 1,
    "unit_price" numeric NOT NULL DEFAULT 0.00,
    "amount" numeric,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."invoices" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" uuid,
    "customer_name" text,
    "amount" numeric NOT NULL DEFAULT 0.00,
    "status" text DEFAULT 'Pending'::text,
    "service" text NOT NULL,
    "reference" text,
    "due_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."navigations" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "label" text NOT NULL,
    "link" text NOT NULL,
    "icon" text,
    "parent_id" uuid,
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public."order_items" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" uuid NOT NULL,
    "service_id" uuid,
    "service_name" text,
    "quantity" integer DEFAULT 1,
    "unit_price" numeric NOT NULL DEFAULT 0.00,
    "total_price" numeric,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."orders" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" uuid,
    "customer_name" text,
    "amount" numeric NOT NULL DEFAULT 0.00,
    "status" text DEFAULT 'Pending'::text,
    "payment_method" text,
    "items" jsonb DEFAULT '[]'::jsonb,
    "total_items" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."partners" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "logo_url" text NOT NULL,
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."popular_destinations" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "destination" text NOT NULL,
    "country" text,
    "return_price" numeric NOT NULL,
    "image_url" text,
    "is_featured" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public."popup_ads" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "title" text NOT NULL,
    "content" text,
    "media_url" text,
    "media_type" text DEFAULT 'image'::text,
    "cta_text" text,
    "cta_link" text,
    "is_active" boolean DEFAULT true,
    "display_frequency" text DEFAULT 'once_per_session'::text,
    "start_at" timestamp with time zone,
    "end_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    "popup_type" text DEFAULT 'standard'::text
);

CREATE TABLE IF NOT EXISTS public."product_categories" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "product_id" uuid,
    "category_id" uuid,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."products" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "category" text NOT NULL,
    "price" numeric NOT NULL DEFAULT 0.00,
    "stock" integer DEFAULT 0,
    "status" text DEFAULT 'In Stock'::text,
    "description" text,
    "image_url" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "room_types" jsonb DEFAULT '[]'::jsonb,
    "itinerary" jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public."profiles" (
    "id" uuid NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "loyalty_points" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public."reviews" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "service_id" uuid,
    "service_type" text,
    "customer_id" uuid,
    "customer_name" text,
    "rating" integer,
    "comment" text,
    "status" text DEFAULT 'pending'::text,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."room_types" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "service_id" uuid,
    "name" text NOT NULL,
    "amenities" text[],
    "max_occupancy" integer DEFAULT 2,
    "min_stay_days" integer DEFAULT 1,
    "max_infants" integer,
    "max_children" integer,
    "max_teens" integer,
    "max_adults" integer DEFAULT 2,
    "image_url" text,
    "images" text[],
    "meal_plan" text,
    "description" text,
    "service_fee" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."service_categories" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "service_id" uuid,
    "category_id" uuid,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."service_pricing" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "service_id" uuid NOT NULL,
    "variant_id" text,
    "label" text,
    "date_from" date NOT NULL,
    "date_to" date NOT NULL,
    "price" numeric NOT NULL DEFAULT 0,
    "currency" text DEFAULT 'MUR'::text,
    "price_type" text DEFAULT 'per_person'::text,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "price_infant" numeric NOT NULL DEFAULT 0,
    "price_child" numeric NOT NULL DEFAULT 0,
    "price_teen" numeric NOT NULL DEFAULT 0,
    "units_available" integer,
    "is_stop_sell" boolean DEFAULT false,
    "occupancy_pricing" jsonb DEFAULT '{}'::jsonb,
    "meal_plan_id" text,
    "service_fee" numeric,
    "net_price" numeric DEFAULT 0,
    "net_price_teen" numeric DEFAULT 0,
    "net_price_child" numeric DEFAULT 0,
    "net_price_infant" numeric DEFAULT 0,
    "net_occupancy_pricing" jsonb,
    "capacity" integer,
    "duration" numeric,
    "duration_type" text
);

CREATE TABLE IF NOT EXISTS public."services" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "description" text,
    "location" text,
    "region" text,
    "rating" numeric DEFAULT 4.5,
    "image_url" text,
    "amenities" text[],
    "service_type" text,
    "duration_days" integer,
    "duration_hours" integer,
    "max_group_size" integer,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "room_types" jsonb DEFAULT '[]'::jsonb,
    "itinerary" jsonb DEFAULT '[]'::jsonb,
    "stock" integer,
    "status" text DEFAULT 'active'::text,
    "cta_text" text,
    "cta_link" text,
    "gallery_images" text[],
    "meta_title" text,
    "meta_description" text,
    "seo_keywords" text,
    "special_features" jsonb DEFAULT '[]'::jsonb,
    "seasonality" text,
    "highlights" jsonb DEFAULT '[]'::jsonb,
    "included" jsonb DEFAULT '[]'::jsonb,
    "not_included" jsonb DEFAULT '[]'::jsonb,
    "cancellation_policy" text,
    "terms_and_conditions" text,
    "thumbnail_url" text,
    "banner_url" text,
    "featured" boolean DEFAULT false,
    "priority" integer DEFAULT 0,
    "secondary_image_url" text,
    "is_seasonal_deal" boolean DEFAULT false,
    "deal_note" text DEFAULT 'Limited Time'::text,
    "is_active" boolean DEFAULT true,
    "is_coming_soon" boolean DEFAULT false,
    "short_description" text,
    "max_adults" integer,
    "max_children" integer,
    "child_age_limit" integer DEFAULT 12,
    "meal_plans" jsonb DEFAULT '[]'::jsonb,
    "activity_type" text,
    "service_fee" numeric DEFAULT 0,
    "badge_text" text
);

CREATE TABLE IF NOT EXISTS public."site_settings" (
    "key" text NOT NULL,
    "value" jsonb NOT NULL,
    "category" text NOT NULL,
    "description" text,
    "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public."subscribers" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "email" text NOT NULL,
    "status" text DEFAULT 'active'::text,
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

