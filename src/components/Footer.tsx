import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "./Button";

interface FooterProps {
  onEnterPortal?: () => void;
}

export function Footer({ onEnterPortal }: FooterProps) {
  const handleAction = () => {
    if (onEnterPortal) {
      onEnterPortal();
    } else {
      window.location.hash = "#portal";
    }
  };

  const handleScroll = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full bg-white border-t border-slate-100 py-16 px-6">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
        
        <div className="flex flex-col items-start gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-slate-400">Ready to rank originals?</span>
          <Button 
            variant="primary" 
            onClick={handleAction}
            className="text-sm font-semibold"
          >
            Open portal
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-16 md:gap-24 items-start">
          
          <div className="flex flex-col gap-4">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Product
            </span>
            <a 
              href="#about" 
              onClick={handleScroll("about")}
              className="text-base text-[#051A24] hover:opacity-70 transition-opacity font-medium"
            >
              How it works
            </a>
            <a 
              href="#projects" 
              onClick={handleScroll("projects")}
              className="text-base text-[#051A24] hover:opacity-70 transition-opacity font-medium"
            >
              Capabilities
            </a>
            <a 
              href="#pricing" 
              onClick={handleScroll("pricing")}
              className="text-base text-[#051A24] hover:opacity-70 transition-opacity font-medium"
            >
              Access
            </a>
          </div>

          <div className="flex flex-col gap-4">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center gap-1">
              Docs <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <a 
              href="#faq" 
              onClick={handleScroll("faq")}
              className="text-base text-[#051A24] hover:opacity-70 transition-opacity font-medium"
            >
              Methodology
            </a>
            <a 
              href="https://github.com/KishoreKaathvi/X-KES-App-July26" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-base text-[#051A24] hover:opacity-70 transition-opacity font-medium flex items-center gap-1"
            >
              GitHub
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
}
