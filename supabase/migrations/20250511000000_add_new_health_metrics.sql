-- Add new columns to health_metrics table
ALTER TABLE public.health_metrics
ADD COLUMN sleep_hours NUMERIC(4,2),
ADD COLUMN sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent')),
ADD COLUMN activity_minutes INTEGER,
ADD COLUMN activity_type TEXT CHECK (activity_type IN ('sedentary', 'light', 'moderate', 'vigorous')),
ADD COLUMN weight NUMERIC(5,2),
ADD COLUMN steps INTEGER,
ADD COLUMN mood TEXT CHECK (mood IN ('stressed', 'neutral', 'good', 'great')),
ADD COLUMN water_intake INTEGER,
ADD COLUMN blood_glucose INTEGER;

-- Create health_goals table
CREATE TABLE public.health_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('sleep', 'activity', 'weight', 'steps', 'blood_pressure', 'heart_rate')) NOT NULL,
  target NUMERIC NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  progress NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health_reports table
CREATE TABLE public.health_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  metrics JSONB NOT NULL,
  goals_summary JSONB NOT NULL,
  insights JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX health_metrics_user_created_at_idx ON public.health_metrics(user_id, created_at DESC);
CREATE INDEX health_goals_user_deadline_idx ON public.health_goals(user_id, deadline);
CREATE INDEX health_reports_user_date_idx ON public.health_reports(user_id, start_date DESC);

-- Add function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for health_goals
CREATE TRIGGER update_health_goals_updated_at
  BEFORE UPDATE ON public.health_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for weekly metrics aggregation
CREATE OR REPLACE VIEW public.weekly_health_metrics AS
SELECT
  user_id,
  date_trunc('week', created_at) as week_start,
  date_trunc('week', created_at) + interval '6 days' as week_end,
  AVG(heart_rate) as avg_heart_rate,
  AVG(systolic_bp) as avg_systolic_bp,
  AVG(diastolic_bp) as avg_diastolic_bp,
  AVG(sleep_hours) as avg_sleep_hours,
  SUM(activity_minutes) as total_activity_minutes,
  SUM(steps) as total_steps,
  MAX(weight) - MIN(weight) as weight_change,
  MODE() WITHIN GROUP (ORDER BY sleep_quality) as most_common_sleep_quality,
  MODE() WITHIN GROUP (ORDER BY activity_type) as most_common_activity_type
FROM public.health_metrics
GROUP BY user_id, date_trunc('week', created_at);
