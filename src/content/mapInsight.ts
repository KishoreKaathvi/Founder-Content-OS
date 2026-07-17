/**
 * Pure mapper: Signal Radar OriginalSource → FounderInsight.
 * Preserves provenance, evidence links, and simulated-source labelling.
 */
import type { FounderInsight, OriginalSource } from "../types";

export interface MapInsightOptions {
  topic?: string;
  verificationSources?: { title: string; uri: string }[];
  isFallback?: boolean;
  id?: string;
}

function buildSourceUrl(original: OriginalSource): string | undefined {
  if (original.evidence.primary_artifact_link) {
    return original.evidence.primary_artifact_link;
  }
  const handle = original.author.handle?.replace(/^@/, "") || "";
  const nativeId = original.item.source_native_id;
  if (handle && nativeId) {
    return `https://x.com/${handle}/status/${nativeId}`;
  }
  return undefined;
}

function collectEvidenceLinks(
  original: OriginalSource,
  verificationSources?: { title: string; uri: string }[]
): { title: string; uri: string }[] {
  const links: { title: string; uri: string }[] = [];
  const seen = new Set<string>();

  const push = (title: string, uri: string) => {
    const key = uri.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    links.push({ title: title || key, uri: key });
  };

  for (const url of original.item.urls || []) {
    push("Source link", url);
  }

  if (original.evidence.primary_artifact_link) {
    push("Primary artifact", original.evidence.primary_artifact_link);
  }

  for (const c of original.evidence.corroborated_by || []) {
    if (c.startsWith("http://") || c.startsWith("https://")) {
      push("Corroboration", c);
    }
  }

  for (const s of verificationSources || []) {
    if (s?.uri) push(s.title || "Verification source", s.uri);
  }

  return links;
}

/**
 * Map a ranked Signal Radar original into a Founder Insight.
 * Does not invent facts — only restructures existing fields.
 */
export function toFounderInsight(
  original: OriginalSource,
  options: MapInsightOptions = {}
): FounderInsight {
  if (!original?.item || !original?.content_id) {
    throw new Error("Invalid OriginalSource: missing item or content_id");
  }

  const claim = (original.item.text || "").trim();
  const whyItMatters = (original.why_it_matters || "").trim();
  const topic =
    (options.topic || "").trim() ||
    original.item.entities?.[0] ||
    "Founder insight";

  return {
    id: options.id || `insight_${original.content_id}`,
    sourceOriginalId: original.content_id,
    topic,
    claim,
    whyItMatters:
      whyItMatters ||
      "This ranked original may matter to founders following this topic.",
    evidenceLinks: collectEvidenceLinks(original, options.verificationSources),
    sourceUrl: buildSourceUrl(original),
    authority: original.scores?.authority ?? 0,
    originality: original.scores?.originality ?? 0,
    freshness: original.scores?.freshness ?? 0,
    audience: "INDIAN_ENGLISH",
    isSimulatedSource: Boolean(options.isFallback),
    authorHandle: original.author?.handle,
    currentRelevance: original.current_relevance,
  };
}
