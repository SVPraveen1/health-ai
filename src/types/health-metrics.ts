export interface HealthMetric {
  id: string;
  user_id: string;  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  sleep_hours: number;
  sleep_quality: 'poor' | 'fair' | 'good' | 'excellent';
  activity_minutes: number;
  activity_type: 'sedentary' | 'light' | 'moderate' | 'vigorous';
  weight: number;
  steps: number;
  mood: 'stressed' | 'neutral' | 'good' | 'great';
  created_at: string;
  analytics?: {
    risk_score?: number;
    recommendations?: string[];
    trends?: {
      heart_rate: 'stable' | 'improving' | 'declining' | 'highly variable';
      blood_pressure: 'stable' | 'improving' | 'declining' | 'highly variable';
      sleep: 'stable' | 'improving' | 'declining' | 'highly variable';
      activity: 'stable' | 'improving' | 'declining' | 'highly variable';
    };
  };
}

export interface HealthGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: 'sleep' | 'activity' | 'weight' | 'steps' | 'blood_pressure' | 'heart_rate';
  target: number;
  deadline: string;
  progress: number;
  created_at: string;
  updated_at: string;
  completed: boolean;
}

export interface WeeklyReport {
  startDate: string;
  endDate: string;
  metrics: {
    averageHeartRate: number;
    averageSystolicBP: number;
    averageDiastolicBP: number;
    averageSleepHours: number;
    totalActivityMinutes: number;
    totalSteps: number;
    weightChange: number;
    sleepQualityTrend: string;
    activityConsistency: string;
  };
  goals: {
    completed: number;
    total: number;
    nextDeadlines: Array<{
      title: string;
      deadline: string;
    }>;
  };
  insights: Array<{
    type: 'success' | 'warning' | 'info';
    message: string;
  }>;
}
