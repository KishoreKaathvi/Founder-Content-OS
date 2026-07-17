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

function claimLead(insight: FounderInsight): string {
  return insight.claim.replace(/\s+/g, " ").trim();
}

/** Truncate without splitting http(s) URLs mid-token. */
function safeClip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  let cut = max;
  const urlStart = t.lastIndexOf("http", cut);
  if (urlStart > 20 && urlStart < cut) cut = urlStart;
  return t.slice(0, cut).replace(/[\s/._-]+$/g, "").trimEnd();
}

function draftFor(
  channel: ContentChannel,
  brief: CampaignBrief,
  insight: FounderInsight
): string {
  const claim = claimLead(insight);
  const why = insight.whyItMatters.trim();
  const cta = brief.callToAction;
  const angle = brief.coreAngle;
  const proofs = brief.proofPoints
    .filter((p) => !p.startsWith("Evidence:"))
    .slice(0, 3);
  const evidenceLines = insight.evidenceLinks
    .slice(0, 3)
    .map((e) => `• ${e.title}: ${e.uri}`)
    .join("\n");

  switch (channel) {
    case "X": {
      const body = [
        safeClip(claim, 180),
        "",
        why ? `Why it matters: ${safeClip(why, 90)}` : null,
        "",
        cta,
      ]
        .filter(Boolean)
        .join("\n");
      // Prefer complete short post over mid-URL cut
      return safeClip(body, 260) + provenanceFooter(insight);
    }

    case "LINKEDIN":
      return [
        angle,
        "",
        claim,
        "",
        why ? `For founders: ${why}` : null,
        "",
        proofs.length ? "What we can stand behind:" : null,
        ...proofs.map((p) => `• ${p}`),
        evidenceLines ? `\nOpen sources:\n${evidenceLines}` : null,
        "",
        cta,
        provenanceFooter(insight).trim(),
      ]
        .filter((x) => x !== null && x !== undefined)
        .join("\n");

    case "INSTAGRAM_POST":
      return [
        `${insight.topic}: a founder take`,
        "",
        safeClip(claim, 280),
        "",
        why,
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
        "Slide 1 — Hook: " + angle,
        "Slide 2 — The claim: " + safeClip(claim, 200),
        "Slide 3 — Why it matters: " + safeClip(why, 180),
        "Slide 4 — Proof points:",
        ...proofs.map((p, i) => `  ${i + 1}. ${p}`),
        "Slide 5 — What to do carefully: stay evidence-bound; check sources.",
        "Slide 6 — CTA: " + cta,
        evidenceLines ? `Evidence:\n${evidenceLines}` : "Evidence: see Signal Radar source.",
        provenanceFooter(insight).trim(),
      ].join("\n");

    case "INSTAGRAM_REEL":
      return [
        "Reel script (~20–30s) — editable draft",
        "Hook (0–3s): " + angle,
        "Beat 1 (3–12s): State the claim simply — " + safeClip(claim, 160),
        "Beat 2 (12–22s): Why founders should care — " + safeClip(why, 140),
        "Close (22–30s): " + cta,
        "On-screen text: keep claims conservative; no invented stats.",
        "Visual: founder talking head + source link sticker if available.",
        provenanceFooter(insight).trim(),
      ].join("\n");

    case "WHATSAPP":
      return [
        `*${insight.topic}*`,
        "",
        safeClip(claim, 260),
        why ? `\n_${safeClip(why, 160)}_` : "",
        "",
        cta,
        insight.sourceUrl ? `\nLink: ${insight.sourceUrl}` : "",
        insight.isSimulatedSource
          ? "\n(Source: simulated Signal Radar sample — not live X firehose.)"
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
        "YouTube Short script (≤60s) — editable draft",
        "Title idea: " + clipTitle(insight.topic, claim),
        "0–3s Hook: " + angle,
        "3–25s: Explain the claim in plain English — " + claim.slice(0, 200),
        "25–45s: Why it matters for Indian founders / builders — " + why.slice(0, 160),
        "45–60s CTA: " + cta,
        "Description: include source URL; no overstated claims.",
        provenanceFooter(insight).trim(),
      ].join("\n");

    case "YOUTUBE_VIDEO":
      return [
        "Long-form video brief — editable draft",
        "Working title: " + clipTitle(insight.topic, claim),
        "Core angle: " + angle,
        "Audience: " + brief.audience,
        "",
        "Outline:",
        "1. Cold open with the claim (conservative wording)",
        "2. Context: who said it / where it came from",
        "3. Why it matters for product founders",
        "4. Evidence walk-through (only listed sources)",
        "5. Practical takeaways + caveats",
        "6. CTA: " + cta,
        "",
        "Proof points:",
        ...brief.proofPoints.map((p) => `• ${p}`),
        "",
        "Pillars:",
        ...brief.contentPillars.map((p) => `• ${p}`),
        "",
        evidenceLines ? `Evidence links:\n${evidenceLines}` : "Evidence: attach Signal Radar export.",
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
