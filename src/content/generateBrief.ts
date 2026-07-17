/**
 * Campaign brief generation — deterministic fallback always available.
 */
import type {
  CampaignBrief,
  CampaignObjective,
  FounderInsight,
} from "../types";
import {
  DEFAULT_AUDIENCE,
  FOUNDER_VOICE_RULES,
  defaultCta,
  objectiveLabel,
} from "./voice";

export interface BriefInput {
  insight: FounderInsight;
  objective: CampaignObjective;
  audience?: string;
  founderContext?: string;
  id?: string;
}

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function proofPointsFromInsight(insight: FounderInsight): string[] {
  const points: string[] = [];
  if (insight.claim) points.push(clip(insight.claim, 220));
  if (insight.whyItMatters) points.push(clip(insight.whyItMatters, 180));
  if (insight.currentRelevance) points.push(clip(insight.currentRelevance, 160));
  for (const link of insight.evidenceLinks.slice(0, 3)) {
    points.push(`Evidence: ${link.title} — ${link.uri}`);
  }
  if (insight.isSimulatedSource) {
    points.push(
      "Source origin: simulated/fallback Signal Radar run — label carefully in drafts."
    );
  }
  return points.slice(0, 6);
}

/** Deterministic brief when Gemini is unavailable. */
export function buildFallbackBrief(input: BriefInput): CampaignBrief {
  const { insight, objective } = input;
  const audience = (input.audience || DEFAULT_AUDIENCE).trim();
  const angle = clip(
    `${objectiveLabel(objective)}: ${insight.claim || insight.topic}`,
    280
  );

  return {
    id: input.id || `brief_${insight.id}_${Date.now()}`,
    insightId: insight.id,
    objective,
    audience,
    coreAngle: angle,
    proofPoints: proofPointsFromInsight(insight),
    contentPillars: [
      "What changed or was claimed",
      "Why founders should care",
      "What to do next (careful, evidence-bound)",
    ],
    callToAction: defaultCta(objective),
    voiceRules: [...FOUNDER_VOICE_RULES],
  };
}

export function briefPrompt(input: BriefInput): string {
  const { insight, objective, founderContext } = input;
  return `You are an editorial planner for a founder Content OS.
Return ONLY valid JSON matching this shape:
{
  "coreAngle": string,
  "proofPoints": string[],
  "contentPillars": string[],
  "callToAction": string,
  "voiceRules": string[]
}

Rules:
- Audience: Indian-fluent professional English readers (founders/operators).
- Objective: ${objective} (${objectiveLabel(objective)})
- Use ONLY facts present in the insight. Do not invent numbers, quotes, or URLs.
- Keep language simple and non-jargon.
${insight.isSimulatedSource ? "- The source run is SIMULATED/FALLBACK — do not claim live X collection.\n" : ""}
Insight:
Topic: ${insight.topic}
Claim: ${insight.claim}
Why it matters: ${insight.whyItMatters}
Relevance: ${insight.currentRelevance || "n/a"}
Authority: ${insight.authority}, Originality: ${insight.originality}, Freshness: ${insight.freshness}
Source URL: ${insight.sourceUrl || "n/a"}
Evidence: ${JSON.stringify(insight.evidenceLinks)}
${founderContext ? `Founder context: ${founderContext}` : ""}
Audience override: ${input.audience || DEFAULT_AUDIENCE}
`;
}

export function mergeModelBrief(
  input: BriefInput,
  partial: Partial<
    Pick<
      CampaignBrief,
      | "coreAngle"
      | "proofPoints"
      | "contentPillars"
      | "callToAction"
      | "voiceRules"
    >
  >
): CampaignBrief {
  const fallback = buildFallbackBrief(input);
  return {
    ...fallback,
    coreAngle: partial.coreAngle?.trim() || fallback.coreAngle,
    proofPoints:
      Array.isArray(partial.proofPoints) && partial.proofPoints.length
        ? partial.proofPoints.map(String)
        : fallback.proofPoints,
    contentPillars:
      Array.isArray(partial.contentPillars) && partial.contentPillars.length
        ? partial.contentPillars.map(String)
        : fallback.contentPillars,
    callToAction: partial.callToAction?.trim() || fallback.callToAction,
    voiceRules:
      Array.isArray(partial.voiceRules) && partial.voiceRules.length
        ? partial.voiceRules.map(String)
        : fallback.voiceRules,
  };
}
