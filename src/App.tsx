/**
 * Landing (default) → Enterprise portal (no auth).
 * Route: hash `#portal` = lab. Anything else (incl. bare `/`) = landing.
 */
import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useKseAnalysis } from "./hooks/useKseAnalysis";
import AppShell from "./layout/AppShell";
import LandingPage from "./landing/LandingPage";
import OverviewView from "./views/OverviewView";
import SourcesView from "./views/SourcesView";
import GraphView from "./views/GraphView";
import NoiseView from "./views/NoiseView";
import VerifyView from "./views/VerifyView";
import TuningView from "./views/TuningView";
import AlertsView from "./views/AlertsView";

function isPortalRoute(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash === "#portal";
}

function PortalApp({ onExitPortal }: { onExitPortal: () => void }) {
  const api = useKseAnalysis();

  return (
    <AppShell api={api} onExitPortal={onExitPortal}>
      {api.isLoading && api.activeView !== "overview" && api.activeView !== "sources" && (
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
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
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

export default function App() {
  const [inPortal, setInPortal] = useState(() => isPortalRoute());

  const enterPortal = useCallback(() => {
    // Drop legacy sticky flag from older builds
    try {
      sessionStorage.removeItem("kse-in-portal");
    } catch {
      /* ignore */
    }
    if (window.location.hash !== "#portal") {
      window.location.hash = "portal";
    } else {
      setInPortal(true);
    }
  }, []);

  const exitPortal = useCallback(() => {
    try {
      sessionStorage.removeItem("kse-in-portal");
    } catch {
      /* ignore */
    }
    setInPortal(false);
    // Clear hash so refresh/bookmarks land on marketing page
    if (window.location.hash) {
      const { pathname, search } = window.location;
      window.history.pushState(null, "", pathname + search);
    }
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const next = isPortalRoute();
      setInPortal(next);
      if (!next) {
        try {
          sessionStorage.removeItem("kse-in-portal");
        } catch {
          /* ignore */
        }
      }
    };

    window.addEventListener("hashchange", syncFromUrl);
    window.addEventListener("popstate", syncFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncFromUrl);
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  // Landing only mounts portal analysis after enter (avoids auto-run on marketing page)
  if (!inPortal) {
    return <LandingPage onEnter={enterPortal} />;
  }

  return <PortalApp onExitPortal={exitPortal} />;
}
