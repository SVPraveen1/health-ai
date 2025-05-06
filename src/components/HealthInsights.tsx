import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Activity, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  latestMetric?: {
    heart_rate: number;
    systolic_bp: number;
    diastolic_bp: number;
    analytics?: {
      risk_score?: number;
      recommendations?: string[];
    };
  };
}

const HealthInsights: React.FC<Props> = ({ latestMetric }) => {
  if (!latestMetric) return null;

  const getRiskLevel = (score?: number) => {
    if (!score) return "normal";
    if (score >= 70) return "high";
    if (score >= 40) return "moderate";
    return "normal";
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-600";
      case "moderate":
        return "text-amber-600";
      default:
        return "text-green-600";
    }
  };

  const riskLevel = getRiskLevel(latestMetric.analytics?.risk_score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5 text-primary" />
          Health Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Risk Level</span>
            <span className={`text-sm font-medium ${getRiskColor(riskLevel)}`}>
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
            </span>
          </div>
          {latestMetric.analytics?.risk_score && (
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  riskLevel === "high"
                    ? "bg-red-500"
                    : riskLevel === "moderate"
                    ? "bg-amber-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${latestMetric.analytics.risk_score}%` }}
              />
            </div>
          )}
        </div>

        {latestMetric.analytics?.recommendations && latestMetric.analytics.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Recommendations</h4>
            <div className="space-y-2">
              {latestMetric.analytics.recommendations.map((recommendation, index) => (
                <Alert key={index} variant="default" className="py-2">
                  <AlertDescription className="text-sm">{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthInsights;