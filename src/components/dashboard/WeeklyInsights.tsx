import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WeeklyReport } from "@/types/health-metrics";
import { BarChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar } from 'recharts';
import { Download, TrendingUp, TrendingDown, Activity, Moon, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface Props {
  weeklyData: WeeklyReport;
  onExport: (format: 'pdf' | 'csv') => void;
}

const WeeklyInsights: React.FC<Props> = ({ weeklyData, onExport }) => {
  const [selectedMetric, setSelectedMetric] = useState<'sleep' | 'activity' | 'heart'>('activity');

  const getMetricData = () => {
    switch (selectedMetric) {
      case 'sleep':
        return [
          { name: 'Sleep Hours', value: weeklyData.metrics.averageSleepHours, color: '#9333ea' },
          { name: 'Deep Sleep', value: weeklyData.metrics.averageSleepHours * 0.3, color: '#6b21a8' },
        ];
      case 'activity':
        return [
          { name: 'Activity Minutes', value: weeklyData.metrics.totalActivityMinutes, color: '#06b6d4' },
          { name: 'Steps', value: weeklyData.metrics.totalSteps / 100, color: '#0891b2' },
        ];
      case 'heart':
        return [
          { name: 'Heart Rate', value: weeklyData.metrics.averageHeartRate, color: '#ef4444' },
          { name: 'Systolic BP', value: weeklyData.metrics.averageSystolicBP, color: '#dc2626' },
          { name: 'Diastolic BP', value: weeklyData.metrics.averageDiastolicBP, color: '#b91c1c' },
        ];
      default:
        return [];
    }
  };

  const getInsightColor = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weekly Health Report</h2>
          <p className="text-muted-foreground">
            {format(new Date(weeklyData.startDate), 'MMM d')} - {format(new Date(weeklyData.endDate), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onExport('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => onExport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card 
            className={`cursor-pointer ${selectedMetric === 'activity' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedMetric('activity')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-blue-500" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{weeklyData.metrics.totalActivityMinutes} mins</p>
                <p className="text-sm text-muted-foreground">Weekly activity</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card 
            className={`cursor-pointer ${selectedMetric === 'sleep' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedMetric('sleep')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Moon className="mr-2 h-5 w-5 text-purple-500" />
                Sleep
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{weeklyData.metrics.averageSleepHours}h</p>
                <p className="text-sm text-muted-foreground">Avg. sleep duration</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card 
            className={`cursor-pointer ${selectedMetric === 'heart' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedMetric('heart')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Heart className="mr-2 h-5 w-5 text-red-500" />
                Heart Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{weeklyData.metrics.averageHeartRate} BPM</p>
                <p className="text-sm text-muted-foreground">Avg. heart rate</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getMetricData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar 
                  dataKey="value"
                  fill="url(#colorGradient)"
                >
                  {getMetricData().map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
        <div className="space-y-3">
          {weeklyData.insights.map((insight, index) => (
            <Alert key={index} className={getInsightColor(insight.type)}>
              <AlertDescription>
                {insight.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goals Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Completed Goals</span>
              <span className="font-medium">{weeklyData.goals.completed}/{weeklyData.goals.total}</span>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
              {weeklyData.goals.nextDeadlines.map((goal, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{goal.title}</span>
                  <span className="text-muted-foreground">{format(new Date(goal.deadline), 'MMM d')}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyInsights;