/**
 * Local campaign history (browser localStorage). No server persistence in V1.
 */
import type { ContentCampaign, FounderInsight } from "../types";

const KEY = "kse-content-campaign-history";
const MAX = 12;

export type CampaignHistoryEntry = {
  id: string;
  savedAt: string;
  topic: string;
  objective: ContentCampaign["brief"]["objective"];
  insightId: string;
  sourceOriginalId: string;
  claimPreview: string;
  is_fallback?: boolean;
  campaign: ContentCampaign;
  insight: FounderInsight;
};

function loadRaw(): CampaignHistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CampaignHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listCampaignHistory(): CampaignHistoryEntry[] {
  return loadRaw().sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function saveCampaignHistory(
  insight: FounderInsight,
  campaign: ContentCampaign
): CampaignHistoryEntry {
  const entry: CampaignHistoryEntry = {
    id: campaign.id,
    savedAt: new Date().toISOString(),
    topic: insight.topic,
    objective: campaign.brief.objective,
    insightId: insight.id,
    sourceOriginalId: insight.sourceOriginalId,
    claimPreview: (insight.claim || "").slice(0, 120),
    is_fallback: campaign.is_fallback,
    campaign,
    insight,
  };
  const next = [
    entry,
    ...loadRaw().filter((e) => e.id !== entry.id),
  ].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
  return entry;
}

export function getCampaignHistory(id: string): CampaignHistoryEntry | null {
  return loadRaw().find((e) => e.id === id) || null;
}

export function removeCampaignHistory(id: string): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(loadRaw().filter((e) => e.id !== id))
    );
  } catch {
    /* ignore */
  }
}

export function clearCampaignHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
