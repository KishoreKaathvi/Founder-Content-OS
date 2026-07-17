/**
 * Analysis state, API calls, filters, flags, exports for KSE.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type {
  AlertTopic,
  KSERunResult,
  PresentationWeights,
  ProvenanceWeights,
} from "../types";

export type ClaimFlag = "Verified Fact" | "Misinformation" | "Satire" | null;
export type AppView =
  | "overview"
  | "sources"
  | "graph"
  | "noise"
  | "verify"
  | "tuning"
  | "alerts"
  | "content";

const DEFAULT_PROVENANCE: ProvenanceWeights = {
  w_time: 0.45,
  w_auth: 0.25,
  w_infl: 0.2,
  w_deriv: 0.35,
};

const DEFAULT_PRESENTATION: PresentationWeights = {
  alpha: 0.35,
  beta: 0.2,
  gamma: 0.25,
  delta: 0.15,
  epsilon: 0.05,
  zeta: 0.0,
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useKseAnalysis() {
  const [topic, setTopic] = useState("AI Coding Assistants");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KSERunResult | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppView>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [utcTime, setUtcTime] = useState("");
  const [dateRange, setDateRange] = useState<[number, number] | null>(null);
  const [hasHydratedDeepLink, setHasHydratedDeepLink] = useState(false);

  const [provenanceWeights, setProvenanceWeights] =
    useState<ProvenanceWeights>(DEFAULT_PROVENANCE);
  const [presentationWeights, setPresentationWeights] =
    useState<PresentationWeights>(DEFAULT_PRESENTATION);

  const [flags, setFlags] = useState<Record<string, ClaimFlag>>(() =>
    loadJson("kse-flags", {})
  );
  const [alerts, setAlerts] = useState<AlertTopic[]>(() =>
    loadJson("kse-alerts", [])
  );
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    const raw = localStorage.getItem("kse-theme");
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
    // drop DaisyUI theme ids if stored
    localStorage.removeItem("kse-daisy-theme");
    return "dark";
  });

  useEffect(() => {
    localStorage.setItem("kse-flags", JSON.stringify(flags));
  }, [flags]);

  useEffect(() => {
    localStorage.setItem("kse-alerts", JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    const apply = () => {
      let dark = theme === "dark";
      if (theme === "system") {
        dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.classList.toggle("light", !dark);
      document.documentElement.removeAttribute("data-theme");
    };
    apply();
    localStorage.setItem("kse-theme", theme);
    localStorage.removeItem("kse-daisy-theme");
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => apply();
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [theme]);

  useEffect(() => {
    const tick = () => setUtcTime(new Date().toUTCString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fullTimeBounds = useMemo<[number, number] | null>(() => {
    if (!result?.raw_items?.length) return null;
    const times = result.raw_items.map((i) => new Date(i.created_at).getTime());
    return [Math.min(...times), Math.max(...times)];
  }, [result]);

  // When a new run lands, always reset the cascade window to the full item span
  // (unless hydrating a share deep-link once). Old ranges from prior topics
  // can otherwise filter the new run down to zero rows — looks like "analysis failed".
  useEffect(() => {
    if (!result?.raw_items?.length) {
      setDateRange(null);
      return;
    }
    const times = result.raw_items.map((i) => new Date(i.created_at).getTime());
    const full: [number, number] = [Math.min(...times), Math.max(...times)];

    const params = new URLSearchParams(window.location.search);
    const tMin = params.get("tMin");
    const tMax = params.get("tMax");
    if (tMin && tMax && !hasHydratedDeepLink) {
      setDateRange([parseInt(tMin, 10), parseInt(tMax, 10)]);
      setHasHydratedDeepLink(true);
      return;
    }
    setDateRange(full);
  }, [result, hasHydratedDeepLink]);

  const filteredResult = useMemo(() => {
    if (!result || !dateRange) return result;
    const [minTime, maxTime] = dateRange;
    const filteredRawItems = result.raw_items.filter((item) => {
      const t = new Date(item.created_at).getTime();
      return t >= minTime && t <= maxTime;
    });
    const filteredOriginals = result.originals.filter((orig) => {
      const t = new Date(orig.item.created_at).getTime();
      return t >= minTime && t <= maxTime;
    });
    const activeIds = new Set(filteredRawItems.map((i) => i.id));
    const filteredEdges = result.edges.filter(
      (e) => activeIds.has(e.src) && activeIds.has(e.dst)
    );
    return {
      ...result,
      run_meta: {
        ...result.run_meta,
        collected_candidates:
          filteredRawItems.length + (result.noise_candidates?.length || 0),
        after_dedup: filteredRawItems.length,
      },
      raw_items: filteredRawItems,
      originals: filteredOriginals,
      edges: filteredEdges,
    } as KSERunResult;
  }, [result, dateRange]);

  const overriddenResult = useMemo(() => {
    if (!filteredResult) return null;
    const updated = filteredResult.originals
      .map((orig) => {
        const flag = flags[orig.content_id];
        if (!flag) return orig;
        const baseScores = { ...orig.scores };
        if (flag === "Verified Fact") {
          baseScores.originality = 1;
          baseScores.authority = 1;
          baseScores.evidence = 1;
          baseScores.influence = Math.min(1, baseScores.influence * 1.2);
          baseScores.freshness = Math.min(1, baseScores.freshness * 1.1);
        } else if (flag === "Misinformation") {
          baseScores.originality = 0.05;
          baseScores.authority = 0.02;
          baseScores.influence = 0.05;
          baseScores.evidence = 0.01;
          baseScores.freshness = Math.min(1, baseScores.freshness * 0.5);
        } else if (flag === "Satire") {
          baseScores.originality = 0.4;
          baseScores.authority = 0.1;
          baseScores.influence = 0.5;
          baseScores.evidence = 0.1;
          baseScores.freshness = Math.min(1, baseScores.freshness * 0.8);
        }
        const presentationScore =
          baseScores.originality * presentationWeights.alpha +
          baseScores.authority * presentationWeights.beta +
          baseScores.influence * presentationWeights.gamma +
          baseScores.evidence * presentationWeights.delta +
          baseScores.freshness * presentationWeights.epsilon;
        return {
          ...orig,
          scores: baseScores,
          source_fitness: presentationScore,
        };
      })
      .sort((a, b) => b.source_fitness - a.source_fitness)
      .map((orig, index) => ({ ...orig, rank: index + 1 }));

    return { ...filteredResult, originals: updated };
  }, [filteredResult, flags, presentationWeights]);

  const searchedOriginals = useMemo(() => {
    if (!overriddenResult) return [];
    if (!searchQuery.trim()) return overriddenResult.originals;
    const q = searchQuery.toLowerCase().trim();
    return overriddenResult.originals.filter(
      (o) =>
        o.item.text.toLowerCase().includes(q) ||
        o.author.name.toLowerCase().includes(q) ||
        o.author.handle.toLowerCase().includes(q) ||
        o.why_it_matters?.toLowerCase().includes(q) ||
        o.current_relevance?.toLowerCase().includes(q)
    );
  }, [overriddenResult, searchQuery]);

  useEffect(() => {
    if (!filteredResult?.raw_items?.length || !selectedNodeId) return;
    const hasSelected =
      filteredResult.raw_items.some((i) => i.id === selectedNodeId) ||
      filteredResult.originals.some((o) => o.content_id === selectedNodeId);
    if (!hasSelected) {
      setSelectedNodeId(filteredResult.originals[0]?.content_id || null);
    }
  }, [filteredResult, selectedNodeId]);

  const handleRunAnalysis = useCallback(
    async (
      targetTopic: string,
      initialNodeId?: string | null,
      initialTimeRange?: [number, number] | null
    ) => {
      const topicClean = (targetTopic || "").trim();
      if (!topicClean) {
        setError("Enter a topic before running analysis.");
        return;
      }

      setIsLoading(true);
      setError(null);
      setSelectedNodeId(null);
      setTopic(topicClean);
      // Clear prior filter window so the new run is never clipped by old bounds
      setDateRange(null);
      setSearchQuery("");

      try {
        const res = await fetch("/api/kse/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topicClean,
            provenanceWeights,
            presentationWeights,
          }),
        });

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          throw new Error(
            `Server returned non-JSON (HTTP ${res.status}). Is the KSE server running on :3000?`
          );
        }

        if (!res.ok) {
          throw new Error(data?.error || `Pipeline failed (HTTP ${res.status})`);
        }
        if (!data?.originals && !data?.raw_items) {
          throw new Error("Empty analysis payload — check server logs.");
        }

        setResult(data);

        // Prefer deep-link range, else full span from this run
        if (initialTimeRange) {
          setDateRange(initialTimeRange);
        } else if (data.raw_items?.length) {
          const times = data.raw_items.map((i: { created_at: string }) =>
            new Date(i.created_at).getTime()
          );
          setDateRange([Math.min(...times), Math.max(...times)]);
        }

        if (initialNodeId) setSelectedNodeId(initialNodeId);
        else if (data.originals?.[0])
          setSelectedNodeId(data.originals[0].content_id);

        setActiveView("overview");
      } catch (err: any) {
        const msg =
          err?.message?.includes("Failed to fetch") ||
          err?.message?.includes("NetworkError")
            ? "Cannot reach API — start the server with: npx tsx server.ts"
            : err?.message || "Could not retrieve analysis";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [provenanceWeights, presentationWeights]
  );

  const handleRecalculate = useCallback(
    async (pW: ProvenanceWeights, presW: PresentationWeights) => {
      setProvenanceWeights(pW);
      setPresentationWeights(presW);
      if (!result) return;
      try {
        const res = await fetch("/api/kse/recalculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: result.topic,
            provenanceWeights: pW,
            presentationWeights: presW,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setResult(data);
          if (
            data.originals?.length &&
            (!selectedNodeId ||
              !data.originals.some((o: any) => o.content_id === selectedNodeId))
          ) {
            setSelectedNodeId(data.originals[0].content_id);
          }
        }
      } catch (err) {
        console.error("[KSE Recalculation Error]", err);
      }
    },
    [result, selectedNodeId]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const node = params.get("node");
    const tMin = params.get("tMin");
    const tMax = params.get("tMax");
    if (q) setSearchQuery(q);
    handleRunAnalysis(
      topic,
      node,
      tMin && tMax ? [parseInt(tMin), parseInt(tMax)] : null
    );
    // mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("header-search-input")?.focus();
      }
      if (e.key === "Escape") {
        setSelectedNodeId(null);
        setSearchQuery("");
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (!searchedOriginals.length) return;
        e.preventDefault();
        const idx = searchedOriginals.findIndex(
          (o) => o.content_id === selectedNodeId
        );
        let next =
          e.key === "ArrowDown"
            ? (idx + 1) % searchedOriginals.length
            : (idx - 1 + searchedOriginals.length) % searchedOriginals.length;
        const nextOrig = searchedOriginals[next];
        setSelectedNodeId(nextOrig.content_id);
        setActiveView("sources");
        document
          .getElementById(`card-${nextOrig.content_id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchedOriginals, selectedNodeId]);

  const setFlag = (id: string, flag: ClaimFlag) => {
    setFlags((prev) => ({ ...prev, [id]: prev[id] === flag ? null : flag }));
  };

  const handleAddAlert = (topicName: string) => {
    if (!topicName.trim()) return;
    if (alerts.some((a) => a.topic.toLowerCase() === topicName.toLowerCase()))
      return;
    setAlerts((prev) => [
      {
        id: crypto.randomUUID(),
        topic: topicName.trim(),
        savedAt: new Date().toISOString(),
        hasNewNotification: false,
        matchCount: 0,
      },
      ...prev,
    ]);
  };

  const handleRemoveAlert = (id: string) =>
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  const handleClearAlertNotification = (id: string) =>
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, hasNewNotification: false, matchCount: 0 } : a
      )
    );
  const handleSimulateMatch = () => {
    if (!alerts.length) return;
    setAlerts((prev) =>
      prev.map((a, i) =>
        i === 0
          ? {
              ...a,
              hasNewNotification: true,
              matchCount: (a.matchCount || 0) + 1,
            }
          : a
      )
    );
  };

  const generateTextReport = (res: KSERunResult) => {
    return `==================================================
KNOWLEDGE SIGNAL ENGINE (KSE) - PROVENANCE REPORT
Generated: ${new Date().toUTCString()}
Topic: ${res.topic}
==================================================

ANALYSIS STATISTICS:
- Total Candidates: ${res.run_meta.collected_candidates}
- Filtered Claims: ${res.run_meta.after_dedup}
- Cascade Claims Components: ${res.run_meta.components}
- Pruned Noise/Spam Candidates: ${res.noise_candidates?.length || 0}
- API Pipeline Usage: ${res.run_meta.api_calls_used} calls
- Is Fallback Mock Data: ${res.is_fallback ? "Yes" : "No"}

--------------------------------------------------
FACT-CHECKING & GROUNDING VERDICT:
${res.verification_grounding?.verdict_summary || "No active grounding verdict."}

Grounding Citations:
${
  res.verification_grounding?.sources
    ?.map((s, i) => `[${i + 1}] ${s.title} (${s.uri})`)
    .join("\n") || "No citations."
}

--------------------------------------------------
TOPIC OVERVIEW SUMMARY:
${res.summary}

--------------------------------------------------
RANKED ORIGINALS:
${res.originals
  .map(
    (o) => `
#${o.rank} ${o.author.handle} — ${o.author.name}
${o.item.text}
Why: ${o.why_it_matters}
Relevance: ${o.current_relevance}
Scores: O=${o.scores.originality.toFixed(2)} A=${o.scores.authority.toFixed(2)} I=${o.scores.influence.toFixed(2)} E=${o.scores.evidence.toFixed(2)} F=${o.scores.freshness.toFixed(2)}
`
  )
  .join("\n")}
`;
  };

  const handleExportJSON = () => {
    if (!filteredResult) return;
    const blob = new Blob([JSON.stringify(filteredResult, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kse-analysis-${topic.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
  };

  const handleExportTXT = () => {
    if (!filteredResult) return;
    const blob = new Blob([generateTextReport(filteredResult)], {
      type: "text/plain",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kse-report-${topic.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
  };

  const handleShareAnalysis = () => {
    const params = new URLSearchParams();
    params.set("q", searchQuery || topic);
    if (selectedNodeId) params.set("node", selectedNodeId);
    if (dateRange) {
      params.set("tMin", dateRange[0].toString());
      params.set("tMax", dateRange[1].toString());
    }
    navigator.clipboard.writeText(
      `${window.location.origin}${window.location.pathname}?${params}`
    );
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const handleExportPDF = async () => {
    if (!overriddenResult) return;
    setIsExportingPDF(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFillColor(5, 7, 11);
      pdf.rect(0, 0, 210, 297, "F");
      pdf.setTextColor(45, 212, 168);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Knowledge Signal Engine", 15, 20);
      pdf.setTextColor(244, 246, 248);
      pdf.setFontSize(16);
      pdf.text(topic, 15, 32);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text(new Date().toUTCString(), 15, 40);
      pdf.setTextColor(244, 246, 248);
      pdf.setFontSize(10);
      const summary = pdf.splitTextToSize(overriddenResult.summary || "", 180);
      pdf.text(summary, 15, 52);
      let y = 52 + summary.length * 5 + 10;
      for (const orig of overriddenResult.originals.slice(0, 6)) {
        if (y > 250) {
          pdf.addPage();
          pdf.setFillColor(5, 7, 11);
          pdf.rect(0, 0, 210, 297, "F");
          y = 20;
        }
        pdf.setTextColor(45, 212, 168);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(
          `#${orig.rank} ${orig.author.name} (${orig.author.handle})`,
          15,
          y
        );
        y += 6;
        pdf.setTextColor(200, 200, 200);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        const lines = pdf.splitTextToSize(orig.item.text, 180);
        pdf.text(lines, 15, y);
        y += lines.length * 4.5 + 8;
      }
      const graphEl = document.getElementById("kse-graph-export-root");
      if (graphEl) {
        const canvas = await html2canvas(graphEl, {
          backgroundColor: "#05070b",
          scale: 1.5,
        });
        pdf.addPage();
        pdf.setFillColor(5, 7, 11);
        pdf.rect(0, 0, 210, 297, "F");
        pdf.setTextColor(45, 212, 168);
        pdf.text("Relationship Graph", 15, 20);
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 28, 190, 120);
      }
      pdf.save(
        `kse-provenance-${topic.toLowerCase().replace(/\s+/g, "-")}.pdf`
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const selectedOriginal =
    searchedOriginals.find((o) => o.content_id === selectedNodeId) ||
    overriddenResult?.originals.find((o) => o.content_id === selectedNodeId) ||
    null;

  return {
    topic,
    setTopic,
    isLoading,
    result,
    error,
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    selectedNodeId,
    setSelectedNodeId,
    provenanceWeights,
    presentationWeights,
    dateRange,
    setDateRange,
    fullTimeBounds,
    filteredResult,
    overriddenResult,
    searchedOriginals,
    selectedOriginal,
    flags,
    setFlag,
    alerts,
    theme,
    setTheme,
    utcTime,
    copiedShareLink,
    isExportingPDF,
    handleRunAnalysis,
    handleRecalculate,
    handleAddAlert,
    handleRemoveAlert,
    handleClearAlertNotification,
    handleSimulateMatch,
    handleExportJSON,
    handleExportTXT,
    handleExportPDF,
    handleShareAnalysis,
  };
}

export type KseAnalysisApi = ReturnType<typeof useKseAnalysis>;
