/**
 * Collapsible intelligence shell — nav rail + command topbar.
 */
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  GitBranch,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Bell,
  FileSearch,
  Share2,
  Download,
  FileText,
  Search,
  Check,
  RefreshCw,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  Sun,
  Moon,
  Monitor,
  Home,
} from "lucide-react";
import type { AppView, KseAnalysisApi } from "../hooks/useKseAnalysis";
import Tooltip from "../components/Tooltip";

const NAV: {
  id: AppView;
  label: string;
  icon: React.ElementType;
  hint: string;
  group: string;
}[] = [
  { id: "overview", label: "Command", icon: LayoutDashboard, hint: "Ops overview", group: "Analyze" },
  { id: "sources", label: "Sources", icon: FileSearch, hint: "Ranked originals", group: "Analyze" },
  { id: "graph", label: "Cascade", icon: GitBranch, hint: "Relationship graph", group: "Analyze" },
  { id: "noise", label: "Noise", icon: ShieldAlert, hint: "Spam quarantine", group: "Analyze" },
  { id: "verify", label: "Verify", icon: Shield, hint: "Grounding", group: "Quality" },
  { id: "tuning", label: "Weights", icon: SlidersHorizontal, hint: "Scoring knobs", group: "Quality" },
  { id: "alerts", label: "Watchlist", icon: Bell, hint: "Topic alerts", group: "Ops" },
];

