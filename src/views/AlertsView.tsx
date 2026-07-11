import React, { useState } from "react";
import { Bell, Plus, Trash2, Activity } from "lucide-react";
import type { KseAnalysisApi } from "../hooks/useKseAnalysis";

export default function AlertsView({ api }: { api: KseAnalysisApi }) {
  const [input, setInput] = useState("");

  return (
    <div className="kse-page kse-fade-in max-w-2xl">
      <div className="kse-page-header">
        <div>
          <h1 className="kse-page-title">Alerts</h1>
          <p className="kse-page-sub">
            Local watchlist only — not a live notification backend yet.
          </p>
        </div>
        <button
          type="button"
          className="kse-btn"
          onClick={api.handleSimulateMatch}
          disabled={!api.alerts.length}
        >
          <Activity size={14} />
          Simulate match
        </button>
      </div>

      <section className="kse-surface p-5 mb-4">
        <div className="kse-label mb-2">Add topic</div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            api.handleAddAlert(input);
            setInput("");
          }}
        >
          <input
            className="kse-input flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Topic to watch"
            aria-label="Alert topic"
          />
          <button
            type="submit"
            className="kse-btn kse-btn-primary"
            disabled={!input.trim()}
          >
            <Plus size={14} /> Add
          </button>
        </form>
        {api.topic && (
          <button
            type="button"
            className="kse-btn mt-2"
            style={{ height: 28, fontSize: 11 }}
            onClick={() => api.handleAddAlert(api.topic)}
          >
            Watch current: {api.topic}
          </button>
        )}
      </section>

      {!api.alerts.length ? (
        <div className="kse-empty kse-surface">
          <Bell size={28} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm m-0">No saved alerts.</p>
        </div>
      ) : (
        <ul className="m-0 p-0 list-none space-y-2">
          {api.alerts.map((a) => (
            <li
              key={a.id}
              className="kse-surface p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{a.topic}</div>
                <div
                  className="text-[11px] font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  saved {new Date(a.savedAt).toLocaleDateString()}
                  {a.matchCount > 0 ? ` · matches ${a.matchCount}` : ""}
                </div>
              </div>
              {a.hasNewNotification && (
                <button
                  type="button"
                  className="kse-badge kse-badge-warn cursor-pointer"
                  onClick={() => api.handleClearAlertNotification(a.id)}
                >
                  New
                </button>
              )}
              <button
                type="button"
                className="kse-btn"
                style={{ height: 30 }}
                onClick={() => api.handleRunAnalysis(a.topic)}
              >
                Run
              </button>
              <button
                type="button"
                className="kse-btn kse-btn-ghost"
                style={{ height: 30 }}
                aria-label="Delete alert"
                onClick={() => api.handleRemoveAlert(a.id)}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
