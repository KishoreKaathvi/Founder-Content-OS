/**
 * Content Studio — select a Signal Radar original → campaign → edit/approve/export.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  PenLine,
  Sparkles,
  Download,
  Check,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  FileJson,
  FileText,
} from "lucide-react";
import type { KseAnalysisApi } from "../hooks/useKseAnalysis";
import type {
  CampaignObjective,
  ChannelAsset,
  ContentCampaign,
  ContentChannel,
  FounderInsight,
} from "../types";
import { toFounderInsight } from "../content/mapInsight";
import {
  buildCampaignJson,
  buildCampaignMarkdown,
  downloadTextFile,
} from "../content/exportCampaign";
import { ALL_CHANNELS } from "../content/generateAssets";
import { reviewAsset } from "../content/qualityGate";

const OBJECTIVES: { id: CampaignObjective; label: string; hint: string }[] = [
  { id: "AWARENESS", label: "Awareness", hint: "Memorable, shareable" },
  { id: "TRUST", label: "Trust", hint: "Evidence-first" },
  { id: "LEADS", label: "Leads", hint: "Soft next step" },
];

const CHANNEL_LABEL: Record<ContentChannel, string> = {
  X: "X",
  LINKEDIN: "LinkedIn",
  INSTAGRAM_POST: "IG Post",
  INSTAGRAM_CAROUSEL: "IG Carousel",
  INSTAGRAM_REEL: "IG Reel",
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  YOUTUBE_SHORT: "YT Short",
  YOUTUBE_VIDEO: "YT Video",
};

export default function ContentStudioView({ api }: { api: KseAnalysisApi }) {
  const originals = api.searchedOriginals;
  const [selectedId, setSelectedId] = useState<string | null>(
    api.selectedNodeId
  );
  const [objective, setObjective] = useState<CampaignObjective>("TRUST");
  const [founderContext, setFounderContext] = useState("");
  const [campaign, setCampaign] = useState<ContentCampaign | null>(null);
  const [insight, setInsight] = useState<FounderInsight | null>(null);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sources / Command jump desk may pre-select a signal
  useEffect(() => {
    if (api.selectedNodeId) setSelectedId(api.selectedNodeId);
  }, [api.selectedNodeId]);

  const selectedOriginal = useMemo(
    () => originals.find((o) => o.content_id === selectedId) || null,
    [originals, selectedId]
  );

  const activeAsset =
    campaign?.assets.find((a) => a.id === activeAssetId) ||
    campaign?.assets[0] ||
    null;

  const generate = async () => {
    if (!selectedOriginal || !api.result) {
      setError("Run Signal Radar first, then pick a ranked original.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const mapped = toFounderInsight(selectedOriginal, {
        topic: api.result.topic || api.topic,
        verificationSources: api.result.verification_grounding?.sources,
        isFallback: Boolean(api.result.is_fallback),
      });
      setInsight(mapped);

      const res = await fetch("/api/content/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insight: mapped,
          objective,
          founderContext: founderContext.trim() || undefined,
          channels: ALL_CHANNELS,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = Array.isArray(data?.details)
          ? data.details.join("; ")
          : "";
        throw new Error(data?.error || details || "Campaign generation failed");
      }
      setCampaign(data as ContentCampaign);
      setActiveAssetId((data as ContentCampaign).assets[0]?.id ?? null);
    } catch (e: any) {
      setError(e?.message || "Failed to generate campaign");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateDraft = (assetId: string, draft: string) => {
    if (!campaign || !insight) return;
    const nextAssets = campaign.assets.map((a) => {
      if (a.id !== assetId) return a;
      const updated = { ...a, draft, status: "DRAFT" as const };
      const liveReview = reviewAsset(updated, insight, campaign.brief);
      return { ...updated, review: liveReview };
    });
    const nextReviews = campaign.reviews.map((r) => {
      const asset = nextAssets.find((a) => a.id === r.assetId);
      return asset?.review && asset.id === assetId ? asset.review : r;
    });
    // Ensure review list stays in sync if asset was missing
    const reviews =
      nextReviews.some((r) => r.assetId === assetId)
        ? nextReviews
        : [
            ...nextReviews,
            nextAssets.find((a) => a.id === assetId)!.review!,
          ];
    setCampaign({
      ...campaign,
      assets: nextAssets,
      reviews,
    });
  };

  const setStatus = (assetId: string, status: ChannelAsset["status"]) => {
    if (!campaign || !insight) return;
    const asset = campaign.assets.find((a) => a.id === assetId);
    if (!asset) return;
    // Always re-score current draft before approve (stale server review is not enough)
    const liveReview = reviewAsset(asset, insight, campaign.brief);
    if (
      (status === "APPROVED" || status === "EXPORTED") &&
      liveReview.recommendation !== "APPROVE"
    ) {
      setError(
        `Quality gate blocked approval: ${liveReview.risks[0] || "revise draft first."}`
      );
      setCampaign({
        ...campaign,
        assets: campaign.assets.map((a) =>
          a.id === assetId ? { ...a, review: liveReview } : a
        ),
        reviews: campaign.reviews.map((r) =>
          r.assetId === assetId ? liveReview : r
        ),
      });
      return;
    }
    setError(null);
    setCampaign({
      ...campaign,
      assets: campaign.assets.map((a) =>
        a.id === assetId
          ? { ...a, status, review: liveReview }
          : a
      ),
      reviews: campaign.reviews.map((r) =>
        r.assetId === assetId ? liveReview : r
      ),
    });
  };

  const exportPackage = (kind: "md" | "json") => {
    if (!campaign || !insight) return;
    const stamp = insight.topic.toLowerCase().replace(/\s+/g, "-").slice(0, 40);
    if (kind === "json") {
      downloadTextFile(
        `content-campaign-${stamp}.json`,
        buildCampaignJson({ insight, campaign, onlyApproved: true }),
        "application/json"
      );
    } else {
      downloadTextFile(
        `content-campaign-${stamp}.md`,
        buildCampaignMarkdown({
          insight,
          brief: campaign.brief,
          assets: campaign.assets,
          reviews: campaign.reviews,
          onlyApproved: true,
        }),
        "text/markdown"
      );
    }
  };

  if (!api.result && !api.isLoading) {
    return (
      <div className="kse-page kse-fade-in">
        <Header />
        <div className="kse-surface p-8 text-center max-w-lg mx-auto mt-8">
          <PenLine
            size={28}
            className="mx-auto mb-3"
            style={{ color: "var(--accent)" }}
          />
          <h2 className="text-base font-semibold mb-2">No signal selected yet</h2>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            Run an analysis from Command or Sources, pick a ranked original, then
            return here to build multi-platform drafts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="kse-page kse-fade-in">
      <Header
        isFallback={api.result?.is_fallback}
        onExportMd={() => exportPackage("md")}
        onExportJson={() => exportPackage("json")}
        canExport={Boolean(campaign && insight)}
      />

      {error && (
        <div
          className="mb-4 px-3 py-2 rounded text-[12px] flex items-start gap-2"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "var(--text)",
          }}
          role="alert"
        >
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,300px)] gap-4 items-start">
        {/* Signal picker */}
        <section className="kse-surface p-3 space-y-2 min-w-0">
          <div className="kse-label" style={{ color: "var(--accent)" }}>
            1 · Source signal
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Ranked X originals from Signal Radar
            {api.result?.is_fallback ? " · simulated sample" : ""}
          </p>
          <div className="space-y-1.5 max-h-[52vh] overflow-y-auto pr-1">
            {originals.map((o) => {
              const active = o.content_id === selectedId;
              return (
                <button
                  key={o.content_id}
                  type="button"
                  onClick={() => {
                    setSelectedId(o.content_id);
                    api.setSelectedNodeId(o.content_id);
                  }}
                  className="w-full text-left rounded px-2.5 py-2 transition-colors"
                  style={{
                    background: active ? "var(--surface)" : "transparent",
                    border: `1px solid ${active ? "var(--accent-border)" : "var(--border)"}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-mono text-[10px] tabular-nums"
                      style={{ color: "var(--accent)" }}
                    >
                      #{o.rank}
                    </span>
                    <span className="text-[11px] font-medium truncate">
                      {o.author.handle}
                    </span>
                  </div>
                  <p
                    className="text-[11px] line-clamp-2 leading-snug"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {o.item.text}
                  </p>
                </button>
              );
            })}
            {!originals.length && (
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                No originals in the current result.
              </p>
            )}
          </div>

          <div className="pt-2 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
            <div className="kse-label">Objective</div>
            <div className="flex flex-wrap gap-1.5">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => setObjective(obj.id)}
                  className="px-2 py-1 rounded text-[11px] font-medium"
                  style={{
                    background:
                      objective === obj.id
                        ? "var(--accent-dim)"
                        : "var(--surface-2)",
                    color:
                      objective === obj.id
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                    border: `1px solid ${
                      objective === obj.id
                        ? "var(--accent-border)"
                        : "var(--border)"
                    }`,
                  }}
                  title={obj.hint}
                >
                  {obj.label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="kse-label">Founder context (optional)</span>
              <textarea
                value={founderContext}
                onChange={(e) => setFounderContext(e.target.value)}
                rows={2}
                placeholder="Product, ICP, offer…"
                className="mt-1 w-full rounded px-2 py-1.5 text-[12px] resize-y"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
            </label>
            <button
              type="button"
              onClick={generate}
              disabled={isGenerating || !selectedOriginal}
              className="w-full flex items-center justify-center gap-2 rounded py-2 text-[12px] font-semibold"
              style={{
                background: "var(--accent)",
                color: "var(--bg)",
                opacity: isGenerating || !selectedOriginal ? 0.55 : 1,
              }}
            >
              {isGenerating ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isGenerating ? "Generating…" : "Generate campaign"}
            </button>
          </div>
        </section>

        {/* Workspace */}
        <section className="space-y-3 min-w-0">
          {!campaign && (
            <div className="kse-surface p-8 text-center">
              <Sparkles
                size={22}
                className="mx-auto mb-2"
                style={{ color: "var(--text-muted)" }}
              />
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                Select a signal and generate a campaign brief + channel drafts.
                Nothing is published automatically.
              </p>
            </div>
          )}

          {campaign && (
            <>
              <div className="kse-surface p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="kse-label" style={{ color: "var(--accent)" }}>
                    2 · Campaign brief
                  </div>
                  {campaign.is_fallback && (
                    <span
                      className="text-[10px] font-mono uppercase px-2 py-0.5 rounded"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Fallback generator
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-semibold leading-snug">
                  {campaign.brief.coreAngle}
                </h2>
                <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  Audience: {campaign.brief.audience}
                </p>
                <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  CTA: {campaign.brief.callToAction}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {campaign.brief.contentPillars.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] px-2 py-0.5 rounded"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {campaign.assets.map((a) => {
                  const rev =
                    a.review ||
                    campaign.reviews.find((r) => r.assetId === a.id);
                  const active = a.id === (activeAsset?.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setActiveAssetId(a.id)}
                      className="px-2.5 py-1.5 rounded text-[11px] font-medium flex items-center gap-1.5"
                      style={{
                        background: active
                          ? "var(--accent-dim)"
                          : "var(--bg-elevated)",
                        border: `1px solid ${
                          active ? "var(--accent-border)" : "var(--border)"
                        }`,
                        color: active ? "var(--accent)" : "var(--text-secondary)",
                      }}
                    >
                      {CHANNEL_LABEL[a.channel]}
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background:
                            rev?.recommendation === "APPROVE"
                              ? "#34d399"
                              : "#fbbf24",
                        }}
                        title={rev?.recommendation}
                      />
                    </button>
                  );
                })}
              </div>

              {activeAsset && (
                <div className="kse-surface p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="kse-label" style={{ color: "var(--accent)" }}>
                        3 · {CHANNEL_LABEL[activeAsset.channel]} draft
                      </div>
                      <div
                        className="text-[11px] font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {activeAsset.format} · {activeAsset.status}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded text-[11px]"
                        style={{
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                        }}
                        onClick={() => setStatus(activeAsset.id, "REVIEWED")}
                      >
                        Mark reviewed
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1"
                        style={{
                          background: "var(--accent-dim)",
                          color: "var(--accent)",
                          border: "1px solid var(--accent-border)",
                        }}
                        onClick={() => setStatus(activeAsset.id, "APPROVED")}
                      >
                        <Check size={12} /> Approve
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={activeAsset.draft}
                    onChange={(e) =>
                      updateDraft(activeAsset.id, e.target.value)
                    }
                    rows={16}
                    className="w-full rounded px-3 py-2 text-[13px] font-mono leading-relaxed resize-y"
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      minHeight: 220,
                    }}
                    aria-label={`${CHANNEL_LABEL[activeAsset.channel]} draft editor`}
                  />
                </div>
              )}
            </>
          )}
        </section>

        {/* Evidence + review */}
        <aside className="kse-surface p-4 space-y-4 min-w-0 sticky top-2">
          <div>
            <div className="kse-label mb-2" style={{ color: "var(--accent)" }}>
              Provenance
            </div>
            {insight ? (
              <div className="space-y-2 text-[12px]">
                <p style={{ color: "var(--text-secondary)" }}>
                  {insight.claim.slice(0, 220)}
                  {insight.claim.length > 220 ? "…" : ""}
                </p>
                {insight.isSimulatedSource && (
                  <p
                    className="text-[11px] font-mono"
                    style={{ color: "#fbbf24" }}
                  >
                    Simulated / fallback Signal Radar origin
                  </p>
                )}
                {insight.sourceUrl && (
                  <a
                    href={insight.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px]"
                    style={{ color: "var(--accent)" }}
                  >
                    Open source <ExternalLink size={11} />
                  </a>
                )}
                <ul className="space-y-1 pt-1">
                  {insight.evidenceLinks.map((e) => (
                    <li key={e.uri}>
                      <a
                        href={e.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] break-all"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {e.title}
                      </a>
                    </li>
                  ))}
                  {!insight.evidenceLinks.length && (
                    <li
                      className="text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No external evidence links on this signal.
                    </li>
                  )}
                </ul>
              </div>
            ) : selectedOriginal ? (
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                Generate a campaign to lock provenance onto drafts.
              </p>
            ) : (
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                Pick a ranked original.
              </p>
            )}
          </div>

          {activeAsset && (
            <div
              className="pt-3 border-t space-y-2"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="kse-label">Quality review</div>
              {(() => {
                const rev =
                  activeAsset.review ||
                  campaign?.reviews.find((r) => r.assetId === activeAsset.id);
                if (!rev) {
                  return (
                    <p
                      className="text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No review attached.
                    </p>
                  );
                }
                const rows: [string, number][] = [
                  ["Evidence", rev.evidenceScore],
                  ["Voice", rev.voiceScore],
                  ["Platform", rev.platformFitScore],
                  ["Clarity", rev.clarityScore],
                ];
                return (
                  <>
                    <div
                      className="text-[11px] font-mono uppercase tracking-wide"
                      style={{
                        color:
                          rev.recommendation === "APPROVE"
                            ? "#34d399"
                            : "#fbbf24",
                      }}
                    >
                      {rev.recommendation === "APPROVE"
                        ? "Gate: can approve"
                        : "Gate: revise first"}
                    </div>
                    {rows.map(([label, v]) => (
                      <div key={label} className="flex items-center gap-2">
                        <span
                          className="w-16 text-[10px] font-mono uppercase"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {label}
                        </span>
                        <div className="kse-score-bar flex-1">
                          <i style={{ width: `${Math.round(v * 100)}%` }} />
                        </div>
                        <span className="text-[11px] font-mono tabular-nums w-8 text-right">
                          {Math.round(v * 100)}
                        </span>
                      </div>
                    ))}
                    {rev.risks.length > 0 && (
                      <ul className="space-y-1 pt-1">
                        {rev.risks.map((r) => (
                          <li
                            key={r}
                            className="text-[11px] leading-snug flex gap-1.5"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <AlertTriangle
                              size={12}
                              className="shrink-0 mt-0.5 text-amber-400"
                            />
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p
                      className="text-[10px] pt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Note: edits re-score the gate live. Re-generate only if
                      you want a new brief and channel set.
                    </p>
                  </>
                );
              })()}
            </div>
          )}

          {campaign && (
            <div
              className="pt-3 border-t space-y-2"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="kse-label">Export approved</div>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Only assets that pass the quality gate and are marked Approved
                are included.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => exportPackage("md")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px]"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <FileText size={12} /> Markdown
                </button>
                <button
                  type="button"
                  onClick={() => exportPackage("json")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px]"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <FileJson size={12} /> JSON
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Header({
  isFallback,
  onExportMd,
  onExportJson,
  canExport,
}: {
  isFallback?: boolean;
  onExportMd?: () => void;
  onExportJson?: () => void;
  canExport?: boolean;
}) {
  return (
    <div className="kse-page-header">
      <div>
        <div className="kse-label mb-1" style={{ color: "var(--accent)" }}>
          Founder Content OS
        </div>
        <h1 className="kse-page-title">Content Studio</h1>
        <p className="kse-page-sub">
          Turn one ranked X original into editable multi-platform drafts. No
          auto-publish.
          {isFallback ? " · Signal data may be simulated." : ""}
        </p>
      </div>
      {canExport && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportMd}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <Download size={12} /> MD
          </button>
          <button
            type="button"
            onClick={onExportJson}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <Download size={12} /> JSON
          </button>
        </div>
      )}
    </div>
  );
}
