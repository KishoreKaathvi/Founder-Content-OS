/**
 * Export approved campaign assets as Markdown or JSON.
 */
import type {
  CampaignBrief,
  ChannelAsset,
  ContentCampaign,
  ContentQualityReview,
  FounderInsight,
} from "../types";
import { filterExportableAssets } from "./qualityGate";

export function buildCampaignJson(input: {
  insight: FounderInsight;
  campaign: ContentCampaign;
  onlyApproved?: boolean;
}): string {
  const { insight, campaign, onlyApproved = true } = input;
  const assets = onlyApproved
    ? filterExportableAssets(campaign.assets, campaign.reviews)
    : campaign.assets;

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      insight,
      brief: campaign.brief,
      assets,
      reviews: campaign.reviews.filter((r) =>
        assets.some((a) => a.id === r.assetId)
      ),
      is_fallback: campaign.is_fallback,
    },
    null,
    2
  );
}

export function buildCampaignMarkdown(input: {
  insight: FounderInsight;
  brief: CampaignBrief;
  assets: ChannelAsset[];
  reviews: ContentQualityReview[];
  onlyApproved?: boolean;
}): string {
  const assets = input.onlyApproved
    ? filterExportableAssets(input.assets, input.reviews)
    : input.assets;

  const lines: string[] = [
    `# Content campaign export`,
    ``,
    `**Topic:** ${input.insight.topic}`,
    `**Objective:** ${input.brief.objective}`,
    `**Insight ID:** ${input.insight.id}`,
    `**Source original:** ${input.insight.sourceOriginalId}`,
    input.insight.sourceUrl ? `**Source URL:** ${input.insight.sourceUrl}` : "",
    input.insight.isSimulatedSource
      ? `**Origin label:** Simulated/fallback Signal Radar data`
      : "",
    ``,
    `## Claim`,
    ``,
    input.insight.claim,
    ``,
    `## Why it matters`,
    ``,
    input.insight.whyItMatters,
    ``,
    `## Campaign brief`,
    ``,
    `- Angle: ${input.brief.coreAngle}`,
    `- Audience: ${input.brief.audience}`,
    `- CTA: ${input.brief.callToAction}`,
    ``,
    `### Proof points`,
    ...input.brief.proofPoints.map((p) => `- ${p}`),
    ``,
    `## Assets`,
  ];

  for (const asset of assets) {
    const rev = input.reviews.find((r) => r.assetId === asset.id);
    lines.push(
      ``,
      `### ${asset.channel} (${asset.format}) — ${asset.status}`,
      rev
        ? `_Review: evidence ${rev.evidenceScore}, voice ${rev.voiceScore}, platform ${rev.platformFitScore}, clarity ${rev.clarityScore} → ${rev.recommendation}_`
        : "",
      ``,
      "```",
      asset.draft,
      "```"
    );
  }

  if (!assets.length) {
    lines.push(
      ``,
      `_No assets eligible for approved export. Approve only items that pass the quality gate._`
    );
  }

  return lines.filter((l) => l !== undefined).join("\n");
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime: string
): void {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
