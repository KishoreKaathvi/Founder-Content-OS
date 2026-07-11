/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ProvenanceWeights, 
  PresentationWeights,
  AlertTopic
} from "../types";
import { 
  Search, 
  Sliders, 
  RefreshCw, 
  HelpCircle, 
  Sparkles, 
  FileText,
  Clock,
  Bell,
  Trash2,
  Plus,
  Activity
} from "lucide-react";

interface SidebarProps {
  onRunAnalysis: (topic: string) => void;
  onRecalculate: (pWeights: ProvenanceWeights, presWeights: PresentationWeights) => void;
  isLoading: boolean;
  currentTopic: string;
  provenanceWeights: ProvenanceWeights;
  presentationWeights: PresentationWeights;
  
  // Cascade Time Window bounds
  dateRange: [number, number] | null;
  onDateRangeChange: (range: [number, number]) => void;
  fullTimeBounds: [number, number] | null;

  // Alerts integration
  alerts: AlertTopic[];
  onAddAlert: (topic: string) => void;
  onRemoveAlert: (id: string) => void;
  onClearAlertNotification: (id: string) => void;
  onSimulateMatch: () => void;
}

const PRE_SEEDED_TOPICS = [
  "AI Coding Assistants",
  "LLM Agent Cascades",
  "Quantum Supremacy Disclosure",
  "Stable Diffusion v3 Leaks",
];

