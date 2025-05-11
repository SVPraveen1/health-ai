import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Scale, Ruler, ArrowRight, Loader, Brain, HeartPulse, Weight, Activity, AlertCircle, RefreshCw, Share } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PredictionFormData, DiseaseRisk } from "@/types/health";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, scaleIn, pulseAnimation, slideInRight } from "@/lib/animations";
import PageWrapper from "@/components/PageWrapper";

interface PredictionResult {
  results: string;
  bmi: string;
  risks: DiseaseRisk[];
}

const DiseasePrediction = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeRisk, setActiveRisk] = useState<string | null>(null);
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
    <PageWrapper>
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          variants={fadeInUp}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            variants={scaleIn}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold mb-2">Disease Risk Assessment</h1>
            <p className="text-muted-foreground">
              Enter your health parameters for an AI-powered disease risk analysis
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Form Section */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle>Health Parameters</CardTitle>
                  <CardDescription>Fill in your current health metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Personal Information */}
                    <motion.div
                      variants={staggerContainer}
                      className="space-y-4"
                    >
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
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button type="submit" className="w-full">
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <>Analyze Risk</>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Results Section */}
            <motion.div variants={fadeInUp}>
              {prediction ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <motion.div animate={pulseAnimation}>
                          <Activity className="h-6 w-6 text-primary" />
                        </motion.div>
                        Risk Assessment Results
                      </CardTitle>
                      <CardDescription>
                        Based on your health parameters and lifestyle factors
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="space-y-6"
                      >
                        {/* Key Health Metrics */}
                        <motion.div variants={fadeInUp}>
                          <h3 className="text-lg font-semibold mb-4">Key Health Metrics</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-muted/50 border-primary/20">
                              <CardContent className="p-4 text-center">
                                <div className="flex items-center justify-center mb-2">
                                  <Scale className="h-5 w-5 text-primary" />
                                </div>
                                <p className="text-sm font-medium">BMI</p>
                                <p className="text-2xl font-bold">{prediction.bmi}</p>
                                <p className={`text-sm font-medium ${getBMIColor(bmiCategory)}`}>
                                  {bmiCategory}
                                </p>
                              </CardContent>
                            </Card>
                            
                            <Card className="bg-muted/50 border-primary/20">
                              <CardContent className="p-4 text-center">
                                <div className="flex items-center justify-center mb-2">
                                  <HeartPulse className="h-5 w-5 text-red-500" />
                                </div>
                                <p className="text-sm font-medium">Blood Pressure</p>
                                <p className="text-xl font-bold">{formData.bpSystolic}/{formData.bpDiastolic}</p>
                                <p className="text-sm text-muted-foreground">mmHg</p>
                              </CardContent>
                            </Card>

                            <Card className="bg-muted/50 border-primary/20">
                              <CardContent className="p-4 text-center">
                                <div className="flex items-center justify-center mb-2">
                                  <Activity className="h-5 w-5 text-blue-500" />
                                </div>
                                <p className="text-sm font-medium">Exercise</p>
                                <p className="text-xl font-bold">{formData.exerciseHours || "0-1"}</p>
                                <p className="text-sm text-muted-foreground">hours/week</p>
                              </CardContent>
                            </Card>

                            <Card className="bg-muted/50 border-primary/20">
                              <CardContent className="p-4 text-center">
                                <div className="flex items-center justify-center mb-2">
                                  <Weight className="h-5 w-5 text-purple-500" />
                                </div>
                                <p className="text-sm font-medium">Age</p>
                                <p className="text-xl font-bold">{formData.age}</p>
                                <p className="text-sm text-muted-foreground">years</p>
                              </CardContent>
                            </Card>
                          </div>
                        </motion.div>

                        {/* Risk Assessment */}
                        <motion.div variants={fadeInUp}>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">Disease Risk Analysis</h3>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                  High Risk (≥70%)
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                  Moderate Risk (40-69%)
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                  Low Risk (&lt;40%)
                                </span>
                              </div>
                            </div>

                            {prediction.risks.map((risk, index) => (
                              <motion.div
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setActiveRisk(activeRisk === risk.disease ? null : risk.disease)}
                                className="cursor-pointer"
                              >
                                <Card className={`border-l-4 ${
                                  risk.risk >= 70 ? 'border-l-red-500' :
                                  risk.risk >= 40 ? 'border-l-yellow-500' :
                                  'border-l-green-500'
                                } bg-card/50 backdrop-blur shadow-lg transition-colors ${
                                  activeRisk === risk.disease ? 'ring-2 ring-primary' : ''
                                }`}>
                                  <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        {risk.disease}
                                        {risk.risk >= 70 && (
                                          <motion.span 
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800"
                                          >
                                            High Risk
                                          </motion.span>
                                        )}
                                      </CardTitle>
                                      <div className="relative w-32 h-4 bg-muted rounded-full overflow-hidden">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${risk.risk}%` }}
                                          transition={{ duration: 1, ease: "easeOut" }}
                                          className={`absolute top-0 left-0 h-full rounded-full ${
                                            risk.risk >= 70 ? 'bg-red-500' :
                                            risk.risk >= 40 ? 'bg-yellow-500' :
                                            'bg-green-500'
                                          }`}
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
                                          {risk.risk}% Risk
                                        </span>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <motion.div 
                                      initial={false}
                                      animate={{ height: activeRisk === risk.disease ? "auto" : "auto" }}
                                      className="space-y-3"
                                    >
                                      <div>
                                        <p className="text-sm font-medium mb-1">Key Risk Factors:</p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                          {risk.factors.map((factor, i) => (
                                            <motion.li 
                                              key={i}
                                              initial={{ opacity: 0, x: -20 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              transition={{ delay: i * 0.1 }}
                                              className="ml-2"
                                            >
                                              {factor}
                                            </motion.li>
                                          ))}
                                        </ul>
                                      </div>
                                      <Separator className="my-2" />
                                      <div>
                                        <p className="text-sm font-medium mb-1">Recommendations:</p>
                                        <motion.p 
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: 0.3 }}
                                          className="text-sm text-muted-foreground"
                                        >
                                          {risk.recommendation}
                                        </motion.p>
                                      </div>
                                      {activeRisk === risk.disease && (
                                        <motion.div
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className="mt-4 p-4 bg-muted/50 rounded-lg"
                                        >
                                          <p className="text-sm font-medium mb-2">Prevention Tips:</p>
                                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                            <li>Regular health check-ups</li>
                                            <li>Maintain a healthy lifestyle</li>
                                            <li>Follow medical advice</li>
                                            <li>Monitor symptoms closely</li>
                                          </ul>
                                        </motion.div>
                                      )}
                                    </motion.div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        {/* General Advice */}
                        <motion.div variants={fadeInUp}>
                          <Alert className="bg-card border-primary/50">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Important Notice</AlertTitle>
                            <AlertDescription>
                              This risk assessment is based on the information provided and uses AI for analysis. It should not replace professional medical advice. Please consult with healthcare providers for proper evaluation and personalized recommendations.
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      </motion.div>
                    </CardContent>
                    <CardFooter>
                      <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => setPrediction(null)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Start Over
                        </Button>
                        <Button>
                          <Share className="mr-2 h-4 w-4" />
                          Share Results
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  variants={fadeInUp}
                  className="h-full flex items-center justify-center"
                >
                  <Card className="w-full">
                    <CardHeader className="text-center">
                      <CardTitle>Ready for Analysis</CardTitle>
                      <CardDescription>
                        Fill in your health parameters to receive a detailed risk assessment
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default DiseasePrediction;
