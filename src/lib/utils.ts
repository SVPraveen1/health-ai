import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateHealthMetrics = (metrics: any): ValidationResult => {
  const errors: string[] = [];

  // Heart rate validation
  if (metrics.heart_rate) {
    if (metrics.heart_rate < 30 || metrics.heart_rate > 200) {
      errors.push("Heart rate should be between 30 and 200 bpm");
    }
  }

  // Blood pressure validation
  if (metrics.systolic_bp && metrics.diastolic_bp) {
    if (metrics.systolic_bp < 70 || metrics.systolic_bp > 250) {
      errors.push("Systolic blood pressure should be between 70 and 250 mmHg");
    }
    if (metrics.diastolic_bp < 40 || metrics.diastolic_bp > 150) {
      errors.push("Diastolic blood pressure should be between 40 and 150 mmHg");
    }
    if (metrics.systolic_bp <= metrics.diastolic_bp) {
      errors.push("Systolic pressure must be higher than diastolic pressure");
    }
  }

  // Water intake validation
  if (metrics.water_intake) {
    if (metrics.water_intake < 0 || metrics.water_intake > 10000) {
      errors.push("Water intake should be between 0 and 10000 ml");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePredictionData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Age validation
  if (data.age) {
    const age = parseInt(data.age);
    if (isNaN(age) || age < 1 || age > 120) {
      errors.push("Age should be between 1 and 120 years");
    }
  }

  // Height and weight validation
  if (data.height && data.weight) {
    const height = parseFloat(data.height);
    const weight = parseFloat(data.weight);
    
    if (isNaN(height) || height < 50 || height > 250) {
      errors.push("Height should be between 50 and 250 cm");
    }
    if (isNaN(weight) || weight < 1 || weight > 500) {
      errors.push("Weight should be between 1 and 500 kg");
    }
  }

  // Blood pressure validation
  if (data.bpSystolic && data.bpDiastolic) {
    const systolic = parseInt(data.bpSystolic);
    const diastolic = parseInt(data.bpDiastolic);
    
    if (isNaN(systolic) || systolic < 70 || systolic > 250) {
      errors.push("Systolic blood pressure should be between 70 and 250 mmHg");
    }
    if (isNaN(diastolic) || diastolic < 40 || diastolic > 150) {
      errors.push("Diastolic blood pressure should be between 40 and 150 mmHg");
    }
    if (systolic <= diastolic) {
      errors.push("Systolic pressure must be higher than diastolic pressure");
    }
  }

  // Heart rate validation
  if (data.heartRate) {
    const hr = parseInt(data.heartRate);
    if (isNaN(hr) || hr < 30 || hr > 200) {
      errors.push("Heart rate should be between 30 and 200 bpm");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const calculateHealthRisk = (metrics: any, trends: any): number => {
  let riskScore = 0;
  
  // Blood pressure risk
  if (metrics.systolic_bp >= 140 || metrics.diastolic_bp >= 90) {
    riskScore += 30;
  } else if (metrics.systolic_bp >= 130 || metrics.diastolic_bp >= 85) {
    riskScore += 15;
  }

  // Heart rate risk
  if (metrics.heart_rate > 100 || metrics.heart_rate < 60) {
    riskScore += 20;
  }

  // Trend-based risk
  if (trends) {
    if (trends.heart_rate === "highly variable") riskScore += 15;
    if (trends.blood_pressure === "highly variable") riskScore += 15;
    if (trends.heart_rate === "declining") riskScore += 10;
    if (trends.blood_pressure === "declining") riskScore += 10;
  }

  return Math.min(100, riskScore);
};
