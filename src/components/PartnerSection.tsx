import React from "react";
import { useInViewAnimation } from "../hooks/useInViewAnimation";
import { ArrowRight } from "lucide-react";

interface PartnerSectionProps {
  onEnterPortal?: () => void;
}

export function PartnerSection({ onEnterPortal }: PartnerSectionProps) {
  const { ref: sectionRef, isInView } = useInViewAnimation();

  const handleAction = () => {
    if (onEnterPortal) {
      onEnterPortal();
    } else {
      window.location.hash = "#portal";
    }
  };

  return (
    <section className="w-full py-16 px-6 bg-white overflow-hidden">
      <div 
        ref={sectionRef}
        className={`max-w-7xl mx-auto py-24 md:py-32 bg-[#F8FAFC] rounded-[40px] border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.02)] relative flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-1000 ease-out transform ${
          isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="relative z-10 px-6 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-[#A068FF] font-bold mb-4">
            Ready to inspect a cascade?
          </p>
          <h2 className="text-3xl md:text-5xl lg:text-[56px] font-normal tracking-tight text-[#0D212C] font-serif leading-[1.1] mb-6">
            Run a topic in the lab
          </h2>
          <p className="text-sm md:text-base text-slate-600 mb-10 max-w-lg mx-auto leading-relaxed">
            Enter the multi-view portal — no login. Pick a topic, execute analysis, and walk Command → Sources → Cascade → Verify.
          </p>
          
          <button
            onClick={handleAction}
            className="inline-flex items-center gap-3 bg-[#051A24] text-white rounded-full px-7 py-3.5 btn-primary-shadow hover:bg-[#0D212C] transition-all duration-300 transform active:scale-95 cursor-pointer text-sm md:text-base font-medium"
          >
            <span className="w-9 h-9 rounded-full bg-[#A068FF]/20 border border-[#A068FF]/40 flex items-center justify-center font-mono text-[10px] font-bold text-[#A068FF]">
              KSE
            </span>
            <span>Enter provenance portal</span>
            <ArrowRight className="w-4 h-4 opacity-70" />
          </button>
        </div>
      </div>
    </section>
  );
}
