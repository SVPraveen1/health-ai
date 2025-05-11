import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, MessageSquare, CheckCircle, ArrowRight, Heart, AlertCircle, Bell, Activity, Bot } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

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
    <div className="flex flex-col min-h-screen bg-background/95">
      {/* Hero Section */}
      <div className="relative py-12 md:py-24 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-[120px]" />
        </div>
        <div className="container px-4 md:px-6 relative">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="flex flex-col justify-center space-y-4"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                  Your AI Health Assistant
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Personalized healthcare guidance powered by artificial intelligence. 
                  Check symptoms, predict diseases, and monitor your health with ease.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link to="/symptom-checker">
                  <Button size="lg" className="gap-1.5 bg-primary/90 hover:bg-primary backdrop-blur-sm">
                    Try Symptom Checker
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="lg" variant="outline" className="backdrop-blur-sm border-primary/20 hover:bg-primary/10">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mx-auto lg:mx-0 relative"
            >
              <img
                src="/images/1.png"
                alt="Health AI Hero"
                width={500}
                height={500}
                className="rounded-lg object-cover"
                style={{ aspectRatio: "1/1" }}
              />
              <div className="absolute -bottom-6 -right-6 bg-card/50 backdrop-blur border border-border/50 rounded-lg shadow-lg p-4 max-w-[250px]">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="font-medium text-foreground">AI Diagnosis Ready</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your symptoms have been analyzed. View your results now.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-12 md:py-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-[120px]" />
          <div className="absolute right-1/4 bottom-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-[120px]" />
        </div>
        <div className="container px-4 md:px-6 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              AI-Powered Health Features
            </h2>
            <p className="text-muted-foreground max-w-[700px] mx-auto">
              Our platform leverages cutting-edge artificial intelligence to provide you with personalized healthcare solutions.
            </p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Link to={feature.link}>
                  <Card className="h-full bg-card/50 hover:bg-card/80 backdrop-blur border-border/50 transition-all duration-300 hover:shadow-lg hover:scale-105">
                    <CardHeader>
                      <div className="p-2 w-fit rounded-xl bg-background/50 backdrop-blur mb-2">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-foreground">{feature.title}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button variant="ghost" className="gap-2 hover:bg-primary/10">
                        Learn More <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* AI Technology Section */}
      <div className="relative py-12 md:py-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-[120px]" />
          <div className="absolute right-1/4 bottom-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-[120px]" />
        </div>
        <div className="container px-4 md:px-6 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              Powered by Advanced AI
            </h2>
            <p className="text-muted-foreground max-w-[700px] mx-auto">
              Our platform uses Google's Gemini AI to provide accurate, reliable health information and predictions.
            </p>
          </motion.div>
          
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 items-center"
          >
            <motion.div variants={fadeIn} className="space-y-4">
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-6 shadow-sm">
                <div className="p-2 w-fit rounded-xl bg-background/50 backdrop-blur mb-4">
                  <Brain className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Symptom Analysis</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes your symptoms using deep learning to identify potential conditions with high accuracy.
                </p>
              </div>
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-6 shadow-sm">
                <div className="p-2 w-fit rounded-xl bg-background/50 backdrop-blur mb-4">
                  <Activity className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Risk Prediction</h3>
                <p className="text-muted-foreground">
                  Advanced algorithms assess your health data to predict disease risks and provide preventive recommendations.
                </p>
              </div>
            </motion.div>
            
            <motion.div
              variants={fadeIn}
              whileHover={{ scale: 1.05 }}
              className="rounded-full bg-background/50 backdrop-blur border border-border/50 p-8 flex items-center justify-center mx-auto"
            >
              <img 
                src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/final_keyword_header.width-1600.format-webp.webp"
                alt="Gemini AI" 
                className="max-w-full rounded-full aspect-square object-cover"
                style={{ width: "200px", height: "200px" }}
              />
            </motion.div>
            
            <motion.div variants={fadeIn} className="space-y-4">
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-6 shadow-sm">
                <div className="p-2 w-fit rounded-xl bg-background/50 backdrop-blur mb-4">
                  <MessageSquare className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Natural Conversation</h3>
                <p className="text-muted-foreground">
                  Chat naturally with our AI to get health information in a conversational, easy-to-understand way.
                </p>
              </div>
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-6 shadow-sm">
                <div className="p-2 w-fit rounded-xl bg-background/50 backdrop-blur mb-4">
                  <Bot className="h-10 w-10 text-purple-500" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Continuous Learning</h3>
                <p className="text-muted-foreground">
                  Our AI system continually improves through machine learning to provide increasingly accurate guidance.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="relative py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 bottom-1/4 w-1/2 h-1/2 bg-green-500/5 rounded-full blur-[120px]" />
          <div className="absolute right-1/4 top-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-[120px]" />
        </div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="container px-4 md:px-6 relative"
        >
          <motion.div variants={fadeIn} className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-card/50 backdrop-blur border border-border/50 p-6 shadow-sm">
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
              <p className="mb-4 text-foreground">
                "The AI symptom checker was remarkably accurate! It helped me identify my condition before seeing a doctor, saving valuable time."
              </p>
              <p className="font-medium text-foreground">Sarah Johnson</p>
            </div>
            <div className="rounded-lg bg-card/50 backdrop-blur border border-border/50 p-6 shadow-sm">
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
              <p className="mb-4 text-foreground">
                "The disease prediction tool accurately identified my risk factors for Type 2 diabetes, helping me take preventive measures early."
              </p>
              <p className="font-medium text-foreground">Michael Chen</p>
            </div>
            <div className="rounded-lg bg-card/50 backdrop-blur border border-border/50 p-6 shadow-sm">
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
              <p className="mb-4 text-foreground">
                "As a doctor, I recommend HealthAI to my patients. The health tracking features and AI-powered analysis help me monitor their progress between appointments."
              </p>
              <p className="font-medium text-foreground">Dr. Emily Rodriguez</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
