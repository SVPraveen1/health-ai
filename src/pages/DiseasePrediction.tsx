import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Scale, Ruler, ArrowRight, Loader, Brain, HeartPulse, Weight, Activity, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PredictionFormData, DiseaseRisk } from "@/types/health";

interface PredictionResult {
  results: string;
  bmi: string;
  risks: DiseaseRisk[];
}

const DiseasePrediction = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PredictionFormData>({
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
    familyHistory: [],
  });
  
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [bmiCategory, setBmiCategory] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateBMI = (height: number, weight: number): number => {
    const heightInM = height / 100;
    return weight / (heightInM * heightInM);
  };

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const getBMIColor = (category: string): string => {
    switch (category) {
      case "Underweight": return "text-blue-500";
      case "Normal weight": return "text-green-500";
      case "Overweight": return "text-yellow-500";
      case "Obese": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  useEffect(() => {
    if (formData.height && formData.weight) {
      const bmi = calculateBMI(parseFloat(formData.height), parseFloat(formData.weight));
      setBmiCategory(getBMICategory(bmi));
    }
  }, [formData.height, formData.weight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bmi = calculateBMI(parseFloat(formData.height), parseFloat(formData.weight));

      const prompt = `
        Please analyze these health parameters and provide detailed disease risk assessment:
        
        Personal Information:
        - Age: ${formData.age} years
        - Gender: ${formData.gender}
        - BMI: ${bmi.toFixed(1)} (${getBMICategory(bmi)})
        - Height: ${formData.height}cm
        - Weight: ${formData.weight}kg
        
        Vital Signs:
        - Blood Pressure: ${formData.bpSystolic}/${formData.bpDiastolic} mmHg
        - Heart Rate: ${formData.heartRate} bpm
        
        Risk Factors:
        - Cholesterol: ${formData.cholesterol}
        - Glucose: ${formData.glucose}
        - Smoking: ${formData.smoker}
        - Alcohol: ${formData.alcoholConsumption}
        - Exercise: ${formData.exerciseHours} hours/week
        - Family History: ${formData.familyHistory.join(", ") || "None"}
        
        Please provide:
        1. Risk percentage for each condition (diabetes, heart disease, stroke, hypertension)
        2. Specific risk factors identified for each condition
        3. Detailed recommendations for risk reduction
        4. Present each disease separately with clear risk levels
      `;

      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { prompt, type: 'disease-prediction' }
      });

      if (error) throw error;

      const parsedRisks = parseAIResponse(data.result);
      setPrediction({
        results: data.result,
        bmi: bmi.toFixed(1),
        risks: parsedRisks
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

  const parseAIResponse = (response: string): DiseaseRisk[] => {
    const risks: DiseaseRisk[] = [];
    const diseases = ['Diabetes', 'Heart Disease', 'Stroke', 'Hypertension'];
    
    diseases.forEach(disease => {
      const riskMatch = response.match(new RegExp(`${disease}[^0-9]*([0-9]+)%`));
      const factorsMatch = response.match(new RegExp(`${disease}[^:]*factors:[^\n]*([^\n]*)`));
      const recommendationMatch = response.match(new RegExp(`${disease}[^:]*recommendations?:[^\n]*([^\n]*)`));
      
      if (riskMatch) {
        risks.push({
          disease,
          risk: parseInt(riskMatch[1]),
          factors: factorsMatch ? factorsMatch[1].split(',').map(f => f.trim()) : [],
          recommendation: recommendationMatch ? recommendationMatch[1].trim() : ''
        });
      }
    });
    
    return risks;
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
            Get personalized health insights based on your parameters
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
                  AI Risk Assessment Results
                </CardTitle>
                <CardDescription>
                  Based on your health parameters and risk factors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Scale className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">BMI</p>
                        <p className="text-2xl font-bold">{prediction.bmi}</p>
                        <p className={`text-xs ${getBMIColor(bmiCategory)}`}>
                          {bmiCategory}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <HeartPulse className="h-5 w-5 text-red-500" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Blood Pressure</p>
                        <p className="text-2xl font-bold">{formData.bpSystolic}/{formData.bpDiastolic}</p>
                        <p className="text-xs text-muted-foreground">mmHg</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Activity className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Exercise</p>
                        <p className="text-2xl font-bold">{formData.exerciseHours}</p>
                        <p className="text-xs text-muted-foreground">hours/week</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Weight className="h-5 w-5 text-purple-500" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Age</p>
                        <p className="text-2xl font-bold">{formData.age}</p>
                        <p className="text-xs text-muted-foreground">years</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {prediction.risks.map((risk, index) => (
                      <Card key={index} className={`border-l-4 ${
                        risk.risk >= 70 ? 'border-l-red-500' :
                        risk.risk >= 40 ? 'border-l-yellow-500' :
                        'border-l-green-500'
                      }`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center justify-between">
                            {risk.disease}
                            <span className={`text-sm px-2 py-1 rounded ${
                              risk.risk >= 70 ? 'bg-red-100 text-red-800' :
                              risk.risk >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {risk.risk}% Risk
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">Key Risk Factors:</p>
                              <ul className="list-disc list-inside text-sm text-muted-foreground pl-4">
                                {risk.factors.map((factor, i) => (
                                  <li key={i}>{factor}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Recommendation:</p>
                              <p className="text-sm text-muted-foreground">{risk.recommendation}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setPrediction(null)}>
                  Start Over
                </Button>
                <Button>
                  Download Report
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
      </div>
    </div>
  );
};

export default DiseasePrediction;
