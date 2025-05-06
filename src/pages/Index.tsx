import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, MessageSquare, CheckCircle, ArrowRight, Heart, AlertCircle, Bell, Activity, Bot } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: <Brain className="h-8 w-8 text-blue-500" />,
      title: "AI Symptom Checker",
      description: "Our advanced AI system analyzes your symptoms and provides possible conditions and next steps.",
      link: "/symptom-checker"
    },
    {
      icon: <Activity className="h-8 w-8 text-red-500" />,
      title: "Disease Prediction",
      description: "AI-powered analysis of your health parameters to predict disease risks and provide recommendations.",
      link: "/disease-prediction"
    },
    {
      icon: <Bot className="h-8 w-8 text-green-500" />,
      title: "Health Assistant",
      description: "Chat with our AI assistant to get answers to your health-related questions anytime.",
      link: "/health-chat"
    },
    {
      icon: <Bell className="h-8 w-8 text-amber-500" />,
      title: "Medication Management",
      description: "Never miss a dose with smart reminders and comprehensive medication tracking.",
      link: "/medication"
    },
    {
      icon: <Heart className="h-8 w-8 text-purple-500" />,
      title: "Health Dashboard",
      description: "Track your vitals, appointments, and health goals all in one personalized dashboard.",
      link: "/dashboard"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Your AI Health Assistant
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Personalized healthcare guidance powered by artificial intelligence. 
                  Check symptoms, predict diseases, and monitor your health with ease.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link to="/symptom-checker">
                  <Button size="lg" className="gap-1.5">
                    Try Symptom Checker
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="lg" variant="outline">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto lg:mx-0 relative">
              <img
                src="/images/1.png"
                alt="Health AI Hero"
                width={500}
                height={500}
                className="rounded-lg object-cover"
                style={{ aspectRatio: "1/1" }}
              />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-lg shadow-lg p-4 max-w-[250px]">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="font-medium">AI Diagnosis Ready</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your symptoms have been analyzed. View your results now.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container px-4 md:px-6 py-12 md:py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">AI-Powered Health Features</h2>
          <p className="text-muted-foreground max-w-[700px] mx-auto">
            Our platform leverages cutting-edge artificial intelligence to provide you with personalized healthcare solutions.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-2">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link to={feature.link}>
                  <Button variant="ghost" className="gap-1">
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Technology Section */}
      <div className="bg-gradient-to-b from-white to-blue-50 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Powered by Advanced AI</h2>
            <p className="text-muted-foreground max-w-[700px] mx-auto">
              Our platform uses Google's Gemini AI to provide accurate, reliable health information and predictions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Brain className="h-10 w-10 text-blue-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">Symptom Analysis</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes your symptoms using deep learning to identify potential conditions with high accuracy.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Activity className="h-10 w-10 text-red-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">Risk Prediction</h3>
                <p className="text-muted-foreground">
                  Advanced algorithms assess your health data to predict disease risks and provide preventive recommendations.
                </p>
              </div>
            </div>
            
            <div className="rounded-full bg-blue-100 p-8 flex items-center justify-center mx-auto">
              <img 
                src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/final_keyword_header.width-1600.format-webp.webp"
                alt="Gemini AI" 
                className="max-w-full rounded-full aspect-square object-cover"
                style={{ width: "200px", height: "200px" }}
              />
            </div>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <MessageSquare className="h-10 w-10 text-green-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">Natural Conversation</h3>
                <p className="text-muted-foreground">
                  Chat naturally with our AI to get health information in a conversational, easy-to-understand way.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Bot className="h-10 w-10 text-purple-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">Continuous Learning</h3>
                <p className="text-muted-foreground">
                  Our AI system continually improves through machine learning to provide increasingly accurate guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-slate-50 py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-yellow-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
              </div>
              <p className="mb-4">
                "The AI symptom checker was remarkably accurate! It helped me identify my condition before seeing a doctor, saving valuable time."
              </p>
              <p className="font-medium">Sarah Johnson</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-yellow-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
              </div>
              <p className="mb-4">
                "The disease prediction tool accurately identified my risk factors for Type 2 diabetes, helping me take preventive measures early."
              </p>
              <p className="font-medium">Michael Chen</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-yellow-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
              </div>
              <p className="mb-4">
                "As a doctor, I recommend HealthAI to my patients. The health tracking features and AI-powered analysis help me monitor their progress between appointments."
              </p>
              <p className="font-medium">Dr. Emily Rodriguez</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Index;
