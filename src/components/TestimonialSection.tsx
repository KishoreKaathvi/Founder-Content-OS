import React, { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";
import { useInViewAnimation } from "../hooks/useInViewAnimation";

export function TestimonialSection() {
  const { ref: sectionRef, isInView } = useInViewAnimation();
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    let animFrameId: number;
    const handleScroll = () => {
      if (!imageContainerRef.current) return;
      
      const rect = imageContainerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate how far the element is relative to viewport center
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const distance = elementCenter - viewportCenter;
      
      // Calculate parallax offset (max 120px)
      const parallaxValue = (distance / viewportHeight) * -120;
      
      animFrameId = requestAnimationFrame(() => {
        setOffsetY(parallaxValue);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial call

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="py-24 px-6 max-w-4xl mx-auto flex flex-col items-center text-center bg-white"
    >
      {/* Quote Icon */}
      <div 
        className={`transition-all duration-700 ease-out transform ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "0.1s" }}
      >
        <Quote className="w-8 h-8 text-slate-900 fill-[#051A24]/5 mb-6" />
      </div>

      {/* Large quote text */}
      <h2 
        className={`text-3xl md:text-4xl lg:text-[44px] leading-[1.15] text-[#0D212C] font-normal tracking-tight max-w-2xl transition-all duration-700 ease-out transform ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "0.2s" }}
      >
        'Rank the original. Quarantine the noise. Show your work on every score.'
      </h2>

      {/* Author */}
      <p 
        className={`mt-6 italic text-sm md:text-base text-[#273C46] font-medium transition-all duration-700 ease-out transform ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "0.3s" }}
      >
        — Kishore Kaathvi, Knowledge Signal Engine
      </p>

      {/* Pipeline pillars (product language, not press logos) */}
      <div 
        className={`mt-12 flex flex-wrap justify-center items-center gap-8 md:gap-12 text-slate-900 transition-all duration-700 ease-out transform ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "0.4s" }}
      >
        <span className="font-mono text-sm font-bold tracking-widest uppercase opacity-70 hover:opacity-100 transition-opacity">
          Provenance
        </span>
        <span className="font-mono text-sm font-bold tracking-widest uppercase opacity-70 hover:opacity-100 transition-opacity">
          Cascade Graph
        </span>
        <span className="font-mono text-sm font-bold tracking-widest uppercase opacity-70 hover:opacity-100 transition-opacity">
          Multi-Signal Rank
        </span>
      </div>

      {/* Parallax Image */}
      <div 
        ref={imageContainerRef}
        className={`mt-16 w-full max-w-xs overflow-hidden rounded-2xl shadow-xl border border-slate-100 transition-all duration-1000 ease-out transform ${
          isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{ transitionDelay: "0.5s" }}
      >
        <div 
          className="w-full h-80 overflow-hidden relative"
          style={{ transform: "scale(1.15)" }}
        >
          <img 
            src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260330_103804_7aa5494f-4d5b-432e-9dc7-20715275f143.png&w=1280&q=85" 
            alt="KSE Creator" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-100 ease-out"
            style={{ 
              transform: `translateY(${offsetY}px)`,
              willChange: "transform"
            }}
          />
        </div>
      </div>
    </section>
  );
}
