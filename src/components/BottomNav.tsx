import React, { useState, useEffect } from "react";
import { Button } from "./Button";

interface BottomNavProps {
  onEnterPortal?: () => void;
}

export function BottomNav({ onEnterPortal }: BottomNavProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show when user scrolls down more than 300px
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const handleAction = () => {
    if (onEnterPortal) {
      onEnterPortal();
    } else {
      window.location.hash = "#portal";
    }
  };

  return (
    <div 
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out flex items-center gap-6 bg-white/95 backdrop-blur-md rounded-full px-8 py-2 border border-slate-100/80 shadow-[0_10px_40px_rgba(5,26,36,0.12),0_1px_2px_rgba(5,26,36,0.05)] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <span className="font-mono text-sm font-bold text-[#051A24] tracking-tight hover:opacity-80 transition-opacity cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        KSE
      </span>
      <Button 
        variant="primary" 
        onClick={handleAction}
        className="text-xs font-semibold py-2 px-5 bg-[#051A24] text-white hover:bg-slate-800"
      >
        Open portal
      </Button>
    </div>
  );
}
