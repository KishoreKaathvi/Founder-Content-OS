/**
 * Orchestrate brief + assets + quality reviews (shared by API and tests).
 */
import type {
  CampaignObjective,
  ContentCampaign,
  ContentChannel,
  FounderInsight,
} from "../types";
import { buildFallbackBrief, mergeModelBrief, type BriefInput } from "./generateBrief";
import { generateChannelAssets } from "./generateAssets";
import { reviewCampaignAssets } from "./qualityGate";

export interface BuildCampaignOptions {
  insight: FounderInsight;
  objective: CampaignObjective;
  audience?: string;
  founderContext?: string;
  channels?: ContentChannel[];
  /** Partial brief fields from Gemini when available */
  modelBrief?: Parameters<typeof mergeModelBrief>[1];
  is_fallback?: boolean;
  campaignId?: string;
}

export function buildContentCampaign(
  options: BuildCampaignOptions
): ContentCampaign {
  const briefInput: BriefInput = {
    insight: options.insight,
    objective: options.objective,
    audience: options.audience,
    founderContext: options.founderContext,
  };

  const brief = options.modelBrief
    ? mergeModelBrief(briefInput, options.modelBrief)
    : buildFallbackBrief(briefInput);

  const campaignId =
    options.campaignId || `camp_${options.insight.id}_${Date.now()}`;
  brief.id = `brief_${campaignId}`;

  const assets = generateChannelAssets(
    brief,
    options.insight,
    options.channels,
    campaignId
  );

  const reviews = reviewCampaignAssets(assets, options.insight, brief);
  const reviewById = new Map(reviews.map((r) => [r.assetId, r]));
  const assetsWithReview = assets.map((a) => ({
    ...a,
    review: reviewById.get(a.id),
  }));

  return {
    id: campaignId,
    brief,
    assets: assetsWithReview,
    reviews,
    is_fallback: options.is_fallback ?? true,
    createdAt: new Date().toISOString(),
  };
}
