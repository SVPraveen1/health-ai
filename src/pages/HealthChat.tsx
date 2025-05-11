import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SendHorizontal, Bot, User, Loader, ThumbsUp, ThumbsDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getGeminiResponse } from "@/integrations/supabase/gemini-functions/gemini-chat";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, scaleIn, popIn } from "@/lib/animations";
import PageWrapper from "@/components/PageWrapper";
import { Message } from "@/types/chat";

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
  const [messages, setMessages] = useState<Message[]>([]);
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
      role: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
      try {
      // Call Gemini AI directly
      const { result } = await getGeminiResponse({
        prompt: input,
        type: 'chat'
      });
        // Format the response
      const formattedResponse = result
        .replace(/(?:\r\n|\r|\n){2,}/g, '\n\n') // Normalize multiple line breaks
        .replace(/^[-•] /gm, '\n• ') // Format bullet points
        .replace(/(\n\n)?Disclaimer:/g, '\n\n\nDisclaimer:') // Add space before disclaimer
        .trim();
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: formattedResponse,
        role: "assistant",
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
        role: "assistant",
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

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        content: "Hello! I'm your AI Health Assistant. I can help you with health-related questions and provide general wellness guidance. How can I assist you today?",
        role: "assistant",
        timestamp: new Date()
      }]);
    }
  }, []);

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8">
        <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6 max-w-6xl mx-auto">
          <motion.div variants={scaleIn}>
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">Health Assistant</h1>
              <p className="text-muted-foreground">Get instant AI-powered health guidance and information</p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="bg-card/50 backdrop-blur border border-border/50 rounded-lg shadow-lg"
            >
              <div className="h-[600px] flex flex-col">
                <motion.div 
                  className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-background"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      variants={popIn}
                      initial="initial"
                      animate="animate"
                      className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className={`w-8 h-8 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                        {message.role === 'user' ? (
                          <AvatarImage src={user?.user_metadata?.avatar_url} />
                        ) : (
                          <AvatarImage src="/ai-avatar.png" />
                        )}
                        <AvatarFallback>{message.role === 'user' ? 'U' : 'AI'}</AvatarFallback>
                      </Avatar>
                      
                      <div className={`group flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : ''}`}>
                        <div className={`rounded-lg p-3 ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                            : 'bg-card/80 backdrop-blur border border-border/50 text-foreground'
                        }`}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({inline, className, children, ...props}: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={tomorrow}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <span>{formatTime(new Date(message.timestamp))}</span>
                          {message.role === 'assistant' && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1 hover:text-foreground rounded" title="Helpful">
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button className="p-1 hover:text-foreground rounded" title="Not Helpful">
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 p-3"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/ai-avatar.png" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <div className="flex gap-1">
                        <motion.div
                          className="w-2 h-2 bg-primary rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1, repeatType: "loop" }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-primary rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.2, repeatType: "loop" }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-primary rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.4, repeatType: "loop" }}
                        />
                      </div>
                    </motion.div>
                  )}
                  <div ref={endOfMessagesRef} />
                </motion.div>

                <motion.div 
                  variants={fadeInUp}
                  className="p-4 border-t border-border/50"
                >
                  <motion.form 
                    onSubmit={handleSubmit}
                    className="flex gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your health question..."
                      className="flex-1 bg-card/50 border-border/50"
                    />
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <SendHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.form>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Suggested Questions Sidebar */}
          <motion.div 
            variants={staggerContainer} 
            className="space-y-3 lg:sticky lg:top-20 h-fit"
          >
            <h3 className="font-medium text-foreground/80 mb-4">Suggested Questions</h3>
            {suggestedQuestions.map((question, index) => (
              <motion.button
                key={index}
                variants={popIn}
                onClick={() => handleSuggestedQuestion(question)}
                className="w-full text-left px-4 py-3 rounded-lg bg-card/50 backdrop-blur border border-border/50 hover:bg-card/80 transition-all text-sm"
              >
                {question}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default HealthChat;
