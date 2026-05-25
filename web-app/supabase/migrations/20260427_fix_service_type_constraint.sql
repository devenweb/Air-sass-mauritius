-- AUTHORITATIVE SCHEMA FIX: SERVICE TYPES & MISSING COLUMNS
-- Purpose: Unblock service creation by expanding type constraints and adding missing metadata columns.
-- Applied on: 2026-04-27

-- 1. Expand Service Type Constraint
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_service_type_check;
ALTER TABLE public.services ADD CONSTRAINT services_service_type_check 
CHECK (service_type IN (
    'activity', 'hotel', 'tour', 'land_activity', 'sea_activity', 
    'water_activity', 'transfer', 'package', 'packages', 'cruise', 
    'visa', 'lounge', 'flight'
));

-- 2. Add Missing Metadata Columns (Ensuring sync with Admin App)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='max_group_size') THEN
        ALTER TABLE public.services ADD COLUMN max_group_size INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='cancellation_policy') THEN
        ALTER TABLE public.services ADD COLUMN cancellation_policy TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='banner_url') THEN
        ALTER TABLE public.services ADD COLUMN banner_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='secondary_image_url') THEN
        ALTER TABLE public.services ADD COLUMN secondary_image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='itinerary') THEN
        ALTER TABLE public.services ADD COLUMN itinerary JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
