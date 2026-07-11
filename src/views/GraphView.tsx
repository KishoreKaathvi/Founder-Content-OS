import React, { useMemo } from "react";
import { GitBranch } from "lucide-react";
import type { KseAnalysisApi } from "../hooks/useKseAnalysis";
import RelationshipGraph from "../components/RelationshipGraph";
import { EdgeMixDonut } from "../components/viz/DashCharts";

export default function GraphView({ api }: { api: KseAnalysisApi }) {
  const res = api.overriddenResult;

  const edgeSlices = useMemo(() => {
    if (!res) return [];
    const map: Record<string, number> = {};
    res.edges.forEach((e) => {
      map[e.kind] = (map[e.kind] || 0) + 1;
    });
    const colors: Record<string, string> = {
      quote: "#3dffa8",
      reply: "#4ecbff",
      same_url: "#a78bfa",
      same_image_hash: "#ffc857",
      semantic_sim: "#ff6b7a",
    };
    return Object.entries(map).map(([label, value]) => ({
      label,
      value,
      color: colors[label] || "#94a3b8",
    }));
  }, [res]);

  if (!res) {
    return (
      <div className="kse-page">
        <div className="kse-empty kse-surface">
          <GitBranch size={28} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm m-0">
            Execute an analysis to build the cascade graph.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="kse-page kse-fade-in">
      <div className="kse-page-header flex-wrap">
        <div>
          <div className="kse-label mb-1" style={{ color: "var(--accent)" }}>
            Graph intelligence
          </div>
          <h1 className="kse-page-title">Cascade topology</h1>
          <p className="kse-page-sub">
            {res.raw_items.length} nodes · {res.edges.length} edges · force layout
            · pan / zoom / drag
          </p>
        </div>
        <div className="kse-surface px-3 py-2 hidden md:block" style={{ minWidth: 200 }}>
          <EdgeMixDonut slices={edgeSlices} size={72} />
        </div>
      </div>

      <div
        id="kse-graph-export-root"
        className="kse-surface"
        style={{ height: "min(70vh, 640px)", minHeight: 360 }}
      >
        <RelationshipGraph
          items={res.raw_items}
          edges={res.edges}
          authors={res.authors}
          originalIds={res.originals.map((o) => o.content_id)}
          selectedNodeId={api.selectedNodeId}
          onSelectNode={(id) => api.setSelectedNodeId(id)}
          searchQuery={api.searchQuery}
        />
      </div>
    </div>
  );
}
