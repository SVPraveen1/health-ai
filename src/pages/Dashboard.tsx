import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Activity, Plus, Calendar, ChartLine, Save, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addHealthMetric, getHealthMetrics } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import HealthInsights from "@/components/HealthInsights";
import { NotificationCenter } from "@/components/Notifications";

interface HealthMetric {
  id: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  created_at: string;
  user_id: string;
  analytics?: {
    risk_score?: number;
    recommendations?: string[];
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMetric, setNewMetric] = useState({
    heart_rate: "",
    systolic_bp: "",
    diastolic_bp: ""
  });

  const analyzeHealthData = async (metrics: HealthMetric[]) => {
    try {
      // Process metrics directly instead of calling edge function
      const analytics: { [key: string]: { risk_score: number; recommendations: string[] } } = {};

      metrics.forEach((metric) => {
        let riskScore = 0;
        const recommendations: string[] = [];

        // Heart rate analysis
        if (metric.heart_rate > 100) {
          riskScore += 20;
          recommendations.push('Your heart rate is elevated. Consider stress reduction techniques and consult your doctor.');
        } else if (metric.heart_rate < 60) {
          riskScore += 15;
          recommendations.push('Your heart rate is lower than normal. Monitor for symptoms like dizziness or fatigue.');
        }

        // Blood pressure analysis
        if (metric.systolic_bp >= 140 || metric.diastolic_bp >= 90) {
          riskScore += 30;
          recommendations.push('Your blood pressure is high. Consider reducing salt intake and increasing exercise.');
        } else if (metric.systolic_bp < 90 || metric.diastolic_bp < 60) {
          riskScore += 20;
          recommendations.push('Your blood pressure is low. Stay hydrated and monitor for dizziness.');
        }

        // General recommendations based on risk score
        if (riskScore >= 50) {
          recommendations.push('Consider scheduling a check-up with your healthcare provider.');
        }

        if (recommendations.length === 0) {
          recommendations.push('Your readings are within normal ranges. Keep up the good work!');
        }

        analytics[metric.id] = {
          risk_score: Math.min(100, riskScore),
          recommendations
        };
      });

      // Update metrics with analytics data
      const updatedMetrics = metrics.map(metric => ({
        ...metric,
        analytics: analytics[metric.id]
      }));

      setHealthMetrics(updatedMetrics);
    } catch (error: any) {
      console.error("Error analyzing health data:", {
        message: error.message,
        error
      });
      toast({
        title: "Analytics Error",
        description: error.message || "Failed to analyze health data",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadHealthMetrics = async () => {
      if (user) {
        setLoading(true);
        setError(null);
        try {
          const { data, error } = await getHealthMetrics(user.id);
          if (error) throw error;
          setHealthMetrics(data || []);
          if (data && data.length > 0) {
            await analyzeHealthData(data);
          }
        } catch (error: any) {
          console.error("Error loading health metrics:", error);
          setError("Failed to load health metrics. Please try again later.");
          toast({
            title: "Error",
            description: "Failed to load health metrics",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadHealthMetrics();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMetric(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const metricData = {
        heart_rate: parseInt(newMetric.heart_rate),
        systolic_bp: parseInt(newMetric.systolic_bp),
        diastolic_bp: parseInt(newMetric.diastolic_bp)
      };

      // Validate inputs
      if (isNaN(metricData.heart_rate) || isNaN(metricData.systolic_bp) || isNaN(metricData.diastolic_bp)) {
        throw new Error("Please enter valid numeric values for all fields");
      }

      // Additional validation
      if (metricData.heart_rate <= 0 || metricData.systolic_bp <= 0 || metricData.diastolic_bp <= 0) {
        throw new Error("Values must be greater than zero");
      }

      const { error } = await addHealthMetric(metricData, user.id);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Health metrics added successfully"
      });

      // Refresh metrics
      const { data } = await getHealthMetrics(user.id);
      setHealthMetrics(data || []);
      if (data && data.length > 0) {
        await analyzeHealthData(data);
      }

      // Reset form
      setNewMetric({
        heart_rate: "",
        systolic_bp: "",
        diastolic_bp: ""
      });
    } catch (error: any) {
      console.error("Error adding health metric:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add health metrics",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const chartData = healthMetrics.map(metric => ({
    date: formatDate(metric.created_at),
    heartRate: metric.heart_rate,
    systolicBP: metric.systolic_bp,
    diastolicBP: metric.diastolic_bp
  })).reverse();

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Health Dashboard</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Reading
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Health Reading</DialogTitle>
              <DialogDescription>
                Record your current heart rate and blood pressure
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="heart_rate">Heart Rate (BPM)</Label>
                <Input
                  id="heart_rate"
                  name="heart_rate"
                  type="number"
                  placeholder="e.g., 72"
                  value={newMetric.heart_rate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Blood Pressure (mmHg)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="systolic_bp" className="text-sm">Systolic (top)</Label>
                    <Input
                      id="systolic_bp"
                      name="systolic_bp"
                      type="number"
                      placeholder="e.g., 120"
                      value={newMetric.systolic_bp}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="diastolic_bp" className="text-sm">Diastolic (bottom)</Label>
                    <Input
                      id="diastolic_bp"
                      name="diastolic_bp"
                      type="number"
                      placeholder="e.g., 80"
                      value={newMetric.diastolic_bp}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Reading
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Health Metrics Section - 8 columns */}
        <div className="md:col-span-8 space-y-6">
          {/* Latest Readings Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5 text-red-500" />
                  Latest Heart Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <p>Error loading data</p>
                  </div>
                ) : healthMetrics.length > 0 ? (
                  <div className="text-3xl font-bold">
                    {healthMetrics[0].heart_rate} <span className="text-lg font-normal">BPM</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
              {healthMetrics.length > 0 && (
                <CardFooter className="text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(healthMetrics[0].created_at)}
                  </div>
                </CardFooter>
              )}
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-blue-500" />
                  Latest Blood Pressure
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <p>Error loading data</p>
                  </div>
                ) : healthMetrics.length > 0 ? (
                  <div className="text-3xl font-bold">
                    {healthMetrics[0].systolic_bp}/{healthMetrics[0].diastolic_bp} <span className="text-lg font-normal">mmHg</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
              {healthMetrics.length > 0 && (
                <CardFooter className="text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(healthMetrics[0].created_at)}
                  </div>
                </CardFooter>
              )}
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Health Status</CardTitle>
                <CardDescription>Based on your latest readings</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <p>Error loading data</p>
                  </div>
                ) : healthMetrics.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Heart Rate</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        healthMetrics[0].heart_rate > 100 || healthMetrics[0].heart_rate < 60 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {healthMetrics[0].heart_rate > 100 
                          ? 'Elevated' 
                          : healthMetrics[0].heart_rate < 60 
                            ? 'Low' 
                            : 'Normal'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Blood Pressure</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        healthMetrics[0].systolic_bp > 140 || healthMetrics[0].diastolic_bp > 90
                          ? 'bg-amber-100 text-amber-800' 
                          : healthMetrics[0].systolic_bp < 90 || healthMetrics[0].diastolic_bp < 60
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {healthMetrics[0].systolic_bp > 140 || healthMetrics[0].diastolic_bp > 90
                          ? 'Elevated'
                          : healthMetrics[0].systolic_bp < 90 || healthMetrics[0].diastolic_bp < 60
                            ? 'Low'
                            : 'Normal'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Health Metrics History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ChartLine className="mr-2 h-5 w-5" />
                Health Metrics History
              </CardTitle>
              <CardDescription>
                Track your heart rate and blood pressure over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">Loading...</div>
              ) : error ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="flex flex-col items-center text-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                    <p>There was an error loading your metrics</p>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.reload()}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : healthMetrics.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="heartRate" stroke="#f43f5e" name="Heart Rate" />
                      <Line type="monotone" dataKey="systolicBP" stroke="#3b82f6" name="Systolic BP" />
                      <Line type="monotone" dataKey="diastolicBP" stroke="#10b981" name="Diastolic BP" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p>No health metrics available. Add your first reading to see trends.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {healthMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Readings</CardTitle>
                <CardDescription>Your last 10 health measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Heart Rate (BPM)</th>
                        <th className="p-2 text-left">Blood Pressure (mmHg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthMetrics.slice(0, 10).map((metric) => (
                        <tr key={metric.id} className="border-b">
                          <td className="p-2">{formatDate(metric.created_at)}</td>
                          <td className="p-2">{metric.heart_rate}</td>
                          <td className="p-2">{metric.systolic_bp}/{metric.diastolic_bp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - 4 columns */}
        <div className="md:col-span-4 space-y-6">
          {/* Health Insights Component */}
          <HealthInsights latestMetric={healthMetrics[0]} />
          
          {/* Notifications Component */}
          <NotificationCenter />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
