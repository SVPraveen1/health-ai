import { createClient } from '@supabase/supabase-js'
import { HealthMetric, HealthAnalyticsResponse, Deno } from './types'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Get request body
    const { metrics } = await req.json()
    if (!metrics || !Array.isArray(metrics)) {
      throw new Error('Invalid metrics data')
    }

    // Analyze metrics
    const analytics: HealthAnalyticsResponse = {
      analytics: {}
    }

    // Process each metric
    metrics.forEach((metric: HealthMetric) => {
      const riskScore = calculateRiskScore(metric)
      const recommendations = generateRecommendations(metric, riskScore)

      analytics.analytics[metric.id] = {
        risk_score: riskScore,
        recommendations
      }
    })

    return new Response(
      JSON.stringify(analytics),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}

function calculateRiskScore(metric: HealthMetric): number {
  let score = 0

  // Heart rate analysis
  if (metric.heart_rate > 100 || metric.heart_rate < 60) {
    score += 20
  }

  // Blood pressure analysis
  if (metric.systolic_bp >= 140 || metric.diastolic_bp >= 90) {
    score += 30
  } else if (metric.systolic_bp >= 130 || metric.diastolic_bp >= 85) {
    score += 15
  }

  return Math.min(100, score)
}

function generateRecommendations(metric: HealthMetric, riskScore: number): string[] {
  const recommendations: string[] = []

  // Heart rate recommendations
  if (metric.heart_rate > 100) {
    recommendations.push('Your heart rate is elevated. Consider stress reduction techniques and consult your doctor.')
  } else if (metric.heart_rate < 60) {
    recommendations.push('Your heart rate is lower than normal. Monitor for symptoms like dizziness or fatigue.')
  }

  // Blood pressure recommendations
  if (metric.systolic_bp >= 140 || metric.diastolic_bp >= 90) {
    recommendations.push('Your blood pressure is high. Consider reducing salt intake and increasing exercise.')
  } else if (metric.systolic_bp < 90 || metric.diastolic_bp < 60) {
    recommendations.push('Your blood pressure is low. Stay hydrated and monitor for dizziness.')
  }

  // General recommendations based on risk score
  if (riskScore >= 50) {
    recommendations.push('Consider scheduling a check-up with your healthcare provider.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Your readings are within normal ranges. Keep up the good work!')
  }

  return recommendations
}

export { handler as default }