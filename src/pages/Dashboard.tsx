
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Activity, Plus, Calendar, ChartLine, Save, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addHealthMetric, getHealthMetrics } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface HealthMetric {
  id: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  created_at: string;
  user_id: string;
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

  useEffect(() => {
    const loadHealthMetrics = async () => {
      if (user) {
        setLoading(true);
        setError(null);
        try {
          const { data, error } = await getHealthMetrics(user.id);
          if (error) throw error;
          setHealthMetrics(data || []);
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

  // Add a ref selector for tabs
  const navigateToAddTab = () => {
    const addTab = document.querySelector('[data-value="add"]') as HTMLElement;
    if (addTab) {
      addTab.click();
    }
  };

  return (
    <div className="container px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Health Dashboard</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
          <TabsTrigger value="add">Add New Reading</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <CardFooter className="text-sm text-muted-foreground">
                {healthMetrics.length > 0 && (
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(healthMetrics[0].created_at)}
                  </div>
                )}
              </CardFooter>
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
              <CardFooter className="text-sm text-muted-foreground">
                {healthMetrics.length > 0 && (
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(healthMetrics[0].created_at)}
                  </div>
                )}
              </CardFooter>
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
              <CardFooter>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Reading
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Quick Add Health Reading</DialogTitle>
                      <DialogDescription>
                        Enter your current health metrics
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                      <div className="grid gap-2">
                        <Label htmlFor="quick-heart_rate">Heart Rate (BPM)</Label>
                        <Input
                          id="quick-heart_rate"
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
                            <Label htmlFor="quick-systolic_bp" className="text-sm">Systolic (top)</Label>
                            <Input
                              id="quick-systolic_bp"
                              name="systolic_bp"
                              type="number"
                              placeholder="e.g., 120"
                              value={newMetric.systolic_bp}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="quick-diastolic_bp" className="text-sm">Diastolic (bottom)</Label>
                            <Input
                              id="quick-diastolic_bp"
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
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="metrics">
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
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Reading
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Quick Add Health Reading</DialogTitle>
                    <DialogDescription>
                      Enter your current health metrics
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="metrics-heart_rate">Heart Rate (BPM)</Label>
                      <Input
                        id="metrics-heart_rate"
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
                          <Label htmlFor="metrics-systolic_bp" className="text-sm">Systolic (top)</Label>
                          <Input
                            id="metrics-systolic_bp"
                            name="systolic_bp"
                            type="number"
                            placeholder="e.g., 120"
                            value={newMetric.systolic_bp}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="metrics-diastolic_bp" className="text-sm">Diastolic (bottom)</Label>
                          <Input
                            id="metrics-diastolic_bp"
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
            </CardFooter>
          </Card>
          
          {healthMetrics.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Recent Readings</h3>
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
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Health Reading</CardTitle>
              <CardDescription>
                Record your current heart rate and blood pressure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
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
                        <Label htmlFor="systolic_bp" className="text-sm">Systolic (top number)</Label>
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
                        <Label htmlFor="diastolic_bp" className="text-sm">Diastolic (bottom number)</Label>
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
                  
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Reading
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Enhanced HCI Principles Information */}
      <div className="rounded-lg bg-muted p-6 mt-12">
        <h3 className="text-lg font-medium mb-3">HCI Principles Demonstrated on this Page:</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card rounded-md p-4 shadow-sm border">
            <h4 className="font-medium mb-2">Perception & Cognition</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Gestalt Principles:</strong> Proximity and similarity in card grouping</li>
              <li><strong>Color Theory:</strong> Meaningful color coding for health statuses</li>
              <li><strong>Cognitive Load:</strong> Information segmented into manageable tabs</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-md p-4 shadow-sm border">
            <h4 className="font-medium mb-2">Interaction Design</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Affordances:</strong> Visual cues indicating interactive elements</li>
              <li><strong>Feedback:</strong> Immediate response to user actions</li>
              <li><strong>Gulf of Execution:</strong> Minimal steps to complete tasks</li>
              <li><strong>Mental Models:</strong> Interface aligned with user expectations</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-md p-4 shadow-sm border">
            <h4 className="font-medium mb-2">Accessibility & Inclusion</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>WCAG Compliance:</strong> Color contrast and semantic HTML</li>
              <li><strong>Error Recovery:</strong> Clear, helpful error messages</li>
              <li><strong>Inclusive Design:</strong> Multiple ways to perform actions</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-md p-4 shadow-sm border">
            <h4 className="font-medium mb-2">Information Architecture</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Progressive Disclosure:</strong> Complex data shown in stages</li>
              <li><strong>Visual Hierarchy:</strong> Important information emphasized</li>
              <li><strong>Information Scent:</strong> Clear navigation paths for users</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-md p-4 shadow-sm border">
            <h4 className="font-medium mb-2">User Experience</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Don Norman's Principles:</strong> Visibility, constraints, and consistency</li>
              <li><strong>Aesthetic-Usability Effect:</strong> Pleasing design enhances perceived usability</li>
              <li><strong>Microinteractions:</strong> Small responses that enhance engagement</li>
            </ul>
          </div>
          
          <div className="bg-card rounded-md p-4 shadow-sm border">
            <h4 className="font-medium mb-2">Emerging Concepts</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Data Visualization:</strong> Complex health data represented visually</li>
              <li><strong>Skeuomorphism vs Flat Design:</strong> Modern UI with familiar metaphors</li>
              <li><strong>Contextual Design:</strong> Interfaces adapting to user contexts and needs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
