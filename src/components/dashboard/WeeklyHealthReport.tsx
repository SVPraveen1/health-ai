import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { WeeklyReport } from '@/types/health-metrics';

interface Props {
  weeklyData: {
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
      avgWaterIntake: number;
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
      type: string;
      message: string;
    }>;
  };
  onWeekChange: (startDate: Date) => void;
  currentWeekStart: Date;
}

export function WeeklyHealthReport({ weeklyData, onWeekChange, currentWeekStart }: Props) {
  const weekStart = format(currentWeekStart, 'MMM d, yyyy');
  const weekEnd = format(endOfWeek(currentWeekStart), 'MMM d, yyyy');

  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    onWeekChange(addWeeks(currentWeekStart, 1));
  };

  const isCurrentWeek = format(new Date(), 'w-yyyy') === format(currentWeekStart, 'w-yyyy');

  const healthScore = Math.round(
    (weeklyData.metrics.averageSleepHours / 8) * 0.3 +
    (weeklyData.metrics.totalActivityMinutes / 150) * 0.3 +
    (weeklyData.metrics.totalSteps / (10000 * 7)) * 0.2 +
    (weeklyData.goals.completed / weeklyData.goals.total) * 0.2
  );

  const chartData = weeklyData.metrics;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Weekly Health Report</CardTitle>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2 px-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {weekStart} - {weekEnd}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextWeek}
              disabled={isCurrentWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {/* Health Score */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">Weekly Health Score</h3>
              <p className="text-sm text-muted-foreground">Based on activity, sleep, and goals</p>
            </div>
            <div className="text-4xl font-bold">{healthScore}/100</div>
          </div>

          {/* Health Metrics Chart */}
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[chartData]}>
                <defs>
                  <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="averageSleepHours"
                  name="Sleep"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorSleep)"
                />
                <Area
                  type="monotone"
                  dataKey="totalActivityMinutes"
                  name="Activity"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorActivity)"
                />
                <Area
                  type="monotone"
                  dataKey="waterIntake"
                  name="Water (ml)"
                  stroke="#f97316"
                  fillOpacity={1}
                  fill="url(#colorWater)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Water Intake Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Water Intake</h3>
            <div className="grid gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Weekly Average</span>
                  <span className="text-lg font-semibold">{Math.round(weeklyData.metrics.avgWaterIntake)} ml</span>
                </div>
                <Progress 
                  value={Math.min((weeklyData.metrics.avgWaterIntake / 2000) * 100, 100)} 
                  className="h-2 mt-2" 
                />
              </div>
              {weeklyData.metrics.avgWaterIntake < 2000 && (
                <div className="p-4 bg-amber-500/10 text-amber-700 rounded-lg text-sm">
                  Try to increase your daily water intake to reach the recommended 2000ml per day.
                </div>
              )}
            </div>
          </div>

          {/* Weekly Insights */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Weekly Insights</h3>
            <div className="grid gap-4">
              {weeklyData.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-700' :
                    insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-700' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-700'
                  }`}
                >
                  {insight.message}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Goals Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Goals Progress</h3>
              <span className="text-sm text-muted-foreground">
                {weeklyData.goals.completed} of {weeklyData.goals.total} completed
              </span>
            </div>
            <div className="space-y-2">
              {weeklyData.goals.nextDeadlines.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <span className="font-medium">{goal.title}</span>
                  <span className="text-sm text-muted-foreground">
                    Due {format(new Date(goal.deadline), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
