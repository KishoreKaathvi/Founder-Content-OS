/**
 * Content quality gate — blocks weak / overstated drafts from APPROVED export.
 */
import type {
  CampaignBrief,
  ChannelAsset,
  ContentQualityReview,
  FounderInsight,
} from "../types";

const JARGON =
  /\b(synergy|leverage|disrupt|paradigm|game-?changer|revolutionary|10x your|guaranteed|unlimited|secret hack)\b/i;

const HYPE =
  /\b(everyone must|you will fail|never before|absolute truth|proven to 10x)\b/i;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function wordOverlapScore(a: string, b: string): number {
  const tokens = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit / A.size;
}

function extractUrls(text: string): string[] {
  const raw = text.match(/https?:\/\/[^\s)]+/g) || [];
  // Ignore truncated / ellipsis fragments (clip leftovers) — not real invented links
  return raw.filter((u) => {
    if (/[…]$/.test(u) || u.includes("…")) return false;
    if (u.length < 12) return false;
    // Incomplete host only (e.g. https://medium.com/engin)
    try {
      const parsed = new URL(u.replace(/[.,;:]+$/, ""));
      if (!parsed.hostname.includes(".")) return false;
      return true;
    } catch {
      return false;
    }
  });
}

function urlKnown(candidate: string, known: Set<string>): boolean {
  const clean = candidate.replace(/[.,;]+$/g, "");
  for (const k of known) {
    if (!k) continue;
    if (clean === k || clean.startsWith(k) || k.startsWith(clean)) return true;
    // Prefix match when draft URL is a shorter prefix of a known link
    if (k.startsWith(clean) || clean.startsWith(k.split("?")[0])) return true;
  }
  return false;
}

export function reviewAsset(
  asset: ChannelAsset,
  insight: FounderInsight,
  brief: CampaignBrief
): ContentQualityReview {
  const risks: string[] = [];
  const draft = asset.draft || "";

  // Evidence fidelity: draft should echo the claim / why-it-matters, not invent URLs
  const claimOverlap = wordOverlapScore(insight.claim, draft);
  const whyOverlap = wordOverlapScore(insight.whyItMatters, draft);
  let evidenceScore = clamp01(0.45 * claimOverlap + 0.25 * whyOverlap + 0.3);

  const known = new Set(
    [
      ...insight.evidenceLinks.map((e) => e.uri),
      insight.sourceUrl,
    ].filter(Boolean) as string[]
  );
  const draftUrls = extractUrls(draft);
  const unknownUrls = draftUrls.filter((u) => {
    if (urlKnown(u, known)) return false;
    // allow x.com status links for the author
    if (insight.sourceUrl && u.includes("x.com/") && insight.sourceUrl.includes("x.com/")) {
      return false;
    }
    return true;
  });
  if (unknownUrls.length) {
    evidenceScore = clamp01(evidenceScore - 0.35 * unknownUrls.length);
    risks.push(
      `Draft includes URL(s) not in source evidence: ${unknownUrls.slice(0, 2).join(", ")}`
    );
  }

  if (claimOverlap < 0.08 && insight.claim.length > 40) {
    evidenceScore = clamp01(evidenceScore - 0.25);
    risks.push("Draft barely reflects the source claim — restate the claim conservatively.");
  }

  // Voice
  let voiceScore = 0.85;
  if (JARGON.test(draft)) {
    voiceScore -= 0.25;
    risks.push("Remove marketing jargon; use plain Indian-fluent English.");
  }
  if (HYPE.test(draft)) {
    voiceScore -= 0.2;
    risks.push("Tone is overstated — soften absolute claims.");
  }
  if (insight.isSimulatedSource && !/simulat|fallback|sample|not live/i.test(draft)) {
    voiceScore -= 0.15;
    risks.push(
      "Source is simulated/fallback — label origin so readers are not misled."
    );
  }
  voiceScore = clamp01(voiceScore);

  // Platform fit (length / structure heuristics)
  let platformFitScore = 0.8;
  const len = draft.trim().length;
  if (asset.channel === "X" && len > 400) {
    platformFitScore -= 0.25;
    risks.push("X draft is long — tighten toward a postable length.");
  }
  if (asset.channel === "WHATSAPP" && len > 900) {
    platformFitScore -= 0.15;
    risks.push("WhatsApp draft is long for status/broadcast — shorten.");
  }
  if (
    (asset.format === "SCRIPT" || asset.format === "CAROUSEL") &&
    !/\n/.test(draft)
  ) {
    platformFitScore -= 0.2;
    risks.push("Script/carousel should keep a structured multi-line outline.");
  }
  if (!brief.callToAction || !draft.includes(brief.callToAction.slice(0, 20))) {
    // soft: CTA may be paraphrased
    platformFitScore -= 0.05;
  }
  platformFitScore = clamp01(platformFitScore);

  // Clarity
  const sentences = draft.split(/[.!?\n]+/).filter((s) => s.trim().length > 8);
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 35).length;
  let clarityScore = 0.85;
  if (longSentences > 2) {
    clarityScore -= 0.2;
    risks.push("Break long sentences for clearer Indian English reading.");
  }
  if (len < 40) {
    clarityScore -= 0.3;
    risks.push("Draft is too short to be useful — expand with claim + why + CTA.");
  }
  clarityScore = clamp01(clarityScore);

  const avg =
    (evidenceScore + voiceScore + platformFitScore + clarityScore) / 4;
  const recommendation = avg >= 0.62 && evidenceScore >= 0.5 ? "APPROVE" : "REVISE";

  if (recommendation === "REVISE" && !risks.length) {
    risks.push("Scores below threshold — strengthen evidence fidelity and clarity.");
  }

  return {
    assetId: asset.id,
    evidenceScore: round2(evidenceScore),
    voiceScore: round2(voiceScore),
    platformFitScore: round2(platformFitScore),
    clarityScore: round2(clarityScore),
    risks,
    recommendation,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function reviewCampaignAssets(
  assets: ChannelAsset[],
  insight: FounderInsight,
  brief: CampaignBrief
): ContentQualityReview[] {
  return assets.map((a) => reviewAsset(a, insight, brief));
}

/** Only APPROVE-recommended assets may be exported as approved. */
export function filterExportableAssets(
  assets: ChannelAsset[],
  reviews: ContentQualityReview[]
): ChannelAsset[] {
  const byId = new Map(reviews.map((r) => [r.assetId, r]));
  return assets.filter((a) => {
    if (a.status !== "APPROVED" && a.status !== "EXPORTED") return false;
    // Prefer explicit review list (latest gate run) over stale embedded review
    const rev = byId.get(a.id) || a.review;
    return rev?.recommendation === "APPROVE";
  });
}
