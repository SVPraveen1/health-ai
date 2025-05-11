import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Bot, Share, AlertCircle, Check, ArrowRight, Loader, Brain, Stethoscope, HelpCircle, Info, RefreshCcw, RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer, scaleIn, slideInRight, pulseAnimation } from "@/lib/animations";
import PageWrapper from "@/components/PageWrapper";

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Urgency Alert */}
            <Alert className={`border-l-4 shadow-lg backdrop-blur-sm ${
              results.urgency === "urgent" ? "border-red-600 bg-red-50/80 text-red-800" :
              results.urgency === "soon" ? "border-yellow-500 bg-yellow-50/80 text-yellow-800" :
              "border-green-500 bg-green-50/80 text-green-800"
            }`}>
              <div className="flex items-center gap-2">
                <AlertTitle className="flex items-center gap-2 text-lg">
                  {results.urgency === "urgent" ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
                      <span>🚨 Urgent: Seek immediate medical attention</span>
                    </>
                  ) : results.urgency === "soon" ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <span>⚠️ See a doctor soon</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      <span>✅ Non-urgent: Monitor symptoms</span>
                    </>
                  )}
                </AlertTitle>
              </div>
              <AlertDescription className="mt-2 text-base">
                {results.recommendation}
              </AlertDescription>
            </Alert>

            {/* Conditions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-primary" />
                <span>Possible Conditions</span>
                <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    High
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                    Medium
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Low
                  </span>
                </div>
              </h2>

              <motion.div 
                className="grid gap-4 md:grid-cols-2"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {results.possibleConditions.map((condition, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 border-l-4 rounded-md shadow-lg bg-card/70 backdrop-blur ${
                      condition.severity === "high" ? "border-red-500" :
                      condition.severity === "medium" ? "border-yellow-400" :
                      "border-green-400"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold">{condition.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          condition.probability === "high" ? "bg-red-100 text-red-800" :
                          condition.probability === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {condition.probability} probability
                        </span>
                        {condition.severity === "high" && (
                          <motion.span 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800"
                          >
                            High Severity
                          </motion.span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{condition.description}</p>
                    {condition.commonSymptoms.length > 0 && (
                      <>
                        <p className="text-xs font-semibold mb-1">Common Symptoms:</p>
                        <div className="flex flex-wrap gap-2">
                          {condition.commonSymptoms.map((symptom, i) => (
                            <span
                              key={i}
                              className="text-xs bg-muted/80 text-muted-foreground px-2 py-1 rounded-full"
                            >
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Recommendations */}
            <motion.div
              className="p-4 bg-sky-50/60 backdrop-blur border border-sky-200 rounded-md shadow-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Check className="h-5 w-5 text-sky-500" />
                Recommendations
              </h2>
              <p className="text-sm text-muted-foreground">{results.recommendation}</p>
            </motion.div>

            {/* Follow-up Questions */}
            {results.followUpQuestions && results.followUpQuestions.length > 0 && (
              <motion.div
                className="p-4 bg-purple-50/70 backdrop-blur border border-purple-200 rounded-md shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                  Follow-up Questions
                </h2>
                <ul className="space-y-2">
                  {results.followUpQuestions.map((question, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex items-start gap-2"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-600">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">{question}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Actions and Disclaimer */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
                <Button>
                  <Share className="mr-2 h-4 w-4" />
                  Share Results
                </Button>
              </div>

              <Alert variant="default" className="bg-muted/50 border-primary/20">
                <Brain className="h-4 w-4 text-primary" />
                <AlertTitle>Important Notice</AlertTitle>
                <AlertDescription className="text-sm">
                  This assessment is AI-powered based on the symptoms you described. Always consult with a qualified healthcare professional for proper diagnosis and treatment. In case of emergency, seek immediate medical attention.
                </AlertDescription>
              </Alert>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
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
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">AI Symptom Checker</h1>
            <p className="text-muted-foreground">
              Describe your symptoms for an AI-powered health assessment
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Symptom Input Section */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle>Describe Your Symptoms</CardTitle>
                  <CardDescription>
                    Be as detailed as possible for the most accurate assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
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

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                          </motion.div>
                        ) : (
                          <>Analyze Symptoms</>
                        )}
                      </Button>
                    </motion.div>
                  </motion.form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Results Section */}
            <motion.div variants={fadeInUp}>
              <AnimatePresence mode="wait">
                {results ? (
                  <motion.div                    variants={slideInRight}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <Card className="border-border bg-card/50 backdrop-blur shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <motion.div animate={pulseAnimation}>
                            <Stethoscope className="h-5 w-5 text-primary" />
                          </motion.div>
                          Assessment Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <motion.div
                          variants={staggerContainer}
                          initial="initial"
                          animate="animate"
                          className="space-y-4"
                        >
                          {/* Possible Conditions */}
                          <motion.div variants={fadeInUp}>
                            <div className="space-y-4">
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
                          </motion.div>

                          {/* Recommendations */}
                          <motion.div variants={fadeInUp}>
                            <div className="space-y-4">
                              <h3 className="text-lg font-medium">Recommendations</h3>
                              <p className="text-sm text-muted-foreground">
                                {results.recommendation}
                              </p>
                            </div>
                          </motion.div>

                          {/* Urgency Level */}
                          <motion.div variants={fadeInUp}>
                            <div className="space-y-4">
                              <h3 className="text-lg font-medium">Urgency Level</h3>
                              <p className="text-sm text-muted-foreground">
                                {results.urgency === "urgent" && "🚨 Urgent: Seek immediate medical attention"}
                                {results.urgency === "soon" && "⚠️ Consult a doctor soon"}
                                {results.urgency === "non-urgent" && "✅ Non-urgent: Monitor symptoms and follow up as needed"}
                              </p>
                            </div>
                          </motion.div>
                        </motion.div>
                      </CardContent>
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
                          Describe your symptoms to receive an AI-powered health assessment
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default SymptomChecker;
