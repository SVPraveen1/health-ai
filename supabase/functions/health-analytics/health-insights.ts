import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from "../_shared/cors.ts";

interface AnalyticsRequest {
  user_id: string;
  start_date: string;
  end_date: string;
}

interface HealthMetric {
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  sleep_hours: number;
  sleep_quality: string;
  activity_minutes: number;
  activity_type: string;
  weight: number;
  steps: number;
  mood: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, start_date, end_date }: AnalyticsRequest = await req.json();

    // Get metrics for the specified date range
    const { data: metrics, error: metricsError } = await supabaseClient
      .from('health_metrics')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', start_date)
      .lte('created_at', end_date)
      .order('created_at', { ascending: true });

    if (metricsError) throw metricsError;

    // Get goals for the date range
    const { data: goals, error: goalsError } = await supabaseClient
      .from('health_goals')
      .select('*')
      .eq('user_id', user_id)
      .lte('deadline', end_date)
      .order('deadline', { ascending: true });

    if (goalsError) throw goalsError;

    // Calculate metrics
    const weeklyMetrics = {
      averageHeartRate: calculateAverage(metrics, 'heart_rate'),
      averageSystolicBP: calculateAverage(metrics, 'systolic_bp'),
      averageDiastolicBP: calculateAverage(metrics, 'diastolic_bp'),
      averageSleepHours: calculateAverage(metrics, 'sleep_hours'),
      totalActivityMinutes: calculateSum(metrics, 'activity_minutes'),
      totalSteps: calculateSum(metrics, 'steps'),
      weightChange: calculateWeightChange(metrics),
      sleepQualityTrend: analyzeTrend(metrics, 'sleep_quality'),
      activityConsistency: analyzeActivityConsistency(metrics),
    };

    // Generate insights
    const insights = generateHealthInsights(metrics, weeklyMetrics, goals);

    // Prepare goals summary
    const goalsAnalysis = {
      completed: goals.filter(g => g.completed).length,
      total: goals.length,
      nextDeadlines: goals
        .filter(g => !g.completed)
        .slice(0, 3)
        .map(g => ({
          title: g.title,
          deadline: g.deadline,
        })),
    };

    // Store the weekly report
    const { error: reportError } = await supabaseClient
      .from('health_reports')
      .insert({
        user_id,
        start_date,
        end_date,
        metrics: weeklyMetrics,
        goals_summary: goalsAnalysis,
        insights,
      });

    if (reportError) throw reportError;

    return new Response(
      JSON.stringify({
        metrics: weeklyMetrics,
        goals: goalsAnalysis,
        insights,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function calculateAverage(metrics: HealthMetric[], field: keyof HealthMetric): number {
  const values = metrics
    .map(m => m[field])
    .filter(v => typeof v === 'number') as number[];
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function calculateSum(metrics: HealthMetric[], field: keyof HealthMetric): number {
  return metrics
    .map(m => m[field])
    .filter(v => typeof v === 'number')
    .reduce((a, b) => a + (b as number), 0);
}

function calculateWeightChange(metrics: HealthMetric[]): number {
  const weights = metrics
    .map(m => m.weight)
    .filter(w => w !== null) as number[];
  return weights.length >= 2 ? weights[weights.length - 1] - weights[0] : 0;
}

function analyzeTrend(metrics: HealthMetric[], field: keyof HealthMetric): string {
  if (metrics.length < 3) return 'insufficient data';

  const values = metrics.map(m => m[field]);
  let improving = 0;
  let declining = 0;

  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    
    if (field === 'sleep_quality') {
      const qualityRank = {
        'poor': 0,
        'fair': 1,
        'good': 2,
        'excellent': 3,
      };
      if (qualityRank[curr as string] > qualityRank[prev as string]) improving++;
      if (qualityRank[curr as string] < qualityRank[prev as string]) declining++;
    } else {
      if (curr > prev) improving++;
      if (curr < prev) declining++;
    }
  }

  if (improving > declining * 1.5) return 'improving';
  if (declining > improving * 1.5) return 'declining';
  return 'stable';
}

function analyzeActivityConsistency(metrics: HealthMetric[]): string {
  const activityDays = new Set(
    metrics
      .filter(m => m.activity_minutes > 0)
      .map(m => new Date(m.created_at).toISOString().split('T')[0])
  ).size;

  const totalDays = Math.ceil(
    (new Date(metrics[metrics.length - 1].created_at).getTime() -
      new Date(metrics[0].created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const consistency = (activityDays / totalDays) * 100;

  if (consistency >= 80) return 'excellent';
  if (consistency >= 60) return 'good';
  if (consistency >= 40) return 'fair';
  return 'poor';
}

function generateHealthInsights(
  metrics: HealthMetric[],
  weeklyMetrics: any,
  goals: any[]
): Array<{ type: 'success' | 'warning' | 'info'; message: string }> {
  const insights: Array<{ type: 'success' | 'warning' | 'info'; message: string }> = [];

  // Heart health insights
  if (weeklyMetrics.averageHeartRate > 100) {
    insights.push({
      type: 'warning',
      message: 'Your average heart rate is elevated. Consider stress-reduction activities and consult your healthcare provider.',
    });
  }

  if (weeklyMetrics.averageSystolicBP >= 140 || weeklyMetrics.averageDiastolicBP >= 90) {
    insights.push({
      type: 'warning',
      message: 'Your blood pressure readings indicate hypertension. Schedule a check-up with your doctor.',
    });
  }

  // Sleep insights
  if (weeklyMetrics.averageSleepHours < 7) {
    insights.push({
      type: 'warning',
      message: 'You\'re averaging less than 7 hours of sleep. Aim for 7-9 hours for optimal health.',
    });
  } else if (weeklyMetrics.sleepQualityTrend === 'improving') {
    insights.push({
      type: 'success',
      message: 'Your sleep quality is improving! Keep maintaining good sleep hygiene.',
    });
  }

  // Activity insights
  if (weeklyMetrics.totalActivityMinutes >= 150) {
    insights.push({
      type: 'success',
      message: 'Great job! You\'ve met the WHO\'s recommended 150 minutes of weekly activity.',
    });
  } else {
    insights.push({
      type: 'info',
      message: `You're ${150 - weeklyMetrics.totalActivityMinutes} minutes short of the weekly activity goal.`,
    });
  }

  if (weeklyMetrics.activityConsistency === 'excellent') {
    insights.push({
      type: 'success',
      message: 'Excellent activity consistency! You\'re building healthy habits.',
    });
  }

  // Goals insights
  const completionRate = goals.filter(g => g.completed).length / goals.length;
  if (completionRate >= 0.8) {
    insights.push({
      type: 'success',
      message: 'You\'re making great progress on your health goals!',
    });
  } else if (completionRate < 0.3) {
    insights.push({
      type: 'info',
      message: 'Consider breaking down your health goals into smaller, manageable steps.',
    });
  }

  // Weight insights
  if (Math.abs(weeklyMetrics.weightChange) > 2) {
    insights.push({
      type: 'info',
      message: `Your weight has changed by ${Math.abs(weeklyMetrics.weightChange)}kg this week.`,
    });
  }

  return insights;
}
