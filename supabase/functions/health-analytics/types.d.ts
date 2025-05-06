declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  }

  export const env: Env;
}

export interface HealthMetric {
  id: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  created_at: string;
  user_id: string;
}

export interface HealthAnalytics {
  [key: string]: {
    risk_score: number;
    recommendations: string[];
  }
}

export interface HealthAnalyticsResponse {
  analytics: HealthAnalytics;
}