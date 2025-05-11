-- Add water_intake to health_metrics table
ALTER TABLE IF EXISTS public.health_metrics
ADD COLUMN IF NOT EXISTS water_intake numeric DEFAULT 0;

COMMENT ON COLUMN public.health_metrics.water_intake IS 'Daily water intake in milliliters';
