export interface HealthMetric {
  id: string;
  user_id: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  water_intake: number;
  created_at: string;
}

export interface HealthScore {
  total: number;
  breakdown: {
    vitals: number;
    lifestyle: number;
    consistency: number;
  };
  lastUpdated: string;
}

export interface DiseaseRisk {
  disease: string;
  risk: number;
  factors: string[];
  recommendation: string;
}

export interface AnalyticsResult {
  trends: {
    heart_rate: "stable" | "improving" | "declining" | "highly variable";
    blood_pressure: "stable" | "improving" | "declining" | "highly variable";
  };
  alerts: Array<{
    type: "warning" | "alert" | "info";
    message: string;
    metric: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
}

export interface PredictionFormData {
  age: string;
  gender: string;
  height: string;
  weight: string;
  bpSystolic: string;
  bpDiastolic: string;
  heartRate: string;
  cholesterol: "normal" | "borderline" | "high";
  glucose: "normal" | "borderline" | "high";
  smoker: "yes" | "no" | "former";
  alcoholConsumption: "none" | "light" | "moderate" | "heavy";
  exerciseHours: "0-1" | "1-3" | "3-5" | "5+";
  familyHistory: string[];
}