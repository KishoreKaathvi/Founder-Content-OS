import React from "react";
import { useInViewAnimation } from "../hooks/useInViewAnimation";
import { LayoutDashboard, GitBranch, ShieldCheck } from "lucide-react";

const CAPABILITIES = [
  {
    name: "Command Center",
    desc: "Ops overview: pipeline funnel, score-vector means, edge taxonomy, cascade timeline, and source-fitness leaderboard.",
    icon: LayoutDashboard,
    tags: ["funnel", "score vector", "leaderboard"],
  },
  {
    name: "Cascade Graph",
    desc: "Force graph of quote, reply, same-URL, media-hash, and semantic edges — inspect components that became ranked originals.",
    icon: GitBranch,
    tags: ["DSU clusters", "edge types", "influence"],
  },
  {
    name: "Verify Desk",
    desc: "Ground top claims against external search results and surface citations so ranking decisions are auditable.",
    icon: ShieldCheck,
    tags: ["grounding", "citations", "verdicts"],
  },
];

function CapabilityCard({ item, index }: { item: typeof CAPABILITIES[0]; index: number }) {
  const { ref, isInView } = useInViewAnimation();
  const Icon = item.icon;

  return (
    <div 
      ref={ref}
      className={`flex flex-col gap-6 transition-all duration-1000 ease-out transform ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
      }`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className="ml-4 md:ml-12 max-w-xl">
        <h3 className="text-2xl md:text-3xl font-semibold text-[#051A24] font-serif tracking-tight">
          {item.name}
        </h3>
        <p className="text-sm md:text-base text-[#051A24]/70 font-sans mt-2">
          {item.desc}
        </p>
      </div>

      <div className="w-full min-h-[220px] md:min-h-[280px] overflow-hidden rounded-2xl shadow-xl border border-slate-100 bg-gradient-to-br from-[#051A24] via-[#0D212C] to-[#1a0a2e] p-8 md:p-12 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
            <Icon className="w-7 h-7 text-[#A068FF]" />
          </div>
          <span className="font-mono text-[11px] tracking-widest text-[#A068FF] font-bold">
            VIEW 0{index + 1}
          </span>
        </div>
        <div>
          <p className="text-white/90 font-serif text-xl md:text-2xl tracking-tight max-w-lg">
            {item.name}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectsSection() {
  const { ref: headingRef, isInView: isHeadingInView } = useInViewAnimation();

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-24 flex flex-col gap-24">
      <div 
        ref={headingRef}
        className={`max-w-xl transition-all duration-700 ease-out transform ${
          isHeadingInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <span className="font-mono text-xs uppercase tracking-wider text-[#A068FF] font-semibold">
          Product surfaces
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-[44px] font-normal tracking-tight text-[#0D212C] font-serif mt-2 leading-[1.1]">
          What the portal actually does
        </h2>
      </div>

      <div className="flex flex-col gap-24 md:gap-32">
        {CAPABILITIES.map((item, idx) => (
          <CapabilityCard key={item.name} item={item} index={idx} />
        ))}
      </div>
    </section>
  );
}
