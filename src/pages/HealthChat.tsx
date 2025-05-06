
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SendHorizontal, Bot, User, Loader, ThumbsUp, ThumbsDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

type Message = {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
};

const suggestedQuestions = [
  "What are the symptoms of diabetes?",
  "How can I lower my blood pressure naturally?",
  "What vitamins should I take daily?",
  "How much exercise do I need weekly?",
  "What foods help with inflammation?",
  "How can I improve my sleep quality?"
];

const HealthChat = () => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your AI health assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    try {
      // Call Gemini AI via Edge Function
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { prompt: input, type: 'chat' }
      });
      
      if (error) throw error;
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.result,
        sender: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Error in health chat:", error);
      toast({
        title: "Failed to get response",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error. Please try again.",
        sender: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Health Assistant</h1>
          <p className="text-muted-foreground">
            Ask health-related questions and get AI-powered answers
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-3">
            <Card className="border-2 border-primary/20 h-[70vh] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Bot className="mr-2 h-5 w-5 text-primary" />
                  Health AI Chat
                </CardTitle>
                <CardDescription>
                  Ask questions about health, wellness, nutrition, and more
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div 
                        className={`flex max-w-[80%] ${
                          message.sender === "user" 
                            ? "flex-row-reverse" 
                            : "flex-row"
                        }`}
                      >
                        <Avatar className={`h-8 w-8 ${
                          message.sender === "user" ? "ml-2" : "mr-2"
                        }`}>
                          {message.sender === "user" ? (
                            <>
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </>
                          ) : (
                            <>
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-blue-600 text-white">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        
                        <div 
                          className={`rounded-lg p-3 text-sm ${
                            message.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="whitespace-pre-line">{message.content}</div>
                          <div 
                            className={`text-xs mt-1 ${
                              message.sender === "user"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex max-w-[80%] flex-row">
                        <Avatar className="mr-2 h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-blue-600 text-white">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="rounded-lg bg-muted p-3 text-sm">
                          <div className="flex items-center">
                            <Loader className="h-4 w-4 animate-spin mr-2" />
                            <span>Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={endOfMessagesRef} />
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-4">
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your health question..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                      <SendHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardFooter>
            </Card>
            
            {messages.length > 1 && (
              <div className="flex items-center justify-center mt-4 gap-4">
                <span className="text-sm text-muted-foreground">Was this helpful?</span>
                <Button variant="outline" size="sm" className="gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Yes
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <ThumbsDown className="h-3.5 w-3.5" />
                  No
                </Button>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Suggested Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, i) => (
                    <Button 
                      key={i}
                      variant="ghost"
                      className="w-full justify-start text-sm h-auto py-2 text-left"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTitle className="flex items-center text-blue-600">
                <Bot className="h-4 w-4 mr-2" />
                About Health Assistant
              </AlertTitle>
              <AlertDescription className="text-sm">
                This AI assistant uses Gemini to provide health information. Remember that it's not a replacement for professional medical advice.
              </AlertDescription>
            </Alert>
          </div>
        </div>
        
        {/* HCI Principles Information */}
        <div className="rounded-lg bg-muted p-6 mt-12">
          <h3 className="text-lg font-medium mb-3">HCI Principles Demonstrated on this Page:</h3>
          <ul className="list-disc pl-5 grid gap-3 md:grid-cols-2">
            <li><strong>Feedback:</strong> Clear visual indication of message status and typing</li>
            <li><strong>Affordance:</strong> Chat interface follows familiar messaging patterns</li>
            <li><strong>Recognition over Recall:</strong> Suggested questions reduce cognitive load</li>
            <li><strong>Consistency:</strong> Chat UI follows standard messaging conventions</li>
            <li><strong>User Control:</strong> Ability to rate responses as helpful or not</li>
            <li><strong>Error Recovery:</strong> Clear error messages if AI fails to respond</li>
            <li><strong>Flexibility:</strong> Multiple ways to interact (free text or suggested questions)</li>
            <li><strong>Visibility of System Status:</strong> Loading indicators show when AI is processing</li>
            <li><strong>Aesthetic Design:</strong> Clean, visually pleasing chat interface</li>
            <li><strong>Minimalist Design:</strong> Focus on conversation without unnecessary elements</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HealthChat;
