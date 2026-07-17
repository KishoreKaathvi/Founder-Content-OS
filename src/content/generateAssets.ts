/**
 * Multi-platform channel adapters — pure, deterministic drafts from brief + insight.
 */
import type {
  CampaignBrief,
  ChannelAsset,
  ContentChannel,
  ContentFormat,
  FounderInsight,
} from "../types";
import { dedupeLines, safeClip, shortClaim, stripUrls } from "./textUtils";

export const ALL_CHANNELS: ContentChannel[] = [
  "X",
  "LINKEDIN",
  "INSTAGRAM_POST",
  "INSTAGRAM_CAROUSEL",
  "INSTAGRAM_REEL",
  "WHATSAPP",
  "FACEBOOK",
  "YOUTUBE_SHORT",
  "YOUTUBE_VIDEO",
];

const CHANNEL_FORMAT: Record<ContentChannel, ContentFormat> = {
  X: "TEXT",
  LINKEDIN: "TEXT",
  INSTAGRAM_POST: "TEXT",
  INSTAGRAM_CAROUSEL: "CAROUSEL",
  INSTAGRAM_REEL: "SCRIPT",
  WHATSAPP: "TEXT",
  FACEBOOK: "TEXT",
  YOUTUBE_SHORT: "SCRIPT",
  YOUTUBE_VIDEO: "CREATIVE_BRIEF",
};

function provenanceFooter(insight: FounderInsight): string {
  const bits: string[] = [];
  if (insight.sourceUrl) bits.push(`Source: ${insight.sourceUrl}`);
  if (insight.isSimulatedSource) {
    bits.push("Note: Source signal from simulated/fallback Signal Radar data.");
  }
  return bits.length ? `\n\n—\n${bits.join("\n")}` : "";
}

