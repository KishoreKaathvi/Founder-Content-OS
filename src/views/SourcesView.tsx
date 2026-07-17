import React from "react";
import { FileSearch, PenLine } from "lucide-react";
import type { KseAnalysisApi } from "../hooks/useKseAnalysis";
import SourceCard from "../components/SourceCard";

export default function SourcesView({ api }: { api: KseAnalysisApi }) {
  const list = api.searchedOriginals;
  const selected = api.selectedOriginal;

  if (api.isLoading) {
    return (
      <div className="kse-page kse-fade-in">
        <div className="kse-page-header">
          <div>
            <div className="kse-label mb-1" style={{ color: "var(--accent)" }}>
              Source finder
            </div>
            <h1 className="kse-page-title">Ranked originals</h1>
            <p className="kse-page-sub">
              Querying and ranking original sources...
            </p>
          </div>
          <span className="w-12 h-6 rounded bg-[var(--surface-2)] animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-4 items-start">
          <div className="space-y-3 min-w-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="kse-surface p-4 space-y-3 kse-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-2)]" />
                  <div className="space-y-1">
                    <div className="h-3 w-24 rounded bg-[var(--surface-2)]" />
                    <div className="h-2 w-16 rounded bg-[var(--surface-2)]" />
                  </div>
                </div>
                <div className="h-3.5 w-full rounded bg-[var(--surface-2)]" />
                <div className="h-3.5 w-5/6 rounded bg-[var(--surface-2)]" />
                <div className="flex gap-4 pt-2 border-t border-[var(--border)]">
                  <div className="h-3 w-12 rounded bg-[var(--surface-2)]" />
                  <div className="h-3 w-12 rounded bg-[var(--surface-2)]" />
                  <div className="h-3 w-12 rounded bg-[var(--surface-2)]" />
                </div>
              </div>
            ))}
          </div>

          <aside className="kse-surface p-5 space-y-4 kse-pulse">
            <div>
              <div className="h-2 w-10 rounded bg-[var(--surface-2)] mb-2" />
              <div className="h-4 w-32 rounded bg-[var(--surface-2)] mb-1" />
              <div className="h-3 w-20 rounded bg-[var(--surface-2)]" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-[var(--surface-2)]" />
              <div className="h-3 w-full rounded bg-[var(--surface-2)]" />
              <div className="h-3 w-3/4 rounded bg-[var(--surface-2)]" />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-16 rounded bg-[var(--surface-2)] mb-2" />
              <div className="h-3 w-full rounded bg-[var(--surface-2)]" />
            </div>
            <div className="space-y-3">
              <div className="h-2 w-16 rounded bg-[var(--surface-2)]" />
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-16 h-2 rounded bg-[var(--surface-2)]" />
                  <div className="flex-1 h-2 rounded bg-[var(--surface-2)]" />
                  <div className="w-8 h-2 rounded bg-[var(--surface-2)]" />
                </div>
              ))}
            </div>
            <div className="h-9 rounded bg-[var(--surface-2)] w-full" />
          </aside>
        </div>
      </div>
    );
  }

  if (!api.overriddenResult) {
    return (
      <div className="kse-page">
        <div className="kse-empty kse-surface">
          <FileSearch size={28} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm m-0">Run an analysis from Overview first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kse-page kse-fade-in">
      <div className="kse-page-header">
        <div>
          <div className="kse-label mb-1" style={{ color: "var(--accent)" }}>
            Source finder
          </div>
          <h1 className="kse-page-title">Ranked originals</h1>
          <p className="kse-page-sub">
            {api.topic}
            {api.searchQuery ? ` · “${api.searchQuery}”` : ""} · presentation_score
            order
          </p>
        </div>
        <span className="kse-badge kse-badge-accent">
          {list.length}/{api.overriddenResult.originals.length}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-4 items-start">
        <div className="space-y-3 min-w-0">
          {list.length === 0 ? (
            <div className="kse-empty kse-surface">
              <p className="text-sm m-0">No sources match this filter.</p>
            </div>
          ) : (
            list.map((o) => (
              <SourceCard
                key={o.content_id}
                original={o}
                isSelected={api.selectedNodeId === o.content_id}
                onSelect={() => api.setSelectedNodeId(o.content_id)}
                activeFlag={api.flags[o.content_id] ?? null}
                onFlagChange={api.setFlag}
                dense
              />
            ))
          )}
        </div>

        <aside
          className="kse-surface p-5 lg:sticky lg:top-4"
          style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
        >
          {selected ? (
            <div className="space-y-4">
              <div>
                <div className="kse-label mb-1">Focus</div>
                <h2 className="text-[15px] font-semibold m-0">
                  #{selected.rank} {selected.author.name}
                </h2>
                <div
                  className="text-[12px] font-mono mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {selected.author.handle}
                </div>
              </div>
              <p
                className="text-[13px] leading-relaxed m-0"
                style={{ color: "var(--text-secondary)" }}
              >
                {selected.item.text}
              </p>
              <div>
                <div className="kse-label mb-1">Why it matters</div>
                <p
                  className="text-[13px] m-0 leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {selected.why_it_matters || "—"}
                </p>
              </div>
              <div>
                <div className="kse-label mb-1">Relevance</div>
                <p
                  className="text-[13px] m-0 leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {selected.current_relevance || "—"}
                </p>
              </div>
              <div className="space-y-2">
                <div className="kse-label">Score vector</div>
                {(
                  [
                    ["Originality", selected.scores.originality],
                    ["Authority", selected.scores.authority],
                    ["Influence", selected.scores.influence],
                    ["Evidence", selected.scores.evidence],
                    ["Freshness", selected.scores.freshness],
                  ] as const
                ).map(([label, v]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span
                      className="w-20 text-[11px] font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {label}
                    </span>
                    <div className="kse-score-bar flex-1">
                      <i style={{ width: `${Math.round(v * 100)}%` }} />
                    </div>
                    <span className="text-[11px] font-mono w-8 text-right">
                      {Math.round(v * 100)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="kse-btn w-full flex items-center justify-center gap-2"
                  style={{
                    background: "var(--accent-dim)",
                    color: "var(--accent)",
                    border: "1px solid var(--accent-border)",
                  }}
                  onClick={() => {
                    api.setSelectedNodeId(selected.content_id);
                    api.setActiveView("content");
                  }}
                >
                  <PenLine size={14} />
                  Create content in Studio
                </button>
                <button
                  type="button"
                  className="kse-btn w-full"
                  onClick={() => api.setActiveView("graph")}
                >
                  Highlight on graph
                </button>
              </div>
            </div>
          ) : (
            <div className="kse-empty">
              <p className="text-sm m-0">Select a source to inspect.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
