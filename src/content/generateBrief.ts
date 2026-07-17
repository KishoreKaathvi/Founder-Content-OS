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
import { clipWithEllipsis, shortClaim, stripUrls } from "./textUtils";

export interface BriefInput {
  insight: FounderInsight;
  objective: CampaignObjective;
  audience?: string;
  founderContext?: string;
  id?: string;
}

function proofPointsFromInsight(insight: FounderInsight): string[] {
  const points: string[] = [];
  const claimPlain = shortClaim(insight.claim, 160);
  if (claimPlain) points.push(claimPlain);

  const why = stripUrls(insight.whyItMatters || "").trim();
  if (why) points.push(clipWithEllipsis(why, 140));

  const rel = stripUrls(insight.currentRelevance || "").trim();
  if (rel && !why.includes(rel.slice(0, 40))) {
    points.push(clipWithEllipsis(rel, 120));
  }

  for (const link of insight.evidenceLinks.slice(0, 2)) {
    points.push(`Open source: ${link.title} — ${link.uri}`);
  }

  if (insight.isSimulatedSource) {
    points.push(
      "Label origin carefully: simulated/fallback Signal Radar sample, not live X firehose."
    );
  }

  if (insight.authorHandle) {
    points.push(`Original post associated with ${insight.authorHandle}.`);
  }

  return points.slice(0, 5);
}

function coreAngleFor(
  insight: FounderInsight,
  objective: CampaignObjective,
  founderContext?: string
): string {
  const hook = shortClaim(insight.claim, 100) || insight.topic;
  const obj = objectiveLabel(objective);
  const ctx = founderContext?.trim()
    ? ` For: ${clipWithEllipsis(founderContext.trim(), 80)}`
    : "";
  // Keep angle short and non-duplicative of the full claim paste
  return clipWithEllipsis(
    `${insight.topic}: ${hook}. Angle — ${obj.toLowerCase()}.${ctx}`,
    200
  );
}

/** Deterministic brief when Gemini is unavailable. */
export function buildFallbackBrief(input: BriefInput): CampaignBrief {
  const { insight, objective } = input;
  const audience = (input.audience || DEFAULT_AUDIENCE).trim();

  return {
    id: input.id || `brief_${insight.id}_${Date.now()}`,
    insightId: insight.id,
    objective,
    audience,
    coreAngle: coreAngleFor(insight, objective, input.founderContext),
    proofPoints: proofPointsFromInsight(insight),
    contentPillars: [
      "What was claimed (conservative)",
      "Why founders should care",
      "What to do next (evidence-bound)",
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
- coreAngle must be one tight sentence (max ~180 chars), NOT a paste of the full claim.
- proofPoints: 3–5 short bullets; do not repeat the full claim three times.
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
