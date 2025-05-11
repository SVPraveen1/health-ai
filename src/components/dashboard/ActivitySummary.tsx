import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Bed, Activity, Moon, Footprints, Scale, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { HealthMetric } from "@/types/health-metrics";

interface Props {
  metric: HealthMetric;
}

const ActivitySummary: React.FC<Props> = ({ metric }) => {
  const getActivityProgress = () => {
    const target = 150; // Weekly WHO recommendation in minutes
    return Math.min((metric.activity_minutes / target) * 100, 100);
  };

  const getSleepProgress = () => {
    const target = 8; // Recommended hours
    return Math.min((metric.sleep_hours / target) * 100, 100);
  };
  const getStepsProgress = () => {
    const target = 10000; // Daily step goal
    return Math.min((metric.steps / target) * 100, 100);
  };
  const getSleepQualityColor = () => {
    switch (metric.sleep_quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-emerald-500';
      case 'fair': return 'text-amber-500';
      case 'poor': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getActivityColor = () => {
    switch (metric.activity_type) {
      case 'vigorous': return 'text-green-500';
      case 'moderate': return 'text-emerald-500';
      case 'light': return 'text-amber-500';
      case 'sedentary': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getMoodEmoji = () => {
    switch (metric.mood) {
      case 'great': return '😊';
      case 'good': return '🙂';
      case 'neutral': return '😐';
      case 'stressed': return '😓';
      default: return '🤔';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Sleep Card */}
      <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card className="bg-card/95 hover:bg-card/90 transition-colors backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-primary/90">
              <Moon className="mr-2 h-5 w-5" />
              Sleep
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metric.sleep_hours}h</span>
              <span className={`text-sm font-medium ${getSleepQualityColor()}`}>
                {metric.sleep_quality.charAt(0).toUpperCase() + metric.sleep_quality.slice(1)}
              </span>
            </div>
            <Progress value={getSleepProgress()} className="h-2" />
            <p className="text-xs text-muted-foreground">Goal: 8 hours</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Card */}
      <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card className="bg-card/95 hover:bg-card/90 transition-colors backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-primary/90">
              <Activity className="mr-2 h-5 w-5" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metric.activity_minutes}m</span>
              <span className={`text-sm font-medium ${getActivityColor()}`}>
                {metric.activity_type.charAt(0).toUpperCase() + metric.activity_type.slice(1)}
              </span>
            </div>
            <Progress value={getActivityProgress()} className="h-2" />
            <p className="text-xs text-muted-foreground">Goal: 150 minutes/week</p>
          </CardContent>
        </Card>
      </motion.div>      {/* Steps Card */}
      <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card className="bg-card/95 hover:bg-card/90 transition-colors backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-primary/90">
              <Footprints className="mr-2 h-5 w-5" />
              Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metric.steps.toLocaleString()}</span>
              <span className="text-2xl">{getMoodEmoji()}</span>
            </div>
            <Progress value={getStepsProgress()} className="h-2" />
            <p className="text-xs text-muted-foreground">Goal: 10,000 steps</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ActivitySummary;