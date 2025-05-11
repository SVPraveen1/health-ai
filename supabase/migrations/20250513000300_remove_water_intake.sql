-- Remove water_intake column from health_metrics table
ALTER TABLE IF EXISTS public.health_metrics DROP COLUMN IF EXISTS water_intake;
