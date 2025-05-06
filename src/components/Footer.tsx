
import React from "react";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          <p className="text-sm text-muted-foreground">
            HealthAI © {new Date().getFullYear()}
          </p>
        </div>
        
        <div className="flex gap-4">
          <a href="#" className="text-sm text-muted-foreground hover:underline">
            Privacy
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:underline">
            Terms
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:underline">
            Contact
          </a>
        </div>
      </div>

      <div className="container mt-6 border-t pt-6">
        <div className="rounded-lg bg-muted p-4 text-sm">
          <h4 className="font-medium mb-2">HCI Principles Demonstrated:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Jakob's Law:</strong> Using conventional footer patterns users are familiar with</li>
            <li><strong>Consistency:</strong> Maintaining design consistency with the rest of the interface</li>
            <li><strong>Accessibility (WCAG):</strong> Proper contrast ratios and semantic HTML structure</li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
