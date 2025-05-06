
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ActivitySquare, AlertCircle, HeartPulse, ArrowRight, Loader, Brain } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DiseasePrediction = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    bpSystolic: "",
    bpDiastolic: "",
    heartRate: "",
    cholesterol: "normal",
    glucose: "normal",
    smoker: "no",
    alcoholConsumption: "none",
    exerciseHours: "0-1",
    familyHistory: [] as string[],
  });
  
  const [prediction, setPrediction] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate BMI
      const heightInM = parseFloat(formData.height) / 100;
      const weightInKg = parseFloat(formData.weight);
      const bmi = weightInKg / (heightInM * heightInM);

      // Prepare prompt for Gemini AI
      const prompt = `
        Please analyze the following health parameters and predict the risk for common diseases:
        
        - Age: ${formData.age} years
        - Gender: ${formData.gender}
        - BMI: ${bmi.toFixed(1)} (Height: ${formData.height}cm, Weight: ${formData.weight}kg)
        - Blood Pressure: ${formData.bpSystolic}/${formData.bpDiastolic} mmHg
        - Heart Rate: ${formData.heartRate} bpm
        - Cholesterol Level: ${formData.cholesterol}
        - Glucose Level: ${formData.glucose}
        - Smoking Status: ${formData.smoker}
        - Alcohol Consumption: ${formData.alcoholConsumption}
        - Exercise: ${formData.exerciseHours} hours/week
        - Family History: ${formData.familyHistory.join(", ") || "None specified"}
        
        Please provide:
        1. Percentage risk for diabetes, heart disease, stroke, hypertension
        2. Key risk factors from the provided data
        3. Specific recommendations to reduce risk
        4. Present the results in a structured format with clear sections for each disease
      `;

      // Call Gemini AI via Edge Function
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { prompt, type: 'disease-prediction' }
      });

      if (error) throw error;

      setPrediction({
        results: data.result,
        bmi: bmi.toFixed(1)
      });
    } catch (error: any) {
      console.error("Error in disease prediction:", error);
      toast({
        title: "Prediction failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFamilyHistory = (condition: string) => {
    setFormData((prev) => {
      const familyHistory = [...prev.familyHistory];
      const index = familyHistory.indexOf(condition);
      
      if (index === -1) {
        familyHistory.push(condition);
      } else {
        familyHistory.splice(index, 1);
      }
      
      return {
        ...prev,
        familyHistory,
      };
    });
  };

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Disease Risk Assessment</h1>
          <p className="text-muted-foreground">
            Enter your health parameters for an AI-powered disease risk prediction
          </p>
        </div>

        {!prediction ? (
          <Card>
            <CardHeader>
              <CardTitle>Health Parameters</CardTitle>
              <CardDescription>
                Fill in your health details for a personalized risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      placeholder="Years"
                      min="1"
                      max="120"
                      value={formData.age}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => handleSelectChange("gender", value)}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      placeholder="Height in cm"
                      min="50"
                      max="250"
                      value={formData.height}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      placeholder="Weight in kg"
                      min="1"
                      max="500"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="bpSystolic">Systolic BP (mmHg)</Label>
                    <Input
                      id="bpSystolic"
                      name="bpSystolic"
                      type="number"
                      placeholder="e.g. 120"
                      min="70"
                      max="250"
                      value={formData.bpSystolic}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bpDiastolic">Diastolic BP (mmHg)</Label>
                    <Input
                      id="bpDiastolic"
                      name="bpDiastolic"
                      type="number"
                      placeholder="e.g. 80"
                      min="40"
                      max="150"
                      value={formData.bpDiastolic}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                    <Input
                      id="heartRate"
                      name="heartRate"
                      type="number"
                      placeholder="e.g. 72"
                      min="30"
                      max="200"
                      value={formData.heartRate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cholesterol Level</Label>
                    <Select 
                      value={formData.cholesterol} 
                      onValueChange={(value) => handleSelectChange("cholesterol", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="borderline">Borderline High</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="very-high">Very High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Glucose Level</Label>
                    <Select 
                      value={formData.glucose} 
                      onValueChange={(value) => handleSelectChange("glucose", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="prediabetic">Pre-diabetic</SelectItem>
                        <SelectItem value="diabetic">Diabetic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Smoking Status</Label>
                    <Select 
                      value={formData.smoker} 
                      onValueChange={(value) => handleSelectChange("smoker", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Non-smoker</SelectItem>
                        <SelectItem value="former">Former Smoker</SelectItem>
                        <SelectItem value="occasional">Occasional Smoker</SelectItem>
                        <SelectItem value="regular">Regular Smoker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Alcohol Consumption</Label>
                    <Select 
                      value={formData.alcoholConsumption} 
                      onValueChange={(value) => handleSelectChange("alcoholConsumption", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="occasional">Occasional</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="heavy">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Exercise (hours/week)</Label>
                    <Select 
                      value={formData.exerciseHours} 
                      onValueChange={(value) => handleSelectChange("exerciseHours", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 hours</SelectItem>
                        <SelectItem value="1-3">1-3 hours</SelectItem>
                        <SelectItem value="3-5">3-5 hours</SelectItem>
                        <SelectItem value="5+">5+ hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Family History (Select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    {["Diabetes", "Heart Disease", "Stroke", "Hypertension"].map((condition) => (
                      <div 
                        key={condition}
                        className={`border rounded-md p-3 cursor-pointer transition-colors
                          ${formData.familyHistory.includes(condition) ? "bg-primary/10 border-primary" : ""}
                        `}
                        onClick={() => handleToggleFamilyHistory(condition)}
                      >
                        <div className="flex items-center justify-center gap-2 text-center">
                          {formData.familyHistory.includes(condition) && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                          <span className="text-sm">{condition}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Data...
                    </>
                  ) : (
                    <>
                      Generate Prediction
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important Notice</AlertTitle>
                  <AlertDescription>
                    This AI prediction is not a substitute for professional medical advice, diagnosis, or treatment. 
                    Always seek the advice of your physician or other qualified health provider.
                  </AlertDescription>
                </Alert>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-primary" />
                  AI Disease Risk Assessment Results
                </CardTitle>
                <CardDescription>
                  Based on your provided health parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm font-medium text-muted-foreground">BMI</p>
                        <p className="text-2xl font-bold">{prediction.bmi}</p>
                        <p className="text-xs text-muted-foreground">
                          {parseFloat(prediction.bmi) < 18.5 ? "Underweight" :
                           parseFloat(prediction.bmi) < 25 ? "Normal" :
                           parseFloat(prediction.bmi) < 30 ? "Overweight" : "Obese"}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Blood Pressure</p>
                        <p className="text-2xl font-bold">{formData.bpSystolic}/{formData.bpDiastolic}</p>
                        <p className="text-xs text-muted-foreground">mmHg</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                        <p className="text-2xl font-bold">{formData.heartRate}</p>
                        <p className="text-xs text-muted-foreground">bpm</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Age</p>
                        <p className="text-2xl font-bold">{formData.age}</p>
                        <p className="text-xs text-muted-foreground">years</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card className="border border-blue-200 bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">AI Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-line text-sm">
                        {prediction.results}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setPrediction(null)}>
                  Back to Form
                </Button>
                <Button>
                  Save Results
                </Button>
              </CardFooter>
            </Card>
            
            <Alert className="border-primary/50 bg-primary/10">
              <HeartPulse className="h-4 w-4 text-primary" />
              <AlertTitle>Next Steps</AlertTitle>
              <AlertDescription>
                Consider discussing these results with your healthcare provider. Regular check-ups are essential for maintaining good health.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {/* HCI Principles Information */}
        <div className="rounded-lg bg-muted p-6 mt-12">
          <h3 className="text-lg font-medium mb-3">HCI Principles Demonstrated on this Page:</h3>
          <ul className="list-disc pl-5 grid gap-3 md:grid-cols-2">
            <li><strong>Progressive Disclosure:</strong> Complex form with clear sections and grouping</li>
            <li><strong>Error Prevention:</strong> Input validation and clear error messages</li>
            <li><strong>Affordance:</strong> Interactive elements clearly indicate they can be interacted with</li>
            <li><strong>Feedback:</strong> Loading states and clear results presentation</li>
            <li><strong>Mental Model Matching:</strong> Form follows logical health assessment process</li>
            <li><strong>Accessibility:</strong> Labeled form controls and clear focus states</li>
            <li><strong>Recognition over Recall:</strong> Dropdown options instead of free text</li>
            <li><strong>Consistency:</strong> UI patterns consistent with rest of application</li>
            <li><strong>Minimalist Design:</strong> Only necessary information shown at each step</li>
            <li><strong>Flexibility and Efficiency:</strong> Form divided into logical sections</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DiseasePrediction;
