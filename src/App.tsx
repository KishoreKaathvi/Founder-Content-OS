/**
 * Knowledge Signal Engine — multi-view enterprise shell.
 * One concern per view; no single-page dump.
 */
import React from "react";
import { RefreshCw } from "lucide-react";
import { useKseAnalysis } from "./hooks/useKseAnalysis";
import AppShell from "./layout/AppShell";
import OverviewView from "./views/OverviewView";
import SourcesView from "./views/SourcesView";
import GraphView from "./views/GraphView";
import NoiseView from "./views/NoiseView";
import VerifyView from "./views/VerifyView";
import TuningView from "./views/TuningView";
import AlertsView from "./views/AlertsView";

export default function App() {
  const api = useKseAnalysis();

  return (
    <AppShell api={api}>
      {api.isLoading && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center"
          style={{
            background: "rgba(5, 7, 11, 0.72)",
            backdropFilter: "blur(6px)",
          }}
          role="status"
          aria-live="polite"
        >
          <div className="kse-surface px-8 py-6 flex flex-col items-center gap-3">
            <RefreshCw
              size={22}
              className="animate-spin"
              style={{ color: "var(--accent)" }}
            />
            <div className="text-[12px] font-mono uppercase tracking-wider">
              Pipeline running
            </div>
            <div
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              Collect → filter → graph → rank → report
            </div>
          </div>
        </div>
      )}

      {api.activeView === "overview" && <OverviewView api={api} />}
      {api.activeView === "sources" && <SourcesView api={api} />}
      {api.activeView === "graph" && <GraphView api={api} />}
      {api.activeView === "noise" && <NoiseView api={api} />}
      {api.activeView === "verify" && <VerifyView api={api} />}
      {api.activeView === "tuning" && <TuningView api={api} />}
      {api.activeView === "alerts" && <AlertsView api={api} />}
    </AppShell>
  );
}
