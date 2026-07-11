import React from "react";
import { useInViewAnimation } from "../hooks/useInViewAnimation";
import { Button } from "./Button";

interface PricingSectionProps {
  onEnterPortal?: () => void;
}

export function PricingSection({ onEnterPortal }: PricingSectionProps) {
  const { ref: sectionRef, isInView } = useInViewAnimation();

  const handleAction = () => {
    if (onEnterPortal) {
      onEnterPortal();
    } else {
      window.location.hash = "#portal";
    }
  };

  return (
    <section 
      ref={sectionRef} 
      className="w-full bg-slate-50/50 py-24 px-6"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:items-end">
        
        {/* Section Title */}
        <div 
          className={`mb-12 text-left md:text-right max-w-xl transition-all duration-700 ease-out transform ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="font-mono text-xs uppercase tracking-wider text-[#A068FF] font-semibold">Access</span>
          <h2 className="text-3xl md:text-4xl font-normal tracking-tight text-[#0D212C] font-serif mt-2">
            Lab access for provenance work
          </h2>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full md:max-w-4xl">
          
          {/* Card 1 - Dark */}
          <div 
            className={`bg-[#051A24] text-[#E0EBF0] rounded-[40px] pl-10 pr-10 md:pr-16 pt-10 pb-10 shadow-2xl relative overflow-hidden transition-all duration-700 ease-out transform ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{ transitionDelay: "0.1s" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#A068FF]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="text-[22px] font-medium text-[#F6FCFF] font-sans">
              Open Lab
            </h3>
            
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Full multi-view portal: Command, Sources, Cascade, Noise, Verify, Weights, Watchlist.<br />
              Runs on simulated or local fallback data — no auth required.
            </p>
            
            <div className="mt-8 mb-8">
              <span className="text-4xl font-semibold text-[#F6FCFF] font-serif">Free</span>
              <span className="block text-xs uppercase tracking-wider text-slate-400 mt-1">Local prototype</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button 
                variant="secondary" 
                onClick={handleAction}
                className="w-full sm:w-auto text-xs py-2.5 px-6 font-semibold"
              >
                Enter portal
              </Button>
              <button 
                onClick={handleAction}
                className="text-xs uppercase tracking-wider text-[#E0EBF0]/80 hover:text-white font-medium border-b border-[#E0EBF0]/20 pb-1 hover:border-white transition-all text-left sm:text-center inline-block self-start sm:self-center sm:ml-4"
              >
                How it works
              </button>
            </div>
          </div>

          {/* Card 2 - Light */}
          <div 
            className={`bg-white text-[#051A24] rounded-[40px] pl-10 pr-10 md:pr-16 pt-10 pb-10 shadow-[0_4px_30px_rgba(0,0,0,0.06)] border border-slate-100/80 relative overflow-hidden transition-all duration-700 ease-out transform ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{ transitionDelay: "0.2s" }}
          >
            <h3 className="text-[22px] font-medium text-[#0D212C] font-sans">
              Research Node
            </h3>
            
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Dedicated pipeline work: live X capture path, custom weights, and grounding depth.<br />
              Built for teams that need production signal quality.
            </p>
            
            <div className="mt-8 mb-8">
              <span className="text-4xl font-semibold text-[#0D212C] font-serif">Custom</span>
              <span className="block text-xs uppercase tracking-wider text-slate-500 mt-1">Scoped engagement</span>
            </div>
            
            <div className="mt-6">
              <Button 
                variant="primary" 
                onClick={handleAction}
                className="w-full sm:w-auto text-xs py-2.5 px-6 font-semibold bg-[#051A24] text-white hover:bg-slate-800"
              >
                Open portal
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