export default function AppShell({
  api,
  children,
  onExitPortal,
}: {
  api: KseAnalysisApi;
  children: React.ReactNode;
  onExitPortal?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("kse-nav-collapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("kse-nav-collapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const alertCount = api.alerts.filter((a) => a.hasNewNotification).length;
  const width = collapsed ? "var(--nav-w-collapsed)" : "var(--nav-w)";

  const groups = ["Analyze", "Quality", "Ops"];

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <aside
        className="kse-nav flex flex-col shrink-0 border-r"
        style={{
          width,
          background: "var(--bg-elevated)",
          borderColor: "var(--border)",
        }}
        aria-label="Primary"
        data-collapsed={collapsed || undefined}
      >
        <div
          className="flex items-center border-b shrink-0"
          style={{
            borderColor: "var(--border)",
            height: "var(--topbar-h)",
            padding: collapsed ? "0 10px" : "0 12px",
            justifyContent: collapsed ? "center" : "space-between",
            gap: 8,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              className="w-8 h-8 shrink-0 rounded flex items-center justify-center font-mono font-bold text-xs relative cursor-pointer"
              style={{
                background: "linear-gradient(145deg, var(--accent-dim), transparent)",
                color: "var(--accent)",
                border: "1px solid var(--accent-border)",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
              onClick={onExitPortal}
              title={onExitPortal ? "Back to landing" : "KSE"}
              aria-label={onExitPortal ? "Back to landing page" : "Knowledge Signal Engine"}
            >
              KSE
            </button>
            {!collapsed && (
              <button
                type="button"
                className="kse-nav-label min-w-0 text-left cursor-pointer bg-transparent border-0 p-0"
                onClick={onExitPortal}
                title={onExitPortal ? "Back to landing" : undefined}
              >
                <div className="text-[12px] font-semibold tracking-tight leading-tight">
                  Knowledge Signal
                </div>
                <div
                  className="text-[9px] font-mono uppercase tracking-[0.12em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Provenance OS
                </div>
              </button>
            )}
          </div>
          {!collapsed && (
            <Tooltip content="Collapse sidebar (⌘B)">
              <button
                type="button"
                className="kse-btn kse-btn-ghost kse-btn-icon"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={15} />
              </button>
            </Tooltip>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center py-2 border-b" style={{ borderColor: "var(--border)" }}>
            <Tooltip content="Expand sidebar (⌘B)">
              <button
                type="button"
                className="kse-btn kse-btn-ghost kse-btn-icon"
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen size={15} />
              </button>
            </Tooltip>
          </div>
        )}

        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden" aria-label="Views">
          {groups.map((group) => {
            const items = NAV.filter((n) => n.group === group);
            return (
              <div key={group} className="mb-2">
                {!collapsed && (
                  <div
                    className="px-4 pt-2 pb-1 text-[9px] font-mono uppercase tracking-[0.14em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {group}
                  </div>
                )}
                <div className={collapsed ? "px-1.5 space-y-0.5" : "px-2 space-y-0.5"}>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = api.activeView === item.id;
                    const badge =
                      item.id === "alerts" && alertCount > 0
                        ? alertCount
                        : item.id === "noise"
                          ? api.overriddenResult?.noise_candidates?.length || 0
                          : item.id === "sources"
                            ? api.searchedOriginals?.length || 0
                            : 0;

                    return (
                      <div key={item.id} className="relative">
                        <button
                          type="button"
                          onClick={() => api.setActiveView(item.id)}
                          className="w-full flex items-center rounded text-left cursor-pointer relative"
                          style={{
                            gap: collapsed ? 0 : 10,
                            justifyContent: collapsed ? "center" : "flex-start",
                            padding: collapsed ? "10px 0" : "8px 10px",
                            background: active
                              ? "linear-gradient(90deg, var(--accent-dim), transparent)"
                              : "transparent",
                            color: active ? "var(--accent)" : "var(--text-secondary)",
                            borderLeft: active
                              ? "2px solid var(--accent)"
                              : "2px solid transparent",
                            boxShadow: active ? "inset 0 0 24px var(--accent-dim)" : undefined,
                          }}
                          aria-current={active ? "page" : undefined}
                          title={`${item.label} — ${item.hint}`}
                        >
                          <Icon size={16} strokeWidth={1.75} className="shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="kse-nav-label text-[13px] font-medium flex-1">
                                {item.label}
                              </span>
                              {badge > 0 && (
                                <span
                                  className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded"
                                  style={{
                                    background: "var(--surface-2)",
                                    color: "var(--text-muted)",
                                    border: "1px solid var(--border)",
                                  }}
                                >
                                  {badge}
                                </span>
                              )}
                            </>
                          )}
                          {collapsed && badge > 0 && (
                            <span
                              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                              style={{
                                background: "var(--accent)",
                                boxShadow: "0 0 6px var(--accent)",
                              }}
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div
          className="border-t shrink-0"
          style={{
            borderColor: "var(--border)",
            padding: collapsed ? "10px 6px" : "10px 12px",
          }}
        >
          <div
            className="flex items-center rounded px-2 py-1.5"
            style={{
              gap: 8,
              justifyContent: collapsed ? "center" : "flex-start",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <Radio
              size={11}
              style={{ color: api.isLoading ? "var(--warning)" : "var(--accent)" }}
              className={api.isLoading ? "kse-pulse shrink-0" : "shrink-0"}
            />
            {!collapsed && (
              <div className="min-w-0">
                <div
                  className="text-[10px] font-mono uppercase tracking-wider truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {api.isLoading ? "Pipeline active" : "Engine online"}
                </div>
                {api.result?.is_fallback && (
                  <div
                    className="text-[9px] font-mono truncate"
                    style={{ color: "var(--warning)" }}
                  >
                    FALLBACK MODE
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header
          className="shrink-0 flex items-center gap-2.5 px-3 border-b"
          style={{
            height: "var(--topbar-h)",
            background: "linear-gradient(180deg, var(--bg-elevated), var(--bg))",
            borderColor: "var(--border)",
          }}
        >
          {onExitPortal && (
            <Tooltip content="Back to landing page">
              <button
                type="button"
                className="kse-btn kse-btn-ghost flex items-center gap-1.5 px-2 py-1 shrink-0 text-[10px] font-mono uppercase tracking-wider"
                onClick={onExitPortal}
                aria-label="Back to landing page"
              >
                <Home size={13} />
                <span className="hidden sm:inline">Landing</span>
              </button>
            </Tooltip>
          )}

          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded border shrink-0"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
              color: "var(--text-muted)",
            }}
          >
            <Command size={11} />
            <span className="text-[10px] font-mono">KSE</span>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              id="header-search-input"
              className="kse-input"
              style={{ paddingLeft: 30, height: 32, fontFamily: "var(--font-mono)", fontSize: 12 }}
              placeholder="Filter claims…"
              value={api.searchQuery}
              onChange={(e) => api.setSearchQuery(e.target.value)}
              aria-label="Filter claims"
            />
          </div>

          {api.result && (
            <div
              className="hidden xl:flex items-center gap-2 text-[10px] font-mono shrink-0 px-2 py-1 rounded border"
              style={{
                color: "var(--text-muted)",
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
            >
              <span style={{ color: "var(--accent)" }}>TOPIC</span>
              <span style={{ color: "var(--text-secondary)" }}>{api.topic}</span>
              <span style={{ opacity: 0.3 }}>│</span>
              <span>
                N=<strong style={{ color: "var(--text)" }}>{api.result.run_meta.after_dedup}</strong>
              </span>
              <span>
                C=
                <strong style={{ color: "var(--text)" }}>
                  {api.result.run_meta.components}
                </strong>
              </span>
              <span>
                E=
                <strong style={{ color: "var(--text)" }}>
                  {api.result.edges?.length ?? 0}
                </strong>
              </span>
            </div>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-1 shrink-0">
            {api.overriddenResult && (
              <>
                <Tooltip content="Share deep link">
                  <button type="button" className="kse-btn kse-btn-icon" onClick={api.handleShareAnalysis}>
                    {api.copiedShareLink ? (
                      <Check size={13} style={{ color: "var(--accent)" }} />
                    ) : (
                      <Share2 size={13} />
                    )}
                  </button>
                </Tooltip>
                <Tooltip content="Export PDF">
                  <button
                    type="button"
                    className="kse-btn kse-btn-icon"
                    onClick={api.handleExportPDF}
                    disabled={api.isExportingPDF}
                  >
                    {api.isExportingPDF ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <FileText size={13} />
                    )}
                  </button>
                </Tooltip>
                <Tooltip content="Export TXT">
                  <button type="button" className="kse-btn kse-btn-icon" onClick={api.handleExportTXT}>
                    <Download size={13} />
                  </button>
                </Tooltip>
                <Tooltip content="Export JSON">
                  <button type="button" className="kse-btn kse-btn-icon" onClick={api.handleExportJSON}>
                    <FileSearch size={13} />
                  </button>
                </Tooltip>
              </>
            )}

            {/* Light / Dark / System */}
            <div
              className="flex items-center p-0.5 rounded border ml-1"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              role="group"
              aria-label="Theme"
            >
              {(
                [
                  { key: "light" as const, icon: Sun, label: "Light" },
                  { key: "dark" as const, icon: Moon, label: "Dark" },
                  { key: "system" as const, icon: Monitor, label: "System" },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const on = api.theme === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    className="p-1.5 rounded cursor-pointer"
                    style={{
                      background: on ? "var(--accent)" : "transparent",
                      color: on ? "var(--primary-content)" : "var(--text-muted)",
                    }}
                    onClick={() => api.setTheme(t.key)}
                    aria-label={t.label}
                    title={t.label}
                  >
                    <Icon size={11} />
                  </button>
                );
              })}
            </div>

            <div
              className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-muted)",
                background: "var(--surface)",
              }}
            >
              <span style={{ color: "var(--accent)" }}>UTC</span>
              {api.utcTime.replace(" GMT", "").replace(/^\w+, /, "")}
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
