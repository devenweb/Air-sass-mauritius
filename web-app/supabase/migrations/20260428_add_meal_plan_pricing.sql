-- Add meal_plan_id to service_pricing to support absolute pricing per meal plan
ALTER TABLE public.service_pricing ADD COLUMN IF NOT EXISTS meal_plan_id TEXT;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_service_pricing_meal_plan ON public.service_pricing(meal_plan_id);

COMMENT ON COLUMN public.service_pricing.meal_plan_id IS 'Specific meal plan ID for absolute pricing. If null, pricing applies to the base variant plus supplements.';
