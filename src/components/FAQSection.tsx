import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle, Shield, GitBranch, Cpu } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ElementType;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "What is KSE (Knowledge Signal Engine)?",
    answer: "KSE is a multi-view provenance lab for high-signal social posts. Given a topic, it builds a candidate set, filters noise, constructs a relationship graph, ranks up to 10 original sources with source_fitness and multi-signal scores, then supports verification grounding and export.",
    icon: Cpu,
  },
  {
    question: "How does KSE's provenance analysis work?",
    answer: "After graph clustering (DSU), each component scores nodes with temporal priority, authority, downstream influence, and a derivative penalty. The highest source_fitness node becomes the original seed; presentation ranking then orders seeds by originality, authority, influence, evidence, and freshness.",
    icon: Shield,
  },
  {
    question: "What are 'original' signal nodes?",
    answer: "An original is the ranked seed of a cascade component — typically the earliest high-fitness post that other nodes quote, reply to, share via the same URL/media hash, or paraphrase. The lab surfaces ≤10 originals with score vectors so you can audit why each one ranked.",
    icon: GitBranch,
  },
  {
    question: "How are cascade edges categorized?",
    answer: "Edges are structural and cross-reference types used by the pipeline: quote, reply, same_url, same_image_hash, and semantic similarity (Jaccard threshold). Command Center shows the edge taxonomy mix for the current run.",
    icon: ChevronDown,
  },
  {
    question: "Is this live X data?",
    answer: "Not yet. Stage ① candidates come from Gemini JSON simulation (when an API key is available) or a local fallback dataset. The algorithms and UI are real; live X collection is on the production path, not this prototype.",
    icon: HelpCircle,
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 px-6 md:px-16 bg-white border-t border-slate-100 flex flex-col items-center">
      <div className="w-full max-w-[800px] flex flex-col">
        {/* Header block */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            <HelpCircle className="w-4 h-4 text-[#A068FF]" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-600 font-bold">
              Frequently Asked Questions
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-[44px] leading-[1.1] font-semibold text-[#051A24] tracking-tight mb-4">
            Methodology & Provenance
          </h2>
          <p className="text-sm md:text-base text-slate-600 max-w-[550px] mx-auto">
            Learn more about the technology, algorithms, and models powering the Knowledge Signal Engine.
          </p>
        </div>

        {/* Accordion items */}
        <div className="space-y-4">
          {FAQ_DATA.map((item, index) => {
            const isOpen = openIndex === index;
            const Icon = item.icon;

            return (
              <div 
                key={index}
                className="border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors duration-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  className="w-full text-left px-6 py-5 md:px-8 md:py-6 flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#A068FF] shadow-sm shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-sans font-semibold text-base md:text-lg text-[#051A24] tracking-tight">
                      {item.question}
                    </span>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-6 pb-6 pt-1 md:px-8 md:pb-8 text-sm md:text-base text-slate-600 leading-relaxed pl-[72px] pr-8">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
