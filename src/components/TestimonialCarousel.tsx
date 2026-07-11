import React, { useState, useEffect, useRef } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useInViewAnimation } from "../hooks/useInViewAnimation";

const TESTIMONIALS = [
  {
    quote: "The graph-first view finally makes derivative cascades inspectable — I can see why a node ranked original, not just that it did.",
    name: "Analyst workflow",
    role: "Sources + Cascade views",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=150"
  },
  {
    quote: "Noise quarantine is the difference between a vanity topic feed and a ranked set of originals I can defend in a brief.",
    name: "Research ops",
    role: "Noise + Command funnel",
    avatar: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=150"
  },
  {
    quote: "Score vectors (originality, authority, influence, evidence, freshness) turn provenance into something you can tune and re-run.",
    name: "Scoring desk",
    role: "Weights + recalculate",
    avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=150"
  },
  {
    quote: "Verify grounding keeps the lab honest — citations next to claims, not vibes next to charts.",
    name: "Verification lane",
    role: "Verify view + citations",
    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=150"
  },
  {
    quote: "Command Center is the ops map: funnel reduction, edge taxonomy, timeline density, and fitness leaderboard in one place.",
    name: "Ops overview",
    role: "Command Center",
    avatar: "https://images.pexels.com/photos/3775087/pexels-photo-3775087.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=150"
  }
];

// Tripled for infinite scroll effect
const TRIPLED_TESTIMONIALS = [...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS];

export function TestimonialCarousel() {
  const { ref: sectionRef, isInView } = useInViewAnimation();
  const [currentIndex, setCurrentIndex] = useState(TESTIMONIALS.length); // Start at the middle set
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      handleNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev - 1;
      if (nextIndex < 0) {
        // Teleport to the end set without transition
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.transition = "none";
            setCurrentIndex(prev + TESTIMONIALS.length - 1);
          }
        }, 800);
      }
      return nextIndex;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= TRIPLED_TESTIMONIALS.length - TESTIMONIALS.length) {
        // Reset to middle without transition
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.transition = "none";
            setCurrentIndex(prev - TESTIMONIALS.length + 1);
          }
        }, 800);
      }
      return nextIndex;
    });
  };

  // Re-enable transition after resetting index
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.transition = "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
    }
  }, [currentIndex]);

  return (
    <section 
      ref={sectionRef} 
      className="py-24 bg-white overflow-hidden select-none"
    >
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header Row */}
        <div 
          className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 transition-all duration-700 ease-out transform ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-[44px] font-normal tracking-tight text-[#0D212C] font-serif leading-[1.1]">
              How <span className="font-serif italic font-semibold">analysts</span> use it
            </h2>
            <p className="text-[#273C46]/80 text-sm md:text-base mt-2">
              Workflow notes mapped to the multi-view shell — not agency reviews.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-[#A068FF] fill-[#A068FF]" />
              ))}
            </div>
            <span className="text-sm font-semibold text-[#0D212C] font-mono">
              Lab workflows
            </span>
          </div>
        </div>

        {/* Carousel & Controls */}
        <div 
          className={`relative transition-all duration-1000 ease-out transform ${
            isInView ? "opacity-100 scale-100" : "opacity-0 scale-98"
          }`}
          style={{ transitionDelay: "0.2s" }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Track container */}
          <div className="overflow-visible">
            <div 
              ref={containerRef}
              className="flex gap-6 transition-transform duration-800"
              style={{
                transform: `translateX(calc(-${currentIndex * 451.5}px))`,
                willChange: "transform"
              }}
            >
              {TRIPLED_TESTIMONIALS.map((item, idx) => {
                const isCentered = idx === currentIndex;
                return (
                  <div 
                    key={idx}
                    className={`w-[427.5px] shrink-0 bg-white rounded-[32px] md:rounded-[40px] px-8 md:pl-10 md:pr-16 py-10 transition-all duration-700 ${
                      isCentered 
                        ? "shadow-[0_12px_40px_rgba(0,0,0,0.08)] scale-100 opacity-100 border border-slate-100" 
                        : "opacity-60 scale-[0.97]"
                    }`}
                  >
                    {/* SVG Quote Icon */}
                    <svg 
                      className="w-10 h-10 text-[#A068FF] mb-6 opacity-30" 
                      fill="currentColor" 
                      viewBox="0 0 32 32"
                      aria-hidden="true"
                    >
                      <path d="M9.333 11.667v-3.5h3.5v3.5h-3.5zm10.5 0v-3.5h3.5v3.5h-3.5zM9.333 18.667H5.833V14h7v4.667c0 3.85-3.15 7-7 7v-3.5c1.925 0 3.5-1.575 3.5-3.5zm10.5 0h-3.5V14h7v4.667c0 3.85-3.15 7-7 7v-3.5c1.925 0 3.5-1.575 3.5-3.5z" />
                    </svg>

                    {/* Quote text */}
                    <p className="text-base md:text-lg text-[#0D212C] leading-relaxed font-sans font-normal italic">
                      "{item.quote}"
                    </p>

                    {/* Author row */}
                    <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100">
                      <img 
                        src={item.avatar} 
                        alt={item.name} 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="font-semibold text-sm text-[#0D212C]">
                          {item.name}
                        </h4>
                        <p className="text-xs text-[#273C46]/80 font-mono mt-0.5 flex items-center gap-1">
                          <span className="text-[#A068FF]">→</span> {item.role}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prev/Next buttons */}
          <div className="flex items-center gap-4 mt-12 justify-end">
            <button 
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="w-12 h-12 rounded-full border border-[#0D212C]/20 hover:border-[#0D212C] hover:bg-slate-50 flex items-center justify-center transition-all text-[#0D212C] active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNext}
              aria-label="Next testimonial"
              className="w-12 h-12 rounded-full border border-[#0D212C]/20 hover:border-[#0D212C] hover:bg-slate-50 flex items-center justify-center transition-all text-[#0D212C] active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
