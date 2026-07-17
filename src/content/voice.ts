/** Shared founder voice rules for Indian-fluent English drafts (V1). */

export const FOUNDER_VOICE_RULES = [
  "Use simple, clear Indian English — natural, not slangy or Hinglish.",
  "State only what the source claim and evidence support.",
  "Avoid jargon; if a technical term is needed, explain it in one short phrase.",
  "Prefer short sentences and concrete examples.",
  "Never invent stats, quotes, or links.",
  "Sound like a thoughtful founder sharing a useful observation, not a marketer.",
  "Do not claim the product scraped live X data when the source is simulated.",
  "Keep a calm, respectful tone — no hype, no fear language.",
] as const;

export const DEFAULT_AUDIENCE =
  "Founders, operators, and builders in India who read professional English online";

export function objectiveLabel(
  objective: "AWARENESS" | "TRUST" | "LEADS"
): string {
  switch (objective) {
    case "AWARENESS":
      return "Make the insight memorable and shareable";
    case "TRUST":
      return "Build credibility with evidence and careful wording";
    case "LEADS":
      return "Invite a low-friction next step without hard selling";
  }
}

export function defaultCta(
  objective: "AWARENESS" | "TRUST" | "LEADS"
): string {
  switch (objective) {
    case "AWARENESS":
      return "Save this and share with one founder who needs to see it.";
    case "TRUST":
      return "Read the source, then decide what applies to your product.";
    case "LEADS":
      return "If this matches a problem you are solving, reply or DM to compare notes.";
  }
}
