-- Create health goals table
CREATE TABLE IF NOT EXISTS public.health_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title varchar(255) not null,
  description text,
  type varchar(50) not null,
  target numeric not null,
  current_value numeric default 0,
  unit varchar(50) not null,
  start_date timestamp with time zone default now(),
  end_date timestamp with time zone not null,
  status varchar(20) not null default 'in_progress' check (status in ('in_progress', 'completed', 'failed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create weekly health reports table
CREATE TABLE IF NOT EXISTS public.weekly_health_reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  week_start timestamp with time zone not null,
  week_end timestamp with time zone not null,
  avg_heart_rate numeric,
  avg_systolic_bp numeric,
  avg_diastolic_bp numeric,
  avg_sleep_hours numeric,
  total_activity_minutes numeric,
  avg_water_intake numeric,
  total_steps numeric,
  weight_change numeric,
  goals_progress jsonb,
  insights jsonb,
  created_at timestamp with time zone default now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_health_goals_user_id ON public.health_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id ON public.weekly_health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_start ON public.weekly_health_reports(week_start);

-- Add RLS policies
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_health_reports ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can view their own goals"
  ON public.health_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON public.health_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.health_goals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view their own reports"
  ON public.weekly_health_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
  ON public.weekly_health_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON public.weekly_health_reports
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to generate weekly reports
CREATE OR REPLACE FUNCTION generate_weekly_report(
  p_user_id uuid,
  p_week_start timestamp with time zone
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_week_end timestamp with time zone;
  v_report_data jsonb;
BEGIN
  p_week_end := p_week_start + interval '7 days';

  -- Insert or update weekly report
  INSERT INTO weekly_health_reports (
    user_id,
    week_start,
    week_end,
    avg_heart_rate,
    avg_systolic_bp,
    avg_diastolic_bp,
    avg_sleep_hours,
    total_activity_minutes,
    avg_water_intake,
    total_steps,
    weight_change,
    goals_progress,
    insights
  )
  SELECT
    p_user_id,
    p_week_start,
    p_week_end,
    AVG(heart_rate),
    AVG(systolic_bp),
    AVG(diastolic_bp),
    AVG(sleep_hours),
    SUM(activity_minutes),
    AVG(water_intake),
    SUM(steps),
    LAST_VALUE(weight) OVER (ORDER BY created_at) - FIRST_VALUE(weight) OVER (ORDER BY created_at),
    (
      SELECT jsonb_build_object(
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'total', COUNT(*),
        'nextDeadlines', jsonb_agg(
          jsonb_build_object(
            'title', title,
            'deadline', end_date
          )
        ) FILTER (WHERE status = 'in_progress')
      )
      FROM health_goals g
      WHERE g.user_id = p_user_id
      AND g.created_at <= p_week_end
      AND (g.end_date >= p_week_start OR g.status != 'completed')
    ),
    NULL -- insights will be generated by the application
  FROM health_metrics
  WHERE user_id = p_user_id
  AND created_at >= p_week_start
  AND created_at < p_week_end
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    avg_heart_rate = EXCLUDED.avg_heart_rate,
    avg_systolic_bp = EXCLUDED.avg_systolic_bp,
    avg_diastolic_bp = EXCLUDED.avg_diastolic_bp,
    avg_sleep_hours = EXCLUDED.avg_sleep_hours,
    total_activity_minutes = EXCLUDED.total_activity_minutes,
    avg_water_intake = EXCLUDED.avg_water_intake,
    total_steps = EXCLUDED.total_steps,
    weight_change = EXCLUDED.weight_change,
    goals_progress = EXCLUDED.goals_progress,
    updated_at = now();
END;
$$;
