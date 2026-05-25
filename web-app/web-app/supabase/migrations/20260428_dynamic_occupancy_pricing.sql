-- Migration: Add Dynamic Occupancy Pricing Support
-- Date: 2026-04-28
-- Description: Adds a JSONB column to service_pricing to store occupancy-based rates (Single, Double, Triple, Quad, etc.)

-- 1. Add the occupancy_pricing column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_pricing' AND column_name='occupancy_pricing') THEN
        ALTER TABLE public.service_pricing ADD COLUMN occupancy_pricing JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Add comments for clarity
COMMENT ON COLUMN public.service_pricing.occupancy_pricing IS 'Stores occupancy-based rates for hotels (e.g., {"1": 10000, "2": 12000, "3": 15000})';

-- 3. (Optional) Backfill: If we wanted to move current 'price' to 'occupancy_pricing->1', we could do it here.
-- But we will keep 'price' as the "Single" rate for backward compatibility.
UPDATE public.service_pricing 
SET occupancy_pricing = jsonb_build_object('1', price)
WHERE occupancy_pricing = '{}'::jsonb AND price > 0;
