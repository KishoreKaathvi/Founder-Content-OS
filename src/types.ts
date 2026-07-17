/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Author {
  id: str;
  source: string; // "x" for MVP
  handle: string;
  name: string;
  verified: boolean;
  follower_count: number;
  avatar_url?: string;
  source_meta?: Record<string, any>;
}

export type str = string;

export interface ContentItem {
  id: string; // internal UUID / ID
  source: string; // "x" for MVP
  source_native_id: string;
  author_id: string;
  created_at: string; // ISO UTC string - critical for temporal ordering
  text: string;
  urls: string[]; // extracted links
  media_hashes: string[]; // perceptual image hashes (to catch screenshots)
  mentioned_authors: string[];
  parent_id: string | null; // reply-to internal ID if resolvable
  quoted_id: string | null; // quoted content internal ID if resolvable
  entities: string[]; // extracted named entities / topics
  embedding?: number[];
  source_meta?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    views?: number;
  };
}

export interface Edge {
  src: string; // ContentItem.id (sender/derivative)
  dst: string; // ContentItem.id (target/original)
  kind:
    | "quote"
    | "reply"
    | "same_url"
    | "same_image_hash"
    | "semantic_sim"
    | "shared_entity"
    | "shared_hashtag"
    | "time_proximity"
    | "same_external_article";
  directed: boolean;
  weight: number; // 0.0 to 1.0
  evidence?: {
    cosine?: number;
    phash_dist?: number;
    url?: string;
    details?: string;
  };
}

export interface ScoreVector {
  originality: number; // 0.0 - 1.0
  authority: number; // 0.0 - 1.0
  influence: number; // 0.0 - 1.0
  evidence: number; // 0.0 - 1.0
  freshness: number; // 0.0 - 1.0
  community_validation: number | null; // null for MVP
}

export interface OriginalSource {
  rank: number;
  content_id: string;
  item: ContentItem;
  author: Author;
  why_it_matters: string; // Generated server-side with Gemini
  current_relevance: string; // Generated server-side with Gemini
  source_fitness: number;
  derivative_score: number;
  scores: ScoreVector;
  evidence: {
    earliest_in_component: boolean;
    original_media: boolean;
    corroborated_by: string[];
    primary_artifact_link?: string;
  };
  derivatives: {
    copied_narratives: string[]; // Texts of tweets that copied this
    notable_followups: string[]; // Handles or texts of notable followups
  };
}

export interface ProvenanceWeights {
  w_time: number; // Time priority weight
  w_auth: number; // Author authority weight
  w_infl: number; // Downstream influence weight
  w_deriv: number; // Derivative penalty weight
}

export interface PresentationWeights {
  alpha: number; // originality
  beta: number; // authority
  gamma: number; // influence
  delta: number; // evidence
  epsilon: number; // freshness
  zeta: number; // community_validation (0 at MVP)
}

export interface KSERunResult {
  topic: string;
  run_meta: {
    collected_candidates: number;
    after_dedup: number;
    components: number;
    api_calls_used: number;
    noise_filtered_count?: number;
  };
  raw_items: ContentItem[];
  authors: Record<string, Author>;
  edges: Edge[];
  originals: OriginalSource[];
  summary: string; // Gemini topic summary
  weights: {
    provenance: ProvenanceWeights;
    presentation: PresentationWeights;
  };
  is_fallback?: boolean;
  verification_grounding?: {
    verdict_summary: string;
    sources: { uri: string; title: string }[];
  };
  noise_candidates?: {
    id: string;
    text: string;
    author_handle: string;
    reason: string;
  }[];
}

export interface AlertTopic {
  id: string;
  topic: string;
  savedAt: string;
  hasNewNotification: boolean;
  matchCount: number;
}

/* ── Founder Content OS contracts ─────────────────────────────── */

export type CampaignObjective = "AWARENESS" | "TRUST" | "LEADS";

export type ContentChannel =
  | "X"
  | "LINKEDIN"
  | "INSTAGRAM_POST"
  | "INSTAGRAM_CAROUSEL"
  | "INSTAGRAM_REEL"
  | "WHATSAPP"
  | "FACEBOOK"
  | "YOUTUBE_SHORT"
  | "YOUTUBE_VIDEO";

export type ContentFormat = "TEXT" | "CAROUSEL" | "SCRIPT" | "CREATIVE_BRIEF";

export type AssetStatus = "DRAFT" | "REVIEWED" | "APPROVED" | "EXPORTED";

export type QualityRecommendation = "REVISE" | "APPROVE";

export interface FounderInsight {
  id: string;
  sourceOriginalId: string;
  topic: string;
  claim: string;
  whyItMatters: string;
  evidenceLinks: { title: string; uri: string }[];
  sourceUrl?: string;
  authority: number;
  originality: number;
  freshness: number;
  audience: "INDIAN_ENGLISH";
  /** True when the parent KSE run used simulated/fallback data */
  isSimulatedSource?: boolean;
  authorHandle?: string;
  currentRelevance?: string;
}

export interface CampaignBrief {
  id: string;
  insightId: string;
  objective: CampaignObjective;
  audience: string;
  coreAngle: string;
  proofPoints: string[];
  contentPillars: string[];
  callToAction: string;
  voiceRules: string[];
}

export interface ChannelAsset {
  id: string;
  campaignId: string;
  channel: ContentChannel;
  format: ContentFormat;
  draft: string;
  status: AssetStatus;
  review?: ContentQualityReview;
}

export interface ContentQualityReview {
  assetId: string;
  evidenceScore: number;
  voiceScore: number;
  platformFitScore: number;
  clarityScore: number;
  risks: string[];
  recommendation: QualityRecommendation;
}

export interface ContentCampaign {
  id: string;
  brief: CampaignBrief;
  assets: ChannelAsset[];
  reviews: ContentQualityReview[];
  is_fallback?: boolean;
  createdAt: string;
}

export interface CreateCampaignRequest {
  insight: FounderInsight;
  objective: CampaignObjective;
  audience?: string;
  founderContext?: string;
  channels?: ContentChannel[];
}

export interface ApiErrorBody {
  error: string;
  code: "VALIDATION" | "INTERNAL";
  details?: string[];
}

