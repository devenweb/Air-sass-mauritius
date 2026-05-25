-- Royal Travel Agency 2026 - Infrastructure Backup (Complete)
-- Generated: 2026-05-08

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Custom Functions
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

-- Core Tables
CREATE TABLE IF NOT EXISTS public.services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    short_description text,
    location text,
    region text,
    rating numeric DEFAULT 4.5,
    image_url text,
    banner_url text,
    secondary_image_url text,
    thumbnail_url text,
    amenities text[],
    service_type text,
    activity_type text,
    duration_days integer,
    duration_hours integer,
    max_group_size integer,
    room_types jsonb DEFAULT '[]'::jsonb,
    itinerary jsonb DEFAULT '[]'::jsonb,
    meal_plans jsonb DEFAULT '[]'::jsonb,
    highlights jsonb DEFAULT '[]'::jsonb,
    included jsonb DEFAULT '[]'::jsonb,
    not_included jsonb DEFAULT '[]'::jsonb,
    special_features jsonb DEFAULT '[]'::jsonb,
    stock integer,
    status text DEFAULT 'active',
    featured boolean DEFAULT false,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_coming_soon boolean DEFAULT false,
    is_seasonal_deal boolean DEFAULT false,
    deal_note text DEFAULT 'Limited Time',
    badge_text text,
    service_fee numeric DEFAULT 0,
    cancellation_policy text,
    terms_and_conditions text,
    meta_title text,
    meta_description text,
    seo_keywords text,
    seasonality text,
    gallery_images text[],
    max_adults integer,
    max_children integer,
    child_age_limit integer DEFAULT 12,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.room_types (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    image_url text,
    images text[],
    amenities text[],
    max_occupancy integer DEFAULT 2,
    max_adults integer DEFAULT 2,
    max_teens integer DEFAULT 0,
    max_children integer DEFAULT 0,
    max_infants integer DEFAULT 0,
    min_stay_days integer DEFAULT 1,
    meal_plan text,
    service_fee numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_pricing (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    variant_id text,
    label text,
    date_from date NOT NULL,
    date_to date NOT NULL,
    net_price numeric DEFAULT 0,
    net_price_teen numeric DEFAULT 0,
    net_price_child numeric DEFAULT 0,
    net_price_infant numeric DEFAULT 0,
    price numeric DEFAULT 0,
    price_teen numeric DEFAULT 0,
    price_child numeric DEFAULT 0,
    price_infant numeric DEFAULT 0,
    net_occupancy_pricing jsonb,
    occupancy_pricing jsonb DEFAULT '{}'::jsonb,
    currency text DEFAULT 'MUR',
    price_type text DEFAULT 'per_person',
    units_available integer,
    is_stop_sell boolean DEFAULT false,
    meal_plan_id text,
    service_fee numeric,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name varchar NOT NULL,
    slug varchar UNIQUE NOT NULL,
    description text,
    icon varchar,
    image_url text,
    link varchar,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    show_on_home boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admins (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid,
    username varchar,
    email varchar UNIQUE NOT NULL,
    name text,
    title text,
    bio text,
    photo_url text,
    linkedin_url text,
    role varchar DEFAULT 'admin',
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    show_on_front_page boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value jsonb,
    category text,
    description text,
    updated_at timestamptz DEFAULT now()
);

-- Content Tables
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text,
    subtitle text,
    image_url text,
    link_url text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.editorial_posts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    slug text UNIQUE NOT NULL,
    content text,
    excerpt text,
    featured_image text,
    author_id uuid REFERENCES public.admins(id),
    status text DEFAULT 'draft',
    published_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Operational Tables
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    address text,
    country text,
    status text DEFAULT 'Active',
    is_subscriber boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id uuid REFERENCES public.customers(id),
    service_type text NOT NULL,
    service_name text NOT NULL,
    check_in_date timestamptz NOT NULL,
    check_out_date timestamptz,
    amount numeric DEFAULT 0,
    status text DEFAULT 'Pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Triggers (Re-applied)
DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_service_pricing_updated_at ON public.service_pricing;
CREATE TRIGGER trg_service_pricing_updated_at BEFORE UPDATE ON public.service_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_sync_service_pricing_gross ON public.service_pricing;
CREATE TRIGGER tr_sync_service_pricing_gross BEFORE INSERT OR UPDATE ON public.service_pricing FOR EACH ROW EXECUTE FUNCTION fn_sync_service_pricing_gross();

DROP TRIGGER IF EXISTS tr_recalc_service_pricing_on_svc_fee_change ON public.services;
CREATE TRIGGER tr_recalc_service_pricing_on_svc_fee_change AFTER UPDATE OF service_fee ON public.services FOR EACH ROW EXECUTE FUNCTION fn_recalc_service_pricing_on_fee_change();

DROP TRIGGER IF EXISTS tr_recalc_service_pricing_on_room_fee_change ON public.room_types;
CREATE TRIGGER tr_recalc_service_pricing_on_room_fee_change AFTER UPDATE OF service_fee ON public.room_types FOR EACH ROW EXECUTE FUNCTION fn_recalc_service_pricing_on_fee_change();