export default function Sidebar({
  onRunAnalysis,
  onRecalculate,
  isLoading,
  currentTopic,
  provenanceWeights,
  presentationWeights,
  dateRange,
  onDateRangeChange,
  fullTimeBounds,
  alerts,
  onAddAlert,
  onRemoveAlert,
  onClearAlertNotification,
  onSimulateMatch,
}: SidebarProps) {
  const [topicInput, setTopicInput] = useState("");
  const [pWeights, setPWeights] = useState<ProvenanceWeights>(provenanceWeights);
  const [presWeights, setPresWeights] = useState<PresentationWeights>(presentationWeights);
  const [activeTab, setActiveTab] = useState<"search" | "tuning" | "alerts">("search");

  React.useEffect(() => {
    setPWeights(provenanceWeights);
  }, [
    provenanceWeights.w_time,
    provenanceWeights.w_auth,
    provenanceWeights.w_infl,
    provenanceWeights.w_deriv
  ]);

  React.useEffect(() => {
    setPresWeights(presentationWeights);
  }, [
    presentationWeights.alpha,
    presentationWeights.beta,
    presentationWeights.gamma,
    presentationWeights.delta,
    presentationWeights.epsilon,
    presentationWeights.zeta
  ]);

  const hasNotifications = alerts.some((a) => a.hasNewNotification);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || isLoading) return;
    onRunAnalysis(topicInput.trim());
  };

  const handleResetWeights = () => {
    const defaultP: ProvenanceWeights = {
      w_time: 0.45,
      w_auth: 0.25,
      w_infl: 0.20,
      w_deriv: 0.35,
    };
    const defaultPres: PresentationWeights = {
      alpha: 0.35,
      beta: 0.20,
      gamma: 0.25,
      delta: 0.15,
      epsilon: 0.05,
      zeta: 0.0,
    };
    setPWeights(defaultP);
    setPresWeights(defaultPres);
    onRecalculate(defaultP, defaultPres);
  };

  const handleWeightChange = (
    category: "provenance" | "presentation",
    field: string,
    value: number
  ) => {
    if (category === "provenance") {
      const updated = { ...pWeights, [field]: value };
      setPWeights(updated);
      onRecalculate(updated, presWeights);
    } else {
      const updated = { ...presWeights, [field]: value };
      setPresWeights(updated);
      onRecalculate(pWeights, updated);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-900 w-80 shrink-0 text-slate-100 font-sans select-none overflow-hidden">
      {/* Platform Title */}
      <div className="p-4 border-b border-slate-900 bg-slate-950 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center font-mono font-bold text-slate-950 text-sm">
            K
          </div>
          <h1 className="text-md font-bold tracking-tight text-slate-100 font-sans">
            Knowledge Signal Engine
          </h1>
        </div>
        <div className="text-[10px] font-mono text-slate-500 tracking-wider">
          SOCIAL INFORMATION PROVENANCE
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900 bg-slate-950 text-xs font-mono">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 py-2.5 text-center border-b-2 font-medium transition ${
            activeTab === "search"
              ? "border-emerald-500 text-emerald-400 bg-slate-900/30"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <Search size={11} />
            <span>ingestion</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("tuning")}
          className={`flex-1 py-2.5 text-center border-b-2 font-medium transition ${
            activeTab === "tuning"
              ? "border-emerald-500 text-emerald-400 bg-slate-900/30"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <Sliders size={11} />
            <span>tuning</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex-1 py-2.5 text-center border-b-2 font-medium transition relative ${
            activeTab === "alerts"
              ? "border-emerald-500 text-emerald-400 bg-slate-900/30"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <Bell size={11} className={hasNotifications ? "text-emerald-400 animate-bounce" : ""} />
            <span>alerts</span>
            {hasNotifications && (
              <span className="absolute top-2 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {activeTab === "search" ? (
          <>
            {/* Topic Search Box */}
            <form onSubmit={handleSubmitSearch} className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Ingest New Topic / Keyword
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. AI Coding, LLM Leaks..."
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 pl-9 text-xs focus:outline-none focus:border-emerald-500 text-slate-100 font-sans transition placeholder:text-slate-600"
                />
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              </div>
              <button
                type="submit"
                disabled={isLoading || !topicInput.trim()}
                className="w-full py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold font-sans text-xs hover:bg-emerald-400 disabled:opacity-40 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Collecting & Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Run Provenance Analysis</span>
                  </>
                )}
              </button>
            </form>

            {/* CURATED TRENDING TOPICS */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-900">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                Trending Pilot Signals
              </div>
              <div className="flex flex-col gap-1.5">
                {PRE_SEEDED_TOPICS.map((topic) => {
                  const isCurrent = currentTopic.toLowerCase() === topic.toLowerCase();
                  return (
                    <button
                      key={topic}
                      disabled={isLoading}
                      onClick={() => onRunAnalysis(topic)}
                      className={`text-left p-2.5 rounded-lg border text-xs font-sans transition cursor-pointer ${
                        isCurrent
                          ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                          : "bg-slate-900/50 border-slate-800 hover:bg-slate-800/80 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold line-clamp-1">{topic}</span>
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DATE-RANGE FILTER PANEL */}
            {fullTimeBounds && dateRange && (
              <div className="flex flex-col gap-3 pt-3 border-t border-slate-900">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <Clock size={12} className="text-emerald-400" />
                  <span>Cascade Time Window</span>
                </div>

                <div className="flex flex-col gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-900">
                  {/* Start time control */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 leading-none">
                      <span>Start:</span>
                      <span className="text-emerald-400 font-bold">
                        {new Date(dateRange[0]).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                        {new Date(dateRange[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} UTC
                      </span>
                    </div>
                    <input
                      type="range"
                      min={fullTimeBounds[0]}
                      max={Math.max(fullTimeBounds[0], dateRange[1] - 1000)}
                      step={1000}
                      value={dateRange[0]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onDateRangeChange([val, dateRange[1]]);
                      }}
                      className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-1 rounded"
                    />
                  </div>

                  {/* End time control */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 leading-none">
                      <span>End:</span>
                      <span className="text-emerald-400 font-bold">
                        {new Date(dateRange[1]).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                        {new Date(dateRange[1]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} UTC
                      </span>
                    </div>
                    <input
                      type="range"
                      min={Math.min(fullTimeBounds[1], dateRange[0] + 1000)}
                      max={fullTimeBounds[1]}
                      step={1000}
                      value={dateRange[1]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onDateRangeChange([dateRange[0], val]);
                      }}
                      className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-1 rounded"
                    />
                  </div>

                  {/* Quick reset button */}
                  <button
                    onClick={() => onDateRangeChange([fullTimeBounds[0], fullTimeBounds[1]])}
                    className="text-[9px] font-mono text-slate-500 hover:text-slate-300 underline text-right cursor-pointer"
                  >
                    Reset Full Horizon
                  </button>
                </div>
              </div>
            )}

            {/* ARCHITECTURAL HONESTY CORNER */}
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 mt-auto text-[11px] text-slate-400 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <FileText size={12} className="text-emerald-500" />
                <span>KSE Architecture Note</span>
              </div>
              <p className="leading-relaxed font-sans text-[10.5px]">
                This pilot runs on official-tier simulation APIs. Provenance is computed in the browser & backend over chronological cascade graphs containing replies, image duplicates, and URL citation matches.
              </p>
            </div>
          </>
        ) : activeTab === "tuning" ? (
          <>
            {/* WEIGHT TUNING PANEL */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Provenance Weights
                </span>
                <button
                  onClick={handleResetWeights}
                  className="text-[10px] font-mono text-slate-500 hover:text-emerald-400 cursor-pointer"
                >
                  reset-defaults
                </button>
              </div>

              {/* Provenance Sliders */}
              <div className="flex flex-col gap-3.5 p-3 rounded-xl bg-slate-900/30 border border-slate-900">
                {/* w_time */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">w_time (Chronology)</span>
                    <span className="text-emerald-400 font-bold">{pWeights.w_time.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={pWeights.w_time}
                    onChange={(e) => handleWeightChange("provenance", "w_time", parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-1 rounded"
                  />
                  <div className="text-[9px] text-slate-500 font-sans">
                    Favors older posts within each connected component.
                  </div>
                </div>

                {/* w_auth */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">w_auth (Authority)</span>
                    <span className="text-emerald-400 font-bold">{pWeights.w_auth.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={pWeights.w_auth}
                    onChange={(e) => handleWeightChange("provenance", "w_auth", parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-1 rounded"
                  />
                  <div className="text-[9px] text-slate-500 font-sans">
                    Weights author follower density and verified credentials.
                  </div>
                </div>

                {/* w_infl */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">w_infl (Influence)</span>
                    <span className="text-emerald-400 font-bold">{pWeights.w_infl.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={pWeights.w_infl}
                    onChange={(e) => handleWeightChange("provenance", "w_infl", parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-1 rounded"
                  />
                  <div className="text-[9px] text-slate-500 font-sans">
                    Measures size of downstream quote and reply descendants.
                  </div>
                </div>

                {/* w_deriv */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">w_deriv (Penalty)</span>
                    <span className="text-emerald-400 font-bold">{pWeights.w_deriv.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={pWeights.w_deriv}
                    onChange={(e) => handleWeightChange("provenance", "w_deriv", parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-1 rounded"
                  />
                  <div className="text-[9px] text-slate-500 font-sans">
                    Penalizes replies, screenshots, and paraphrase rewrites.
                  </div>
                </div>
              </div>

              {/* DISPLAY SORT WEIGHTS */}
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-900">
                Presentation Weights (Sorting)
              </div>

              <div className="flex flex-col gap-3.5 p-3 rounded-xl bg-slate-900/30 border border-slate-900">
                {/* alpha */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">α (Originality)</span>
                    <span className="text-emerald-400 font-bold">{presWeights.alpha.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={presWeights.alpha}
                    onChange={(e) => handleWeightChange("presentation", "alpha", parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-1 rounded"
                  />
                </div>

                {/* beta */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">β (Authority)</span>
                    <span className="text-emerald-400 font-bold">{presWeights.beta.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={presWeights.beta}
                    onChange={(e) => handleWeightChange("presentation", "beta", parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-1 rounded"
                  />
                </div>

                {/* gamma */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">γ (Influence)</span>
                    <span className="text-emerald-400 font-bold">{presWeights.gamma.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={presWeights.gamma}
                    onChange={(e) => handleWeightChange("presentation", "gamma", parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-1 rounded"
                  />
                </div>

                {/* delta */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">δ (Evidence)</span>
                    <span className="text-emerald-400 font-bold">{presWeights.delta.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={presWeights.delta}
                    onChange={(e) => handleWeightChange("presentation", "delta", parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-1 rounded"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ALERTS MONITORING PANEL */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Saved Topic Alerts
                </span>
                <button
                  onClick={onSimulateMatch}
                  className="text-[10px] font-mono text-slate-500 hover:text-emerald-400 transition cursor-pointer flex items-center gap-1 bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded"
                  title="Simulate random matches to test alert notifications and visual pulses"
                >
                  <Activity size={10} className="text-emerald-500" />
                  <span>simulate-stream</span>
                </button>
              </div>

              {/* Add Alert Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem("alertTopic") as HTMLInputElement;
                  if (input && input.value.trim()) {
                    onAddAlert(input.value.trim());
                    input.value = "";
                  }
                }}
                className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/30 border border-slate-900"
              >
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                  Track New Keyword/Topic
                </label>
                <div className="flex gap-2">
                  <input
                    name="alertTopic"
                    type="text"
                    required
                    placeholder="e.g. CUDA acceleration..."
                    className="flex-1 bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500 text-slate-100 font-sans"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer animate-pulse-slow"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </form>

              {/* Quick Add Current Topic Alert if not already present */}
              {currentTopic && !alerts.some(a => a.topic.toLowerCase() === currentTopic.toLowerCase()) && (
                <button
                  onClick={() => onAddAlert(currentTopic)}
                  className="w-full py-1.5 rounded-lg border border-dashed border-slate-800 hover:border-emerald-500/30 text-[11px] font-mono text-slate-500 hover:text-emerald-400 transition cursor-pointer text-center"
                >
                  + Track active: "{currentTopic}"
                </button>
              )}

              {/* List of Alerts */}
              <div className="flex flex-col gap-2">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs font-sans px-4">
                    No active alerts. Add topics above to track and receive notification pulses on high-signal disclosures.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex flex-col gap-2 p-3 rounded-xl border transition ${
                        alert.hasNewNotification
                          ? "bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-500/20 animate-pulse"
                          : "bg-slate-900/40 border-slate-900 hover:border-slate-850"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-200 truncate">{alert.topic}</span>
                          <span className="text-[9px] font-mono text-slate-500 mt-0.5">Tracked: {alert.savedAt}</span>
                        </div>
                        <button
                          onClick={() => onRemoveAlert(alert.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900/80 transition cursor-pointer"
                          title="Delete Alert"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {alert.hasNewNotification && (
                        <div className="flex items-center justify-between bg-emerald-950/50 border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-emerald-400">
                          <span className="flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            {alert.matchCount > 0 ? `${alert.matchCount} Signals Found!` : "New Signal Match!"}
                          </span>
                          <button
                            onClick={() => onClearAlertNotification(alert.id)}
                            className="underline hover:text-emerald-200 cursor-pointer font-bold"
                          >
                            Acknowledge
                          </button>
                        </div>
                      )}

                      <div className="flex gap-1.5 mt-1">
                        <button
                          onClick={() => onRunAnalysis(alert.topic)}
                          disabled={isLoading}
                          className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-850 text-[10px] font-mono text-slate-300 hover:text-emerald-400 transition border border-slate-800/40 cursor-pointer text-center"
                        >
                          Run Analysis
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
