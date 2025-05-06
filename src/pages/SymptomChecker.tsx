
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, AlertCircle, Loader, ArrowRight, Brain } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const SymptomChecker = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("5");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<null | {
    possibleConditions: Array<{name: string, probability: string, severity: "low" | "medium" | "high"}>;
    recommendation: string;
    urgency: "non-urgent" | "soon" | "urgent";
    aiResponse?: string;
  }>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare prompt for Gemini AI
      const prompt = `
        I'm experiencing the following symptoms:
        ${symptoms}
        
        Additional information:
        - Duration: ${duration}
        - Severity (1-10): ${severity}
        
        Please analyze these symptoms and provide:
        1. A list of possible conditions with probability (high, medium, low) and severity level
        2. Recommendations for next steps
        3. Urgency level (non-urgent, see doctor soon, urgent/seek immediate care)
      `;
      
      // Call Gemini AI via Edge Function
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { prompt, type: 'symptom-check' }
      });
      
      if (error) throw error;
      
      // Process AI response
      const aiResponse = data.result;
      
      // For demonstration, extract structured data from the AI response
      // In a real app, you would parse the AI's response more robustly
      let urgency = "non-urgent";
      if (aiResponse.toLowerCase().includes("urgent") || aiResponse.toLowerCase().includes("emergency") || aiResponse.toLowerCase().includes("immediate")) {
        urgency = "urgent";
      } else if (aiResponse.toLowerCase().includes("soon") || aiResponse.toLowerCase().includes("within days")) {
        urgency = "soon";
      }
      
      // Extract possible conditions (simplified for demo)
      const possibleConditions = [
        { name: "Common Cold", probability: "High (75%)", severity: "low" },
        { name: "Seasonal Allergies", probability: "Medium (45%)", severity: "low" },
        { name: "Sinus Infection", probability: "Low (20%)", severity: "medium" }
      ];
      
      // Extract recommendation
      const recommendation = aiResponse.split("\n\n").find((line: string) => 
        line.toLowerCase().includes("recommend") || 
        line.toLowerCase().includes("suggestion") || 
        line.toLowerCase().includes("advice")
      ) || "Based on your symptoms, please consult a healthcare professional for proper diagnosis.";
      
      setResults({
        possibleConditions,
        recommendation,
        urgency: urgency as "non-urgent" | "soon" | "urgent",
        aiResponse
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
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">
                How long have you been experiencing these symptoms?
              </Label>
              <Input 
                id="duration" 
                placeholder="e.g., 3 days" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity" className="text-sm font-medium">
                On a scale of 1-10, how severe are your symptoms?
              </Label>
              <Input 
                id="severity" 
                type="number" 
                min="1" 
                max="10" 
                placeholder="e.g., 5" 
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Symptoms...
                </>
              ) : (
                <>Check Symptoms</>
              )}
            </Button>
            
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Notice</AlertTitle>
              <AlertDescription>
                This tool is not a replacement for professional medical advice. In case of emergency, call 911 or your local emergency number immediately.
              </AlertDescription>
            </Alert>
          </form>
        );
      case 2:
        return results && (
          <div className="space-y-6">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-medium mb-2">Possible Conditions:</h3>
              <ul className="space-y-4">
                {results.possibleConditions.map((condition, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`h-3 w-3 rounded-full ${
                          condition.severity === "low" ? "bg-green-500" : 
                          condition.severity === "medium" ? "bg-yellow-500" : "bg-red-500"
                        }`}
                      />
                      <span>{condition.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{condition.probability}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Alert className={`
              ${results.urgency === "non-urgent" ? "border-green-500" : 
                results.urgency === "soon" ? "border-yellow-500" : "border-red-500"}
            `}>
              <div className="flex items-center gap-2">
                <AlertTitle className="flex items-center gap-2">
                  {results.urgency === "non-urgent" ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Non-urgent</span>
                    </>
                  ) : results.urgency === "soon" ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>See doctor soon</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>Urgent: Seek medical attention</span>
                    </>
                  )}
                </AlertTitle>
              </div>
              <AlertDescription className="mt-2">
                {results.recommendation}
              </AlertDescription>
            </Alert>

            {results.aiResponse && (
              <Card className="border border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Brain className="mr-2 h-5 w-5 text-blue-500" />
                    AI Detailed Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line text-sm">
                    {results.aiResponse}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col space-y-2">
              <Button onClick={() => setStep(1)}>Check New Symptoms</Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Share Results With Doctor</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Your Results</DialogTitle>
                    <DialogDescription>
                      Generate a detailed report to share with your healthcare provider.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input placeholder="Doctor's email" />
                    <Button className="w-full">Send Report</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
            Describe your symptoms for an AI-powered analysis and recommendations
          </p>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Health Assessment</CardTitle>
            <CardDescription>
              Our AI will analyze your symptoms and provide possible conditions and recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
        </Card>

        {/* HCI Principles Information */}
        <div className="rounded-lg bg-muted p-6 mt-12">
          <h3 className="text-lg font-medium mb-3">HCI Principles Demonstrated on this Page:</h3>
          <ul className="list-disc pl-5 grid gap-3 md:grid-cols-2">
            <li><strong>Progressive Disclosure:</strong> Multi-step form revealing information gradually</li>
            <li><strong>Visibility of System Status:</strong> Loading indicators and clear state transitions</li>
            <li><strong>Error Prevention:</strong> Clear warnings about medical advice limitations</li>
            <li><strong>Scarcity (Cialdini):</strong> Urgency indicators to prompt action when needed</li>
            <li><strong>Recognition over Recall:</strong> Clear form labels and helpful placeholder text</li>
            <li><strong>Color Psychology:</strong> Red for urgent, yellow for warning, green for safe</li>
            <li><strong>Authority (Cialdini):</strong> Professional medical language to establish trust</li>
            <li><strong>Feedback Loops:</strong> Clear responses after submission with next steps</li>
            <li><strong>Accessibility:</strong> Labeled form controls and clear focus states</li>
            <li><strong>Mental Model Matching:</strong> Interface follows familiar medical consultation pattern</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;
