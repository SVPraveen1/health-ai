import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Heart, Activity, Plus, Calendar, ChartLine, Save, AlertTriangle, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addHealthMetric, getHealthMetrics } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import HealthInsights from "@/components/HealthInsights";
import { NotificationCenter } from "@/components/Notifications";
import { motion } from "framer-motion";
import PageWrapper from "@/components/PageWrapper";
import { fadeInUp, staggerContainer, scaleIn, slideInLeft, slideInRight, cardHover } from "@/lib/animations";

interface HealthMetric {
  id: string;  heart_rate: number;
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
  const [error, setError] = useState<string | null>(null);  const [newMetric, setNewMetric] = useState({
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
        } else if (metric.systolic_bp >= 130 || metric.diastolic_bp >= 85) {
          riskScore += 20;
          recommendations.push('Your blood pressure is elevated (Stage 1 hypertension). Consider lifestyle changes and consult your healthcare provider.');
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

    try {      const metricData = {
        heart_rate: parseInt(newMetric.heart_rate),
        systolic_bp: parseInt(newMetric.systolic_bp),
        diastolic_bp: parseInt(newMetric.diastolic_bp)
      };

      // Validate inputs
      if (isNaN(metricData.heart_rate) || isNaN(metricData.systolic_bp) || 
          isNaN(metricData.diastolic_bp)) {
        throw new Error("Please enter valid numeric values for all fields");
      }

      // Additional validation
      if (metricData.heart_rate <= 0 || metricData.systolic_bp <= 0 || 
          metricData.diastolic_bp <= 0) {
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
        diastolic_bp: "",
        water_intake: ""
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
  const exportData = async (format: 'pdf' | 'csv') => {
    try {
      // Generate CSV directly in the browser
      if (format === 'csv') {
        const headers = [
          'Date',
          'Heart Rate (BPM)',
          'Systolic BP (mmHg)',
          'Diastolic BP (mmHg)'
        ].join(',');

        const rows = healthMetrics.map(metric => [
          new Date(metric.created_at).toLocaleDateString(),
          metric.heart_rate,
          metric.systolic_bp,
          metric.diastolic_bp
        ].join(','));

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `health-data-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For PDF, we'll need to implement server-side generation
        toast({
          title: "Feature Coming Soon",
          description: "PDF export will be available in a future update. Please use CSV for now.",
          variant: "default"
        });
      }
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export health data",
        variant: "destructive"
      });
    }
  };

  return (
    <PageWrapper>
      <div className="container px-4 md:px-6 py-8">
        <motion.div 
          variants={fadeInUp}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-3xl font-bold">Your Health Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportData('csv')}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
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
                      </div>                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Reading
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-12">
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="md:col-span-8 space-y-6"
          >
            <motion.div 
              variants={staggerContainer}
              className="grid gap-4 md:grid-cols-3"
            >              {/* Latest Heart Rate */}
              <motion.div variants={fadeInUp} whileHover={cardHover}>              <Card className="bg-card/95 hover:bg-card/90 transition-colors backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-primary/90">
                    <Heart className="mr-2 h-5 w-5 text-primary" />
                    Latest Heart Rate
                  </CardTitle>
                </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-muted-foreground">Loading...</p>
                    ) : error ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <p>Error loading data</p>
                      </div>
                    ) : healthMetrics.length > 0 ? (
                      <div className="text-4xl font-bold text-foreground/90 tracking-tight">
                        {healthMetrics[0].heart_rate} <span className="text-lg font-normal text-muted-foreground">BPM</span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No data available</p>
                    )}
                  </CardContent>
                  {healthMetrics.length > 0 && (
                    <CardFooter className="text-sm text-muted-foreground/80">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4 text-muted-foreground/70" />
                        {formatDate(healthMetrics[0].created_at)}
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>

              {/* Latest Blood Pressure */}
              <motion.div variants={fadeInUp} whileHover={cardHover}>
                <Card className="bg-card/95 hover:bg-card/90 transition-colors backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-primary/90">
                      <Activity className="mr-2 h-5 w-5 text-blue-500" />
                      Blood Pressure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-muted-foreground">Loading...</p>
                    ) : error ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <p>Error loading data</p>
                      </div>
                    ) : healthMetrics.length > 0 ? (
                      <div className="text-4xl font-bold text-foreground/90 tracking-tight">
                        {healthMetrics[0].systolic_bp}/{healthMetrics[0].diastolic_bp} 
                        <span className="text-lg font-normal text-muted-foreground ml-2">mmHg</span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No data available</p>
                    )}
                  </CardContent>
                  {healthMetrics.length > 0 && (
                    <CardFooter className="text-sm text-muted-foreground/80">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4 text-muted-foreground/70" />
                        {formatDate(healthMetrics[0].created_at)}
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>

              {/* Health Status Card */}
              <motion.div variants={fadeInUp} whileHover={cardHover}>
                <Card className="bg-card/95 hover:bg-card/90 transition-colors backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary/90">Health Status</CardTitle>
                    <CardDescription className="text-muted-foreground/80">Latest readings analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-muted-foreground">Loading...</p>
                    ) : error ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <p>Error loading data</p>
                      </div>
                    ) : healthMetrics.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Heart Rate</span>
                          <span className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                            healthMetrics[0].heart_rate > 100 || healthMetrics[0].heart_rate < 60 
                              ? 'bg-amber-500/10 text-amber-500' 
                              : 'bg-green-500/10 text-green-500'
                          }`}>
                            {healthMetrics[0].heart_rate > 100 
                              ? 'Elevated' 
                              : healthMetrics[0].heart_rate < 60 
                                ? 'Low' 
                                : 'Normal'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Blood Pressure</span>
                          <span className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                            healthMetrics[0].systolic_bp >= 140 || healthMetrics[0].diastolic_bp >= 90
                              ? 'bg-amber-500/10 text-amber-500'
                              : healthMetrics[0].systolic_bp >= 130 || healthMetrics[0].diastolic_bp >= 85
                                ? 'bg-amber-500/10 text-amber-500'
                                : healthMetrics[0].systolic_bp < 90 || healthMetrics[0].diastolic_bp < 60
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-green-500/10 text-green-500'
                          }`}>
                            {healthMetrics[0].systolic_bp >= 140 || healthMetrics[0].diastolic_bp >= 90
                              ? 'High'
                              : healthMetrics[0].systolic_bp >= 130 || healthMetrics[0].diastolic_bp >= 85
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
              </motion.div>
            </motion.div>

            {/* Health Metrics History */}
            <motion.div
              variants={scaleIn}
              whileHover={cardHover}
            >
              <Card className="bg-card/95 hover:bg-card/90 transition-colors backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center text-primary/90">
                        <ChartLine className="mr-2 h-5 w-5" />
                        Health Metrics History
                      </CardTitle>
                      <CardDescription className="text-muted-foreground/80">
                        Track your vitals over time
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
                  ) : error ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="flex flex-col items-center text-center gap-2">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                        <p className="text-destructive">There was an error loading your metrics</p>
                        <Button 
                          variant="outline" 
                          onClick={() => window.location.reload()}
                          className="mt-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : healthMetrics.length > 0 ? (
                    <div className="h-[350px] relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-lg" />
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))",
                              borderColor: "hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            labelStyle={{ color: "hsl(var(--foreground))" }}
                          />
                          <Legend 
                            wrapperStyle={{ 
                              color: "hsl(var(--muted-foreground))"
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="heartRate" 
                            stroke="#f43f5e" 
                            name="Heart Rate"
                            strokeWidth={2}
                            dot={{ fill: "#f43f5e" }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="systolicBP" 
                            stroke="#3b82f6" 
                            name="Systolic BP"
                            strokeWidth={2}
                            dot={{ fill: "#3b82f6" }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="diastolicBP" 
                            stroke="#10b981" 
                            name="Diastolic BP"
                            strokeWidth={2}
                            dot={{ fill: "#10b981" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">No health metrics available. Add your first reading to see trends.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Readings */}
            {healthMetrics.length > 0 && (
              <motion.div
                variants={slideInLeft}
                whileHover={cardHover}
              >
                <Card className="bg-card/95 hover:bg-card/90 transition-colors backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-primary/90">Recent Readings</CardTitle>
                    <CardDescription className="text-muted-foreground/80">Your last 10 measurements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="p-3 text-left text-muted-foreground/90 font-medium">Date</th>
                            <th className="p-3 text-left text-muted-foreground/90 font-medium">Heart Rate</th>
                            <th className="p-3 text-left text-muted-foreground/90 font-medium">Blood Pressure</th>
                          </tr>
                        </thead>
                        <tbody>
                          {healthMetrics.slice(0, 10).map((metric) => (
                            <tr 
                              key={metric.id} 
                              className="border-b border-border/50 hover:bg-muted/5 transition-colors"
                            >
                              <td className="p-3 text-muted-foreground">{formatDate(metric.created_at)}</td>
                              <td className="p-3">
                                <span className={`text-sm font-medium ${
                                  metric.heart_rate > 100 || metric.heart_rate < 60 
                                    ? 'text-amber-500' 
                                    : 'text-green-500'
                                }`}>
                                  {metric.heart_rate} BPM
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`text-sm font-medium ${
                                  metric.systolic_bp >= 140 || metric.diastolic_bp >= 90
                                    ? 'text-amber-500'
                                    : metric.systolic_bp >= 130 || metric.diastolic_bp >= 85
                                      ? 'text-amber-500'
                                      : metric.systolic_bp < 90 || metric.diastolic_bp < 60
                                        ? 'text-blue-500'
                                        : 'text-green-500'
                                }`}>
                                  {metric.systolic_bp}/{metric.diastolic_bp} mmHg
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            variants={slideInRight}
            initial="initial"
            animate="animate"
            className="md:col-span-4 space-y-6"
          >            <motion.div whileHover={cardHover}>
              <HealthInsights latestMetric={healthMetrics[0]} />
            </motion.div>
            
            <motion.div whileHover={cardHover}>
              <NotificationCenter />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
