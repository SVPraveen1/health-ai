
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, RefreshCw, Volume2, Eye, EyeOff, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const CaptchaDemo = () => {
  const [captchaType, setCaptchaType] = useState("textBased");
  const [captchaText, setCaptchaText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAccessibilityOptions, setShowAccessibilityOptions] = useState(false);
  const [textCaptchaComplexity, setTextCaptchaComplexity] = useState(50);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);

  const captchaImages = [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
  ];

  const generateRandomText = (length: number) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateCaptcha = () => {
    setCaptchaText(generateRandomText(6));
    setUserInput("");
    setIsVerified(false);
    setSelectedImages([]);
  };

  useEffect(() => {
    generateCaptcha();
  }, [captchaType]);

  const verifyCaptcha = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      if (captchaType === "textBased") {
        if (userInput.toLowerCase() === captchaText.toLowerCase()) {
          setIsVerified(true);
          toast({
            title: "Verification Successful",
            description: "You have successfully verified that you are human.",
          });
        } else {
          toast({
            title: "Verification Failed",
            description: "The characters you entered don't match the CAPTCHA. Please try again.",
            variant: "destructive",
          });
          generateCaptcha();
        }
      } else if (captchaType === "imageBased") {
        // In a real application, this would check if the correct images were selected
        if (selectedImages.length > 0) {
          setIsVerified(true);
          toast({
            title: "Verification Successful",
            description: "You have successfully verified that you are human.",
          });
        } else {
          toast({
            title: "Verification Failed",
            description: "Please select at least one image that matches the criteria.",
            variant: "destructive",
          });
        }
      } else if (captchaType === "behavioral") {
        setIsVerified(true);
        toast({
          title: "Verification Successful",
          description: "Your behavior patterns indicate you are human.",
        });
      }
      
      setIsLoading(false);
    }, 1500);
  };

  const playAudioCaptcha = () => {
    // In a real application, this would play an audio version of the CAPTCHA
    toast({
      title: "Audio CAPTCHA",
      description: `The audio is playing the characters: "${captchaText}". (This is a simulation)`,
    });
  };

  const toggleImageSelection = (index: number) => {
    setSelectedImages(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const renderCaptcha = () => {
    switch (captchaType) {
      case "textBased":
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div 
                className="relative bg-gray-100 p-4 rounded-lg w-64 text-center overflow-hidden select-none"
                style={{
                  backgroundImage: textCaptchaComplexity > 30 ? "url('data:image/svg+xml;charset=utf-8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"><path d=\"M0 50 Q25 0 50 50 T 100 50\" stroke=\"%23ccc\" fill=\"none\" /></svg>')" : "none",
                  letterSpacing: `${Math.max(1, textCaptchaComplexity / 25)}px`,
                  fontStyle: textCaptchaComplexity > 70 ? "italic" : "normal",
                  transform: textCaptchaComplexity > 50 ? `skew(${textCaptchaComplexity / 10 - 5}deg)` : "none"
                }}
              >
                {captchaText.split('').map((char, index) => (
                  <span 
                    key={index} 
                    style={{
                      display: 'inline-block',
                      transform: `rotate(${(Math.random() - 0.5) * textCaptchaComplexity / 10}deg) translateY(${(Math.random() - 0.5) * textCaptchaComplexity / 10}px)`,
                      color: `hsl(${Math.random() * 360}, 50%, 30%)`
                    }}
                  >
                    {char}
                  </span>
                ))}
                {textCaptchaComplexity > 60 && (
                  <div className="absolute top-0 left-0 w-full h-full">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <line 
                        x1="0" 
                        y1={20 + Math.random() * 30} 
                        x2="100%" 
                        y2={20 + Math.random() * 30} 
                        stroke="#888" 
                        strokeWidth="1"
                      />
                      {textCaptchaComplexity > 80 && (
                        <line 
                          x1="0" 
                          y1={40 + Math.random() * 30} 
                          x2="100%" 
                          y2={40 + Math.random() * 30} 
                          stroke="#888" 
                          strokeWidth="1"
                        />
                      )}
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Input 
                type="text"
                placeholder="Enter the text shown above"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                className="flex-1"
              />
              <Button onClick={generateCaptcha} size="icon" variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={playAudioCaptcha} size="icon" variant="outline">
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>

            {showAccessibilityOptions && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="complexity">Distortion Level: {textCaptchaComplexity}%</Label>
                  </div>
                  <Slider 
                    id="complexity"
                    min={0} 
                    max={100} 
                    step={1}
                    value={[textCaptchaComplexity]}
                    onValueChange={(value) => setTextCaptchaComplexity(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Adjust the distortion level to balance security and usability
                  </p>
                </div>
              </div>
            )}
            
            <Button onClick={verifyCaptcha} disabled={!userInput || isLoading} className="w-full">
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        );
        
      case "imageBased":
        return (
          <div className="space-y-6">
            <div>
              <p className="mb-2">Select all images that contain:</p>
              <p className="font-bold text-lg text-center mb-4">Traffic Lights</p>
              
              <div className="grid grid-cols-3 gap-2">
                {captchaImages.map((image, index) => (
                  <div 
                    key={index}
                    className={`aspect-square rounded-md cursor-pointer overflow-hidden border-2 ${
                      selectedImages.includes(index) ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => toggleImageSelection(index)}
                  >
                    <img 
                      src={image} 
                      alt={`CAPTCHA image ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={generateCaptcha} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                New Images
              </Button>
              <Button onClick={playAudioCaptcha} variant="outline" size="sm">
                <Volume2 className="h-4 w-4 mr-2" />
                Audio Alternative
              </Button>
            </div>
            
            <Button onClick={verifyCaptcha} disabled={selectedImages.length === 0 || isLoading} className="w-full">
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        );
        
      case "behavioral":
        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-4">
                <Checkbox id="robot-check" className="h-6 w-6 rounded-md" />
                <label htmlFor="robot-check" className="ml-2 text-lg">
                  I am not a robot
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                This CAPTCHA uses behavioral patterns like mouse movements and interaction timing to verify you're human.
              </p>
            </div>
            
            <Button onClick={verifyCaptcha} disabled={isLoading} className="w-full">
              {isLoading ? "Verifying..." : "Continue"}
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">CAPTCHA Demonstration</h1>
          <p className="text-muted-foreground">
            Learn about different CAPTCHA technologies and their usability considerations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verify You're Human</CardTitle>
            <CardDescription>
              This demonstration showcases different CAPTCHA methods and their usability trade-offs.
            </CardDescription>
            <div className="flex justify-between items-center mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAccessibilityOptions(!showAccessibilityOptions)}
              >
                {showAccessibilityOptions ? "Hide" : "Show"} Accessibility Options
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4 mr-1" />
                    About CAPTCHAs
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>What is CAPTCHA?</DialogTitle>
                    <DialogDescription>
                      Understanding CAPTCHA technologies and their purpose
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                    <p>
                      <strong>CAPTCHA</strong> (Completely Automated Public Turing test to tell Computers and Humans Apart) helps websites determine if a user is human or an automated bot.
                    </p>
                    <h4 className="font-medium mt-4">Types of CAPTCHAs:</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Text-Based:</strong> Distorted text that users must read and enter</li>
                      <li><strong>Image-Based:</strong> Selection of specific images from a grid</li>
                      <li><strong>Audio:</strong> Sound-based verification for accessibility</li>
                      <li><strong>Behavioral:</strong> Analysis of user interaction patterns</li>
                      <li><strong>Math Problems:</strong> Simple equations to solve</li>
                      <li><strong>Puzzle-Based:</strong> Interactive puzzles like sliding tiles</li>
                    </ul>
                    <h4 className="font-medium mt-4">Purpose:</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Prevent spam submissions</li>
                      <li>Protect against brute force attacks</li>
                      <li>Stop automated account creation</li>
                      <li>Prevent ticket/event scalping</li>
                      <li>Secure polls and voting systems</li>
                    </ul>
                    <h4 className="font-medium mt-4">Usability Challenges:</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Accessibility for users with disabilities</li>
                      <li>Frustration from difficult or repeated challenges</li>
                      <li>Time consumption and user flow interruption</li>
                      <li>Cross-device and mobile compatibility</li>
                    </ul>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="textBased" value={captchaType} onValueChange={setCaptchaType}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="textBased">Text CAPTCHA</TabsTrigger>
                <TabsTrigger value="imageBased">Image CAPTCHA</TabsTrigger>
                <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
              </TabsList>
              <TabsContent value="textBased" className="mt-0">
                {renderCaptcha()}
              </TabsContent>
              <TabsContent value="imageBased" className="mt-0">
                {renderCaptcha()}
              </TabsContent>
              <TabsContent value="behavioral" className="mt-0">
                {renderCaptcha()}
              </TabsContent>
            </Tabs>
          </CardContent>
          {isVerified && (
            <CardFooter className="bg-green-50 border-t border-green-100 flex flex-col items-start">
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor" 
                  className="w-5 h-5"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" 
                    clipRule="evenodd" 
                  />
                </svg>
                Verification Complete
              </div>
              <p className="text-sm text-green-600 mt-1">
                You have successfully proven you are human. You can now proceed.
              </p>
            </CardFooter>
          )}
        </Card>
        
        {/* HCI Principles Information */}
        <div className="rounded-lg bg-muted p-6 mt-12">
          <h3 className="text-lg font-medium mb-3">CAPTCHA HCI Principles Demonstrated:</h3>
          <ul className="list-disc pl-5 grid gap-3 md:grid-cols-2">
            <li><strong>CAPTCHA Usability:</strong> Balancing security and accessibility with different verification methods</li>
            <li><strong>CAPTCHA Robustness:</strong> Various distortion levels to prevent automated solving</li>
            <li><strong>Accessibility in CAPTCHAs:</strong> Audio alternatives and adjustable complexity</li>
            <li><strong>Multiple CAPTCHA Types:</strong> Text-based, image-based, and behavioral verification</li>
            <li><strong>User Error Recovery:</strong> Clear feedback and retry options for failed attempts</li>
            <li><strong>Cialdini's Consistency Principle:</strong> "I am not a robot" checkbox leverages commitment</li>
            <li><strong>CAPTCHA Statistical Measures:</strong> Adjustable distortion affecting speed and accuracy</li>
            <li><strong>Visual vs. Aural Parameters:</strong> Different CAPTCHA modalities for different needs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CaptchaDemo;
