/**
 * Compact enterprise source card — ranks, scores, flag, expand for detail.
 */
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";
import type { OriginalSource } from "../types";
import type { ClaimFlag } from "../hooks/useKseAnalysis";

interface Props {
  original: OriginalSource;
  isSelected: boolean;
  onSelect: () => void;
  activeFlag?: ClaimFlag;
  onFlagChange?: (id: string, flag: ClaimFlag) => void;
  dense?: boolean;
  key?: React.Key;
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-16 text-[10px] font-mono uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <div className="kse-score-bar flex-1">
        <i style={{ width: `${pct}%` }} />
      </div>
      <span
        className="w-8 text-right text-[11px] font-mono tabular-nums"
        style={{ color: "var(--text-secondary)" }}
      >
        {pct}
      </span>
    </div>
  );
}

export default function SourceCard({
  original,
  isSelected,
  onSelect,
  activeFlag = null,
  onFlagChange,
  dense = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<"text" | "link" | null>(null);
  const { rank, author, item, scores, evidence, why_it_matters, current_relevance, derivatives } =
    original;

  const copy = async (kind: "text" | "link") => {
    const value =
      kind === "text"
        ? item.text
        : evidence.primary_artifact_link ||
          `https://x.com/${author.handle.replace("@", "")}/status/${item.source_native_id}`;
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <article
      id={`card-${original.content_id}`}
      className="kse-fade-in cursor-pointer transition-colors"
      onClick={onSelect}
      style={{
        background: isSelected ? "var(--surface)" : "var(--bg-elevated)",
        border: isSelected
          ? "1px solid var(--accent-border)"
          : "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        boxShadow: isSelected ? "0 0 0 1px var(--accent-dim)" : undefined,
      }}
      aria-selected={isSelected}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid var(--accent-border)",
            }}
          >
            {rank}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[13px] font-semibold m-0 truncate">
                {author.name}
              </h3>
              <span
                className="text-[12px] font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                {author.handle}
              </span>
              {author.verified && (
                <ShieldCheck size={13} style={{ color: "var(--info)" }} />
              )}
              {activeFlag && (
                <span
                  className={
                    activeFlag === "Misinformation"
                      ? "kse-badge kse-badge-danger"
                      : activeFlag === "Satire"
                        ? "kse-badge kse-badge-warn"
                        : "kse-badge kse-badge-accent"
                  }
                >
                  {activeFlag}
                </span>
              )}
            </div>
            <div
              className="mt-1 flex items-center gap-3 text-[11px] font-mono flex-wrap"
              style={{ color: "var(--text-muted)" }}
            >
              <span>
                {new Date(item.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                })}{" "}
                UTC
              </span>
              <span>
                {(author.follower_count || 0).toLocaleString()} followers
              </span>
              {item.source_meta?.likes != null && (
                <span>{item.source_meta.likes.toLocaleString()} likes</span>
              )}
            </div>
          </div>
        </div>

        <p
          className="mt-3 text-[13px] leading-relaxed m-0"
          style={{
            color: "var(--text-secondary)",
            display: dense && !expanded ? "-webkit-box" : undefined,
            WebkitLineClamp: dense && !expanded ? 3 : undefined,
            WebkitBoxOrient: dense && !expanded ? "vertical" : undefined,
            overflow: dense && !expanded ? "hidden" : undefined,
          }}
        >
          {item.text}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {evidence.earliest_in_component && (
            <span className="kse-badge kse-badge-accent">Earliest</span>
          )}
          {evidence.original_media && (
            <span className="kse-badge">
              <ImageIcon size={10} /> Media
            </span>
          )}
          {evidence.primary_artifact_link && (
            <a
              href={evidence.primary_artifact_link}
              target="_blank"
              rel="noreferrer"
              className="kse-badge"
              onClick={(e) => e.stopPropagation()}
              style={{ textDecoration: "none", color: "var(--info)" }}
            >
              <ExternalLink size={10} /> Artifact
            </a>
          )}
          {evidence.corroborated_by?.length > 0 && (
            <span className="kse-badge">
              +{evidence.corroborated_by.length} corroboration
            </span>
          )}
        </div>

        {!dense && (
          <div className="mt-4 space-y-1.5">
            <ScoreRow label="Orig" value={scores.originality} />
            <ScoreRow label="Auth" value={scores.authority} />
            <ScoreRow label="Infl" value={scores.influence} />
            <ScoreRow label="Evid" value={scores.evidence} />
            <ScoreRow label="Fresh" value={scores.freshness} />
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            className="kse-btn kse-btn-ghost"
            style={{ height: 28, fontSize: 11 }}
            onClick={(e) => {
              e.stopPropagation();
              copy("text");
            }}
          >
            {copied === "text" ? <Check size={12} /> : <Copy size={12} />}
            Text
          </button>
          <button
            type="button"
            className="kse-btn kse-btn-ghost"
            style={{ height: 28, fontSize: 11 }}
            onClick={(e) => {
              e.stopPropagation();
              copy("link");
            }}
          >
            {copied === "link" ? <Check size={12} /> : <Copy size={12} />}
            Link
          </button>
          <button
            type="button"
            className="kse-btn kse-btn-ghost"
            style={{ height: 28, fontSize: 11 }}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? "Less" : "Detail"}
          </button>
          {onFlagChange &&
            (["Verified Fact", "Misinformation", "Satire"] as const).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  className="kse-btn"
                  style={{
                    height: 28,
                    fontSize: 10,
                    background:
                      activeFlag === f ? "var(--accent-dim)" : undefined,
                    borderColor:
                      activeFlag === f ? "var(--accent-border)" : undefined,
                    color: activeFlag === f ? "var(--accent)" : undefined,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFlagChange(original.content_id, f);
                  }}
                >
                  {f === "Verified Fact" ? "Fact" : f}
                </button>
              )
            )}
        </div>

        {expanded && (
          <div
            className="mt-4 pt-4 space-y-3 border-t"
            style={{ borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {dense && (
              <div className="space-y-1.5">
                <ScoreRow label="Orig" value={scores.originality} />
                <ScoreRow label="Auth" value={scores.authority} />
                <ScoreRow label="Infl" value={scores.influence} />
                <ScoreRow label="Evid" value={scores.evidence} />
                <ScoreRow label="Fresh" value={scores.freshness} />
              </div>
            )}
            <div>
              <div className="kse-label mb-1">Why it matters</div>
              <p
                className="text-[13px] m-0 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {why_it_matters || "—"}
              </p>
            </div>
            <div>
              <div className="kse-label mb-1">Current relevance</div>
              <p
                className="text-[13px] m-0 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {current_relevance || "—"}
              </p>
            </div>
            {derivatives.copied_narratives?.length > 0 && (
              <div>
                <div className="kse-label mb-1">Derivatives</div>
                <ul className="m-0 pl-4 space-y-1">
                  {derivatives.copied_narratives.map((d, i) => (
                    <li
                      key={i}
                      className="text-[12px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
