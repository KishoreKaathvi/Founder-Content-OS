/**
 * API-boundary validation for POST /api/content/campaigns
 */
import type {
  ApiErrorBody,
  CampaignObjective,
  ContentChannel,
  CreateCampaignRequest,
  FounderInsight,
} from "../types";
import { ALL_CHANNELS } from "./generateAssets";

const OBJECTIVES: CampaignObjective[] = ["AWARENESS", "TRUST", "LEADS"];

export type ValidatedCampaignRequest = {
  insight: FounderInsight;
  objective: CampaignObjective;
  audience?: string;
  founderContext?: string;
  channels: ContentChannel[];
};

export function validateCampaignRequest(
  body: unknown
): { ok: true; value: ValidatedCampaignRequest } | { ok: false; error: ApiErrorBody } {
  const details: string[] = [];
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      error: {
        error: "Request body must be a JSON object",
        code: "VALIDATION",
      },
    };
  }

  const b = body as Partial<CreateCampaignRequest>;
  const insight = b.insight as FounderInsight | undefined;

  if (!insight || typeof insight !== "object") {
    details.push("insight is required");
  } else {
    if (!insight.id || typeof insight.id !== "string") details.push("insight.id is required");
    if (!insight.sourceOriginalId || typeof insight.sourceOriginalId !== "string") {
      details.push("insight.sourceOriginalId is required");
    }
    if (!insight.claim || typeof insight.claim !== "string") {
      details.push("insight.claim is required");
    }
    if (!insight.topic || typeof insight.topic !== "string") {
      details.push("insight.topic is required");
    }
    if (insight.audience !== "INDIAN_ENGLISH") {
      details.push('insight.audience must be "INDIAN_ENGLISH"');
    }
    if (!Array.isArray(insight.evidenceLinks)) {
      details.push("insight.evidenceLinks must be an array");
    }
  }

  if (!b.objective || !OBJECTIVES.includes(b.objective as CampaignObjective)) {
    details.push('objective must be one of AWARENESS | TRUST | LEADS');
  }

  let channels: ContentChannel[] = ALL_CHANNELS;
  if (b.channels !== undefined) {
    if (!Array.isArray(b.channels) || !b.channels.length) {
      details.push("channels must be a non-empty array when provided");
    } else {
      const bad = b.channels.filter((c) => !ALL_CHANNELS.includes(c as ContentChannel));
      if (bad.length) details.push(`unknown channels: ${bad.join(", ")}`);
      else channels = b.channels as ContentChannel[];
    }
  }

  if (details.length) {
    return {
      ok: false,
      error: {
        error: "Invalid campaign request",
        code: "VALIDATION",
        details,
      },
    };
  }

  return {
    ok: true,
    value: {
      insight: insight as FounderInsight,
      objective: b.objective as CampaignObjective,
      audience: typeof b.audience === "string" ? b.audience : undefined,
      founderContext:
        typeof b.founderContext === "string" ? b.founderContext : undefined,
      channels,
    },
  };
}
