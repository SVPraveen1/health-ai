import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Bot, Share, AlertCircle, Check, ArrowRight, Loader, Brain } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SymptomResult {
  possibleConditions: Array<{
    name: string;
    probability: string;
    severity: "low" | "medium" | "high";
    description: string;
    commonSymptoms: string[];
  }>;
  recommendation: string;
  urgency: "non-urgent" | "soon" | "urgent";
  aiResponse?: string;
  followUpQuestions?: string[];
}

const SymptomChecker = () => {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("5");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SymptomResult | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState({
    age: "",
    gender: "",
    medicalHistory: [] as string[],
    currentMedications: "",
    recentTravel: "no",
    allergies: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Enhanced prompt for more accurate analysis
      const prompt = `
        Patient Symptoms Analysis Request:

        Primary Symptoms:
        ${symptoms}
        
        Additional Information:
        - Duration: ${duration}
        - Severity (1-10): ${severity}
        - Age: ${additionalInfo.age}
        - Gender: ${additionalInfo.gender}
        - Medical History: ${additionalInfo.medicalHistory.join(", ")}
        - Current Medications: ${additionalInfo.currentMedications}
        - Recent Travel: ${additionalInfo.recentTravel}
        - Allergies: ${additionalInfo.allergies}
        
        Please provide:
        1. List of possible conditions with:
           - Probability (high, medium, low)
           - Severity level
           - Brief description
           - Common symptoms
        2. Urgency level (non-urgent, see doctor soon, urgent/immediate care)
        3. Specific recommendations
        4. Follow-up questions for better diagnosis
        
        Format the response clearly with sections for each condition.
      `;
      
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { prompt, type: 'symptom-check' }
      });
      
      if (error) throw error;
      
      // Process AI response
      const aiResponse = data.result;
      
      // Extract urgency level
      let urgency: "non-urgent" | "soon" | "urgent" = "non-urgent";
      if (aiResponse.toLowerCase().includes("urgent") || aiResponse.toLowerCase().includes("emergency") || aiResponse.toLowerCase().includes("immediate")) {
        urgency = "urgent";
      } else if (aiResponse.toLowerCase().includes("soon") || aiResponse.toLowerCase().includes("within days")) {
        urgency = "soon";
      }
      
      // Extract possible conditions with enhanced information
      const conditions = extractConditionsFromResponse(aiResponse);
      
      // Extract follow-up questions
      const followUpQuestions = extractFollowUpQuestions(aiResponse);
      
      // Extract recommendation
      const recommendation = aiResponse.split("\n\n").find((line: string) => 
        line.toLowerCase().includes("recommend") || 
        line.toLowerCase().includes("suggestion") || 
        line.toLowerCase().includes("advice")
      ) || "Please consult a healthcare professional for proper evaluation.";
      
      setResults({
        possibleConditions: conditions,
        recommendation,
        urgency,
        aiResponse,
        followUpQuestions
      });
      
      setStep(2);
    } catch (error: any) {
      console.error("Error in symptom checker:", error);
      toast({
        title: "Error analyzing symptoms",
        description: error.message || "Failed to analyze symptoms. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const extractConditionsFromResponse = (response: string): Array<{
    name: string;
    probability: string;
    severity: "low" | "medium" | "high";
    description: string;
    commonSymptoms: string[];
  }> => {
    const conditions = [];
    const conditionBlocks = response.split(/\d+\.\s+/).filter(block => block.trim());
    
    for (const block of conditionBlocks) {
      if (block.includes(":")) {
        const name = block.split(":")[0].trim();
        const details = block.toLowerCase();
        
        let probability = "medium";
        if (details.includes("high probability") || details.includes("likely")) {
          probability = "high";
        } else if (details.includes("low probability") || details.includes("unlikely")) {
          probability = "low";
        }
        
        let severity: "low" | "medium" | "high" = "medium";
        if (details.includes("severe") || details.includes("serious")) {
          severity = "high";
        } else if (details.includes("mild") || details.includes("minor")) {
          severity = "low";
        }
        
        const descriptionMatch = block.match(/description:([^]*?)(?=common symptoms:|$)/i);
        const description = descriptionMatch ? descriptionMatch[1].trim() : "";
        
        const symptomsMatch = block.match(/common symptoms:([^]*?)(?=\n\n|$)/i);
        const commonSymptoms = symptomsMatch 
          ? symptomsMatch[1].split(",").map(s => s.trim()).filter(s => s)
          : [];
        
        conditions.push({
          name,
          probability,
          severity,
          description,
          commonSymptoms
        });
      }
    }
    
    return conditions;
  };

  const extractFollowUpQuestions = (response: string): string[] => {
    const questionsMatch = response.match(/follow-?up questions?:([^]*?)(?=\n\n|$)/i);
    if (questionsMatch) {
      return questionsMatch[1]
        .split(/\d+\.\s+/)
        .map(q => q.trim())
        .filter(q => q && q.endsWith("?"));
    }
    return [];
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="symptoms" className="text-sm font-medium">
                Describe your symptoms
              </Label>
              <Textarea
                id="symptoms"
                placeholder="Please describe all your symptoms in detail. For example: I've had a headache for 3 days, along with a mild fever and sore throat."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={5}
                className="resize-none"
                required
              />
              <p className="text-sm text-muted-foreground">
                The more details you provide, the more accurate our AI can be.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  How long have you been experiencing these symptoms?
                </Label>
                <Input 
                  id="duration"
                  placeholder="e.g., 3 days, 1 week"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Severity (1-10)
                </Label>
                <div className="pt-2">
                  <Slider
                    value={[parseInt(severity)]}
                    onValueChange={([value]) => setSeverity(value.toString())}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Mild</span>
                    <span className="text-xs font-medium">{severity}</span>
                    <span className="text-xs text-muted-foreground">Severe</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Years"
                  value={additionalInfo.age}
                  onChange={(e) => setAdditionalInfo(prev => ({ ...prev, age: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={additionalInfo.gender}
                  onValueChange={(value) => setAdditionalInfo(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Input
                id="medications"
                placeholder="List any medications you're currently taking"
                value={additionalInfo.currentMedications}
                onChange={(e) => setAdditionalInfo(prev => ({ ...prev, currentMedications: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input
                id="allergies"
                placeholder="List any known allergies"
                value={additionalInfo.allergies}
                onChange={(e) => setAdditionalInfo(prev => ({ ...prev, allergies: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Symptoms...
                </>
              ) : (
                <>
                  Analyze Symptoms
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Notice</AlertTitle>
              <AlertDescription>
                This tool is not a replacement for professional medical advice. In case of emergency, call emergency services immediately.
              </AlertDescription>
            </Alert>
          </form>
        );

      case 2:
        return results && (
          <div className="space-y-6">
            <Alert className={`border-2 ${
              results.urgency === "urgent" ? "border-red-500 bg-red-50" :
              results.urgency === "soon" ? "border-yellow-500 bg-yellow-50" :
              "border-green-500 bg-green-50"
            }`}>
              <div className="flex items-center gap-2">
                <AlertTitle className="flex items-center gap-2 text-lg">
                  {results.urgency === "urgent" ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-700">Urgent: Seek immediate medical attention</span>
                    </>
                  ) : results.urgency === "soon" ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <span className="text-yellow-700">Consult a doctor soon</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-green-700">Non-urgent</span>
                    </>
                  )}
                </AlertTitle>
              </div>
              <AlertDescription className="mt-2">
                {results.recommendation}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Possible Conditions</h3>
              <div className="grid gap-4">
                {results.possibleConditions.map((condition, index) => (
                  <Card key={index} className={`border-l-4 ${
                    condition.severity === "high" ? "border-l-red-500" :
                    condition.severity === "medium" ? "border-l-yellow-500" :
                    "border-l-green-500"
                  }`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {condition.name}
                        <span className={`text-sm px-2 py-1 rounded ${
                          condition.probability === "high" ? "bg-red-100 text-red-800" :
                          condition.probability === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {condition.probability} probability
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {condition.description}
                        </p>
                        {condition.commonSymptoms.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Common Symptoms:</p>
                            <div className="flex flex-wrap gap-2">
                              {condition.commonSymptoms.map((symptom, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-muted px-2 py-1 rounded-full"
                                >
                                  {symptom}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {results.followUpQuestions && results.followUpQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Follow-up Questions</CardTitle>
                  <CardDescription>
                    Consider these questions for a more accurate assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    {results.followUpQuestions.map((question, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {question}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Start Over
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Share className="mr-2 h-4 w-4" />
                    Share Results
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Your Results</DialogTitle>
                    <DialogDescription>
                      Generate a detailed report to share with your healthcare provider
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input placeholder="Doctor's email" />
                    <Button className="w-full">Send Report</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Alert>
              <Brain className="h-4 w-4" />
              <AlertTitle>AI-Powered Analysis</AlertTitle>
              <AlertDescription>
                This analysis is generated by AI based on the symptoms you described. Always consult with a healthcare professional for proper diagnosis and treatment.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Symptom Checker</h1>
          <p className="text-muted-foreground">
            Get an AI-powered analysis of your symptoms and recommendations
          </p>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Health Assessment</CardTitle>
            <CardDescription>
              Describe your symptoms for an AI-powered analysis and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SymptomChecker;
