-- Add pricing_model column to public.services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN public.services.pricing_model IS 'Pricing layout/calculation model for the service (hotel or activity)';
