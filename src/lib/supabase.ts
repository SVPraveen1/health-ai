
import { supabase } from '@/integrations/supabase/client';

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

// Health metrics (heart rate, blood pressure) helpers
export const getHealthMetrics = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
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

export { supabase };
