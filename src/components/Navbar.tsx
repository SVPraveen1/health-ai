import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, User, LogOut, Brain, MessageSquare, Activity, BarChart2 } from "lucide-react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between space-x-4 px-4 md:px-6">
        <Link to="/" className="flex items-center text-lg font-semibold">
          <span>HealthAI</span>
        </Link>
        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-center md:space-x-8">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
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
        </nav>
        <div className="hidden md:flex md:items-center md:gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {user.email}
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
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
        </div>
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="border-t">
          <div className="container px-4 py-4 md:px-6">
            <nav className="flex flex-col space-y-4">
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
                    Dashboard
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {user.email}
                  </div>
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
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
