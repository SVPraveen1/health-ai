export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      health_metrics: {
        Row: {
          id: string
          user_id: string
          heart_rate: number
          systolic_bp: number
          diastolic_bp: number
          sleep_hours: number | null
          sleep_quality: 'poor' | 'fair' | 'good' | 'excellent' | null
          activity_minutes: number | null
          activity_type: 'sedentary' | 'light' | 'moderate' | 'vigorous' | null
          water_intake: number | null // in milliliters
          weight: number | null
          steps: number | null
          mood: 'stressed' | 'neutral' | 'good' | 'great' | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['health_metrics']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['health_metrics']['Row']>
      }
      health_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          type: 'sleep' | 'activity' | 'water' | 'weight' | 'steps' | 'blood_pressure' | 'heart_rate'
          target: number
          current_value: number
          unit: string
          start_date: string
          end_date: string
          status: 'in_progress' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['health_goals']['Row'], 'id' | 'created_at' | 'updated_at' | 'status'>
        Update: Partial<Database['public']['Tables']['health_goals']['Row']>
      }
      weekly_health_reports: {
        Row: {
          id: string
          user_id: string
          week_start: string
          week_end: string
          avg_heart_rate: number | null
          avg_systolic_bp: number | null
          avg_diastolic_bp: number | null
          avg_sleep_hours: number | null
          total_activity_minutes: number | null
          avg_water_intake: number | null
          total_steps: number | null
          weight_change: number | null
          goals_progress: Json
          insights: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['weekly_health_reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['weekly_health_reports']['Row']>
      }
      medications: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string
          frequency: string
          start_date: string
          end_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['medications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['medications']['Row']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
      health_reminders: {
        Row: {
          id: string
          user_id: string
          type: 'vitals' | 'medication' | 'appointment'
          frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
          time_of_day: string
          last_triggered: string | null
          days_of_week: number[] | null
          days_of_month: number[] | null
          custom_interval: string | null
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['health_reminders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['health_reminders']['Row']>
      }
    }
    Views: {
      weekly_health_metrics: {
        Row: {
          user_id: string
          week_start: string
          week_end: string
          avg_heart_rate: number
          avg_systolic_bp: number
          avg_diastolic_bp: number
          avg_sleep_hours: number | null
          total_activity_minutes: number | null
          total_steps: number | null
          weight_change: number | null
          most_common_sleep_quality: string | null
          most_common_activity_type: string | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