function draftFor(
  channel: ContentChannel,
  brief: CampaignBrief,
  insight: FounderInsight
): string {
  const claim = shortClaim(insight.claim, 200);
  const claimFull = insight.claim.replace(/\s+/g, " ").trim();
  const why = stripUrls(insight.whyItMatters || "").trim();
  const cta = brief.callToAction;
  const angle = brief.coreAngle;
  const proofs = dedupeLines(
    brief.proofPoints.filter((p) => !/^Evidence:|^Open source:/i.test(p)),
    insight.claim
  ).slice(0, 3);
  const evidenceLines = insight.evidenceLinks
    .slice(0, 3)
    .map((e) => `• ${e.title}: ${e.uri}`)
    .join("\n");
  const who = insight.authorHandle
    ? `Noted from ${insight.authorHandle}`
    : "From a ranked Signal Radar original";

  switch (channel) {
    case "X": {
      const body = [
        safeClip(claim, 160),
        why ? safeClip(why, 70) : null,
        cta,
      ]
        .filter(Boolean)
        .join("\n\n");
      return safeClip(body, 250) + provenanceFooter(insight);
    }

    case "LINKEDIN":
      return [
        angle,
        "",
        who + ":",
        claim,
        "",
        why ? `Why it matters: ${why}` : null,
        "",
        proofs.length ? "What we can stand behind:" : null,
        ...proofs.map((p) => `• ${p}`),
        evidenceLines ? `\nSources:\n${evidenceLines}` : null,
        "",
        cta,
        provenanceFooter(insight).trim(),
      ]
        .filter((x) => x !== null && x !== undefined)
        .join("\n");

    case "INSTAGRAM_POST":
      return [
        `${insight.topic} — a founder take`,
        "",
        claim,
        "",
        why ? why : null,
        "",
        cta,
        "",
        "#founders #product #india #buildinpublic",
        provenanceFooter(insight).trim(),
      ]
        .filter(Boolean)
        .join("\n");

    case "INSTAGRAM_CAROUSEL":
      return [
        "Carousel outline (editable draft)",
        "1. Hook: " + safeClip(angle, 120),
        "2. Claim: " + claim,
        "3. Why it matters: " + safeClip(why, 160),
        "4. Proof:",
        ...proofs.map((p, i) => `   ${i + 1}) ${p}`),
        "5. Caveat: stay evidence-bound; check sources before you act.",
        "6. CTA: " + cta,
        evidenceLines ? `Sources:\n${evidenceLines}` : "Sources: Signal Radar export.",
        provenanceFooter(insight).trim(),
      ].join("\n");

    case "INSTAGRAM_REEL":
      return [
        "Reel script (~20–30s) — editable draft",
        "Hook (0–3s): " + safeClip(angle, 100),
        "Beat 1 (3–12s): " + claim,
        "Beat 2 (12–22s): " + safeClip(why, 120),
        "Close (22–30s): " + cta,
        "On-screen: no invented stats; keep claims conservative.",
        "Visual: talking head + source sticker if available.",
        provenanceFooter(insight).trim(),
      ].join("\n");

    case "WHATSAPP":
      return [
        `*${insight.topic}*`,
        "",
        claim,
        why ? `\n_${safeClip(why, 140)}_` : "",
        "",
        cta,
        insight.sourceUrl ? `\nLink: ${insight.sourceUrl}` : "",
        insight.isSimulatedSource
          ? "\n_(Simulated Signal Radar sample — not live X.)_"
          : "",
      ]
        .filter(Boolean)
        .join("\n");

    case "FACEBOOK":
      return [
        angle,
        "",
        claim,
        "",
        why,
        "",
        evidenceLines ? `Sources:\n${evidenceLines}` : null,
        "",
        cta,
        provenanceFooter(insight).trim(),
      ]
        .filter((x) => x !== null && x !== undefined)
        .join("\n");

    case "YOUTUBE_SHORT":
      return [
        "YouTube Short (≤60s) — editable draft",
        "Title: " + clipTitle(insight.topic, claim),
        "0–3s: " + safeClip(angle, 90),
        "3–25s: " + claim,
        "25–45s: " + safeClip(why, 140),
        "45–60s CTA: " + cta,
        "Description: source URL only; no overstated claims.",
        provenanceFooter(insight).trim(),
      ].join("\n");

    case "YOUTUBE_VIDEO":
      return [
        "Long-form video brief — editable draft",
        "Title: " + clipTitle(insight.topic, claim),
        "Angle: " + angle,
        "Audience: " + brief.audience,
        "",
        "Outline:",
        "1. Cold open — state the claim carefully",
        "2. Who said it / where it came from (" + who + ")",
        "3. Why product founders should care",
        "4. Walk only listed evidence",
        "5. Takeaways + caveats",
        "6. CTA: " + cta,
        "",
        "Proof points:",
        ...brief.proofPoints.slice(0, 5).map((p) => `• ${p}`),
        "",
        "Pillars:",
        ...brief.contentPillars.map((p) => `• ${p}`),
        "",
        evidenceLines
          ? `Evidence:\n${evidenceLines}`
          : "Evidence: attach Signal Radar export.",
        // keep full claim once for script reference
        "",
        "Source claim (do not invent beyond this):",
        claimFull,
        provenanceFooter(insight).trim(),
      ].join("\n");
  }
}

function clipTitle(topic: string, claim: string): string {
  const base = `${topic}: ${claim}`.replace(/\s+/g, " ").trim();
  return base.length > 70 ? base.slice(0, 67) + "…" : base;
}

export function generateChannelAssets(
  brief: CampaignBrief,
  insight: FounderInsight,
  channels: ContentChannel[] = ALL_CHANNELS,
  campaignId?: string
): ChannelAsset[] {
  const cid = campaignId || brief.id.replace(/^brief_/, "camp_");
  return channels.map((channel, index) => ({
    id: `asset_${cid}_${channel}_${index}`,
    campaignId: cid,
    channel,
    format: CHANNEL_FORMAT[channel],
    draft: draftFor(channel, brief, insight),
    status: "DRAFT" as const,
  }));
}
