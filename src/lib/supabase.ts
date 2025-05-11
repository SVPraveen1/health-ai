import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database helpers for medication
export const getMedications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching medications:", error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Exception fetching medications:", error);
    return { data: null, error };
  }
};

export const addMedication = async (medication: any, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('medications')
      .insert([{ ...medication, user_id: userId }])
      .select();
    
    if (error) {
      console.error("Error adding medication:", error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Exception adding medication:", error);
    return { data: null, error };
  }
};

export const updateMedication = async (id: string, medication: any) => {
  try {
    const { data, error } = await supabase
      .from('medications')
      .update(medication)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error("Error updating medication:", error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Exception updating medication:", error);
    return { data: null, error };
  }
};

export const deleteMedication = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      console.error("Error deleting medication:", error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Exception deleting medication:", error);
    return { data: null, error };
  }
};

// Health metrics (heart rate, blood pressure, sleep, activity) helpers
export const getHealthMetrics = async (userId: string, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching health metrics:", error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Exception fetching health metrics:", error);
    return { data: null, error };
  }
};

// Health goals management
export const addHealthGoal = async (
  userId: string,
  goal: Omit<Database['public']['Tables']['health_goals']['Row'], 'id' | 'created_at' | 'updated_at' | 'status'>
) => {
  try {
    const { data, error } = await supabase
      .from('health_goals')
      .insert([{ ...goal, user_id: userId, status: 'in_progress' }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Exception adding health goal:", error);
    return { data: null, error };
  }
};

export const getHealthGoals = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('health_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Exception fetching health goals:", error);
    return { data: null, error };
  }
};

export const updateHealthGoal = async (
  goalId: string,
  userId: string,
  updates: Partial<Database['public']['Tables']['health_goals']['Row']>
) => {
  try {
    const { data, error } = await supabase
      .from('health_goals')
      .update(updates)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Exception updating health goal:", error);
    return { data: null, error };
  }
};

// Weekly health reports and analytics
export const getWeeklyReport = async (userId: string, date = new Date()) => {
  try {
    const startDate = date.toISOString().split('T')[0];
    const endDate = new Date(date.setDate(date.getDate() + 7)).toISOString().split('T')[0];

    // Try to get existing report first
    const { data: existingReport, error: reportError } = await supabase
      .from('health_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('start_date', startDate)
      .single();

    if (existingReport) {
      return { data: existingReport, error: null };
    }

    // Generate new report if not found
    const { data, error } = await supabase.functions.invoke('health-insights', {
      body: {
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
      },
    });

    if (error) throw error;
    return { data, error: null };

  } catch (error) {
    console.error("Exception getting weekly report:", error);
    return { data: null, error };
  }
};

// Health data export
export const exportHealthData = async (userId: string, format: 'pdf' | 'csv') => {
  try {
    const { data: metrics } = await getHealthMetrics(userId, 1000);
    if (!metrics) return { data: null, error: "No metrics found" };

    if (format === 'csv') {
      const headers = [
        'Date',
        'Heart Rate',
        'Systolic BP',
        'Diastolic BP',
        'Sleep Hours',
        'Sleep Quality',
        'Activity Minutes',
        'Activity Type',
        'Steps',
        'Weight',
        'Mood',
      ];

      const rows = metrics.map(m => [
        new Date(m.created_at).toLocaleDateString(),
        m.heart_rate,
        m.systolic_bp,
        m.diastolic_bp,
        m.sleep_hours,
        m.sleep_quality,
        m.activity_minutes,
        m.activity_type,
        m.steps,
        m.weight,
        m.mood,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      return { data: URL.createObjectURL(blob), error: null };
    }

    // Generate PDF report
    const { data, error } = await supabase.functions.invoke('generate-health-report', {
      body: { 
        user_id: userId,
        format: 'pdf',
      },
    });

    return { data, error };
  } catch (error) {
    console.error("Exception exporting health data:", error);
    return { data: null, error };
  }
};

export const addHealthMetric = async (metric: any, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('health_metrics')
      .insert([{ ...metric, user_id: userId, created_at: new Date().toISOString() }])
      .select();
    
    if (error) {
      console.error("Error adding health metric:", error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Exception adding health metric:", error);
    return { data: null, error };
  }
};


