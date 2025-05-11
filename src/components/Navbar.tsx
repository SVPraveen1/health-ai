import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, User, LogOut, Brain, MessageSquare, Activity, BarChart2 } from "lucide-react";
import Profile from "./Profile";
import { motion, AnimatePresence } from "framer-motion";
import { slideInRight, listItem } from "@/lib/animations";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between space-x-4 px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="flex items-center text-lg font-semibold">
            <span>HealthAI</span>
          </Link>
        </motion.div>

        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-center md:space-x-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex space-x-8"
          >
            {/* <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link> */}
            {user && (
              <>
                <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                  Dashboard
                </Link>
                <Link to="/medication" className="text-sm font-medium transition-colors hover:text-primary">
                  Medications
                </Link>
                <Link to="/symptom-checker" className="text-sm font-medium transition-colors hover:text-primary">
                  Symptom Checker
                </Link>
                <Link to="/disease-prediction" className="text-sm font-medium transition-colors hover:text-primary">
                  Disease Prediction
                </Link>
                <Link to="/health-chat" className="text-sm font-medium transition-colors hover:text-primary">
                  Health Assistant
                </Link>
              </>
            )}
          </motion.div>
        </nav>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-16 left-0 right-0 bg-background border-b"
            >
              <div className="container px-4 py-4">
                <motion.nav
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={{
                    animate: {
                      transition: { staggerChildren: 0.1 }
                    }
                  }}
                  className="flex flex-col space-y-4"
                >
                  {/* Mobile menu items */}
                  <motion.div variants={listItem}>
                    <Link 
                      to="/" 
                      className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Home
                    </Link>
                    {user ? (
                      <>
                        <Link 
                          to="/dashboard" 
                          className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Link>
                        <Link 
                          to="/medication" 
                          className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Activity className="h-4 w-4" />
                          Medications
                        </Link>
                        <Link 
                          to="/symptom-checker" 
                          className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Brain className="h-4 w-4" />
                          Symptom Checker
                        </Link>
                        <Link 
                          to="/disease-prediction" 
                          className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Activity className="h-4 w-4" />
                          Disease Prediction
                        </Link>
                        <Link 
                          to="/health-chat" 
                          className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Health Assistant
                        </Link>
                        {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {user.email}
                        </div> */}
                        <Button variant="outline" size="sm" onClick={() => { handleSignOut(); setIsMenuOpen(false); }}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="outline" className="w-full">Sign in</Button>
                        </Link>
                        <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                          <Button className="w-full">Sign up</Button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                </motion.nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:flex md:items-center md:gap-4"
        >
          {user ? (            <Profile />
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="outline" size="sm">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </header>
  );
};

export default Navbar;
