import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link 
    to={to} 
    className={cn(
      "text-muted-foreground hover:text-foreground transition-colors",
      "relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0",
      "after:bg-foreground after:transition-all hover:after:w-full"
    )}
  >
    {children}
  </Link>
);

const Footer = () => {
  return (    <footer className="relative mt-auto border-t shadow-[0_-1px_2px_0_rgba(0,0,0,0.05)]">
      {/* Gradient separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
      
      {/* Main content */}      <div className="relative backdrop-blur-md" style={{ backgroundColor: '#222831' }}>
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                About HealthAI
              </h2>
              <p className="text-muted-foreground max-w-md">
                Your one-stop platform for managing personal health and medical consultations.
                Powered by advanced AI technology to provide personalized healthcare guidance.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                Quick Links
              </h2>
              <div className="flex flex-row space-x-6">
                <FooterLink to="/">Home</FooterLink>
                <FooterLink to="/dashboard">Dashboard</FooterLink>
                <FooterLink to="/contact">Contact</FooterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
