-- Create health reminders table
CREATE TABLE IF NOT EXISTS public.health_reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  type varchar(50) not null check (type in ('vitals', 'medication', 'appointment')),
  frequency varchar(50) not null check (frequency in ('daily', 'weekly', 'monthly', 'custom')),
  time_of_day time not null,
  last_triggered timestamp with time zone,
  days_of_week integer[], -- For weekly reminders, store days 0-6 (Sunday-Saturday)
  days_of_month integer[], -- For monthly reminders
  custom_interval interval, -- For custom intervals
  enabled boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS policies
ALTER TABLE public.health_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON public.health_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON public.health_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.health_reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.health_reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to process reminders and create notifications
CREATE OR REPLACE FUNCTION process_health_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder RECORD;
BEGIN
  FOR reminder IN
    SELECT hr.*
    FROM health_reminders hr
    WHERE enabled = true
    AND (
      last_triggered IS NULL
      OR (
        frequency = 'daily'
        AND last_triggered < current_date + time_of_day
      )
      OR (
        frequency = 'weekly'
        AND extract(dow from now()) = ANY(days_of_week)
        AND last_triggered < current_date + time_of_day
      )
      OR (
        frequency = 'monthly'
        AND extract(day from now()) = ANY(days_of_month)
        AND last_triggered < current_date + time_of_day
      )
      OR (
        frequency = 'custom'
        AND last_triggered + custom_interval < now()
      )
    )
  LOOP
    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      content,
      status
    ) VALUES (
      reminder.user_id,
      'health_alert',
      CASE reminder.type
        WHEN 'vitals' THEN 'Time to log your vital signs!'
        WHEN 'medication' THEN 'Time to take your medication'
        WHEN 'appointment' THEN 'Upcoming appointment reminder'
      END,
      'sent'
    );

    -- Update last_triggered
    UPDATE health_reminders
    SET last_triggered = now()
    WHERE id = reminder.id;
  END LOOP;
END;
$$;

-- Create a cron job to run every 15 minutes
SELECT cron.schedule(
  'process-health-reminders',
  '*/15 * * * *',
  'SELECT process_health_reminders();'
);
