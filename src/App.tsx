/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Tooltip from "./components/Tooltip";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Sidebar from "./components/Sidebar";
import RelationshipGraph from "./components/RelationshipGraph";
import OriginalCard from "./components/OriginalCard";
import { 
  KSERunResult, 
  ProvenanceWeights, 
  PresentationWeights,
  AlertTopic
} from "./types";
import { 
  Clock, 
  FileText, 
  Database, 
  TrendingUp, 
  HelpCircle, 
  RefreshCw,
  Sliders,
  AlertTriangle,
  Flame,
  Binary,
  Search,
  ShieldAlert,
  ArrowLeftRight,
  CornerDownRight,
  CheckCircle2,
  Info,
  ArrowUpRight,
  Download,
  Copy,
  Check,
  Link as LinkIcon,
  Sun,
  Moon,
  Monitor,
  Share2
} from "lucide-react";

export default function App() {
  const [topic, setTopic] = useState("AI Coding Assistants");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KSERunResult | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("summary");

  // Global search input field
  const [searchQuery, setSearchQuery] = useState("");

  // Crowdsourced manual overrides flags state
  const [flags, setFlags] = useState<Record<string, 'Verified Fact' | 'Misinformation' | 'Satire' | null>>(() => {
    try {
      const saved = localStorage.getItem("kse-flags");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist flags overrides
  useEffect(() => {
    localStorage.setItem("kse-flags", JSON.stringify(flags));
  }, [flags]);

  // Share analysis copied state
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Theme support (Light/Dark/System)
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("kse-theme") as "light" | "dark" | "system") || "dark";
  });

  // Alerts configuration state
  const [alerts, setAlerts] = useState<AlertTopic[]>(() => {
    try {
      const saved = localStorage.getItem("kse-alerts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist alerts
  useEffect(() => {
    localStorage.setItem("kse-alerts", JSON.stringify(alerts));
  }, [alerts]);

  // Handle theme transitions
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let isDark = theme === "dark";
      if (theme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      if (isDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    };

    applyTheme();
    localStorage.setItem("kse-theme", theme);

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme();
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme]);

  // Alerts Management handlers
  const handleAddAlert = (topicName: string) => {
    if (!topicName.trim()) return;
    if (alerts.some(a => a.topic.toLowerCase() === topicName.toLowerCase().trim())) return;
    const newAlert: AlertTopic = {
      id: Math.random().toString(36).substring(2, 9),
      topic: topicName.trim(),
      savedAt: new Date().toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      hasNewNotification: false,
      matchCount: 0
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleRemoveAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleClearAlertNotification = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, hasNewNotification: false, matchCount: 0 } : a));
  };

  const handleSimulateMatch = () => {
    if (alerts.length === 0) return;
    const idx = Math.floor(Math.random() * alerts.length);
    setAlerts(prev => prev.map((a, i) => i === idx ? {
      ...a,
      hasNewNotification: true,
      matchCount: Math.floor(Math.random() * 8) + 1
    } : a));
  };

  // UTC clock state following guidelines
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcTime(now.toUTCString());
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Default weight configurations
  const [provenanceWeights, setProvenanceWeights] = useState<ProvenanceWeights>({
    w_time: 0.45,
    w_auth: 0.25,
    w_infl: 0.20,
    w_deriv: 0.35,
  });

  const [presentationWeights, setPresentationWeights] = useState<PresentationWeights>({
    alpha: 0.35,
    beta: 0.20,
    gamma: 0.25,
    delta: 0.15,
    epsilon: 0.05,
    zeta: 0.0,
  });

  // Cascade time window states & memos
  const [dateRange, setDateRange] = useState<[number, number] | null>(null);
  const [hasHydratedDeepLink, setHasHydratedDeepLink] = useState(false);

  const fullTimeBounds = React.useMemo<[number, number] | null>(() => {
    if (!result || !result.raw_items || result.raw_items.length === 0) return null;
    const times = result.raw_items.map(item => new Date(item.created_at).getTime());
    return [Math.min(...times), Math.max(...times)];
  }, [result]);

  useEffect(() => {
    if (result && result.raw_items && result.raw_items.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const tMin = params.get("tMin");
      const tMax = params.get("tMax");
      if (tMin && tMax && !hasHydratedDeepLink) {
        setDateRange([parseInt(tMin), parseInt(tMax)]);
        setHasHydratedDeepLink(true);
      } else {
        const times = result.raw_items.map(item => new Date(item.created_at).getTime());
        setDateRange([Math.min(...times), Math.max(...times)]);
      }
    } else {
      setDateRange(null);
    }
  }, [result]);

  const filteredResult = React.useMemo(() => {
    if (!result || !dateRange) return result;
    const [minTime, maxTime] = dateRange;

    const filteredRawItems = result.raw_items.filter(item => {
      const t = new Date(item.created_at).getTime();
      return t >= minTime && t <= maxTime;
    });

    const filteredOriginals = result.originals.filter(orig => {
      const t = new Date(orig.item.created_at).getTime();
      return t >= minTime && t <= maxTime;
    });

    const activeIds = new Set(filteredRawItems.map(item => item.id));
    const filteredEdges = result.edges.filter(edge => activeIds.has(edge.src) && activeIds.has(edge.dst));

    const filteredRunMeta = {
      ...result.run_meta,
      collected_candidates: filteredRawItems.length + (result.noise_candidates?.length || 0),
      after_dedup: filteredRawItems.length,
    };

    return {
      ...result,
      run_meta: filteredRunMeta,
      raw_items: filteredRawItems,
      originals: filteredOriginals,
      edges: filteredEdges,
    } as KSERunResult;
  }, [result, dateRange]);

  // Compute overriddenResult memo applying crowdsourced manual overrides to scores
  const overriddenResult = React.useMemo(() => {
    if (!filteredResult) return null;

    const updatedOriginals = filteredResult.originals.map(orig => {
      const flag = flags[orig.content_id];
      if (!flag) return orig;

      const baseScores = { ...orig.scores };
      if (flag === "Verified Fact") {
        baseScores.originality = 1.0;
        baseScores.authority = 1.0;
        baseScores.evidence = 1.0;
        baseScores.influence = Math.min(1.0, baseScores.influence * 1.2);
        baseScores.freshness = Math.min(1.0, baseScores.freshness * 1.1);
      } else if (flag === "Misinformation") {
        baseScores.originality = 0.05;
        baseScores.authority = 0.02;
        baseScores.influence = 0.05;
        baseScores.evidence = 0.01;
        baseScores.freshness = Math.min(1.0, baseScores.freshness * 0.5);
      } else if (flag === "Satire") {
        baseScores.originality = 0.4;
        baseScores.authority = 0.1;
        baseScores.influence = 0.5;
        baseScores.evidence = 0.1;
        baseScores.freshness = Math.min(1.0, baseScores.freshness * 0.8);
      }

      const presentationScore = (
        baseScores.originality * presentationWeights.alpha +
        baseScores.authority * presentationWeights.beta +
        baseScores.influence * presentationWeights.gamma +
        baseScores.evidence * presentationWeights.delta +
        baseScores.freshness * presentationWeights.epsilon
      );

      return {
        ...orig,
        scores: baseScores,
        source_fitness: presentationScore,
      };
    }).sort((a, b) => b.source_fitness - a.source_fitness);

    // Map updated rank based on new sorted order
    const reRankedOriginals = updatedOriginals.map((orig, index) => ({
      ...orig,
      rank: index + 1
    }));

    return {
      ...filteredResult,
      originals: reRankedOriginals,
    };
  }, [filteredResult, flags, presentationWeights]);

  // Compute search-filtered originals memo
  const searchedOriginals = React.useMemo(() => {
    if (!overriddenResult) return [];
    if (!searchQuery.trim()) return overriddenResult.originals;
    const q = searchQuery.toLowerCase().trim();
    return overriddenResult.originals.filter(orig => {
      return (
        orig.item.text.toLowerCase().includes(q) ||
        orig.author.name.toLowerCase().includes(q) ||
        orig.author.handle.toLowerCase().includes(q) ||
        (orig.why_it_matters && orig.why_it_matters.toLowerCase().includes(q)) ||
        (orig.current_relevance && orig.current_relevance.toLowerCase().includes(q))
      );
    });
  }, [overriddenResult, searchQuery]);

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search input on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("header-search-input") as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Clear selection on Esc
      if (e.key === "Escape") {
        setSelectedNodeId(null);
        setSearchQuery("");
        const searchInput = document.getElementById("header-search-input") as HTMLInputElement;
        if (searchInput) {
          searchInput.blur();
        }
      }

      // Traverse originals list using Arrow keys
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        // Skip arrow keys if typing in inputs
        const targetTagName = document.activeElement?.tagName;
        if (targetTagName === "INPUT" || targetTagName === "TEXTAREA") {
          return;
        }

        if (!searchedOriginals || searchedOriginals.length === 0) return;

        e.preventDefault();
        const currentIdx = searchedOriginals.findIndex(o => o.content_id === selectedNodeId);
        let nextIdx = 0;

        if (e.key === "ArrowDown") {
          nextIdx = currentIdx + 1;
          if (nextIdx >= searchedOriginals.length) nextIdx = 0; // Wrap around
        } else {
          nextIdx = currentIdx - 1;
          if (nextIdx < 0) nextIdx = searchedOriginals.length - 1; // Wrap around
        }

        const nextOriginal = searchedOriginals[nextIdx];
        if (nextOriginal) {
          setSelectedNodeId(nextOriginal.content_id);
          // Highlight card by scrolling it into view
          const cardEl = document.getElementById(`card-${nextOriginal.content_id}`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, searchedOriginals]);

  // Handle selected node auto-fallback if it falls outside the active time scale window
  useEffect(() => {
    if (filteredResult && filteredResult.raw_items && filteredResult.raw_items.length > 0) {
      const hasSelected = filteredResult.raw_items.some(item => item.id === selectedNodeId) ||
                          filteredResult.originals.some(o => o.content_id === selectedNodeId);
      if (!hasSelected && selectedNodeId) {
        setSelectedNodeId(filteredResult.originals[0]?.content_id || null);
      }
    }
  }, [filteredResult, selectedNodeId]);

  // Fetch initial analytical run on mount
  useEffect(() => {
    // Parse query parameters from the deep-link URL on load
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
  }, []);

  // Trigger server-side analytical pipeline
  const handleRunAnalysis = async (
    targetTopic: string,
    initialNodeId?: string | null,
    initialTimeRange?: [number, number] | null
  ) => {
    setIsLoading(true);
    setError(null);
    setSelectedNodeId(null);
    setTopic(targetTopic);

    try {
      const res = await fetch("/api/kse/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: targetTopic,
          provenanceWeights,
          presentationWeights,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger analysis pipeline.");
      }

      setResult(data);
      
      // Hydrate selected node and time range from deep link or fall back to defaults
      if (initialNodeId) {
        setSelectedNodeId(initialNodeId);
      } else if (data.originals && data.originals.length > 0) {
        setSelectedNodeId(data.originals[0].content_id);
      }

      if (initialTimeRange) {
        setDateRange(initialTimeRange);
      }
    } catch (err: any) {
      console.error("[KSE Client Error]", err);
      setError(err.message || "Could not retrieve analytical data from server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger instant recalculation of scores when weights slide (highly responsive, no costs)
  const handleRecalculate = async (pW: ProvenanceWeights, presW: PresentationWeights) => {
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
        // Reselect top if selected node got ranked out or is null
        if (data.originals && data.originals.length > 0 && (!selectedNodeId || !data.originals.some((o: any) => o.content_id === selectedNodeId))) {
          setSelectedNodeId(data.originals[0].content_id);
        }
      }
    } catch (err) {
      console.error("[KSE Recalculation Error]", err);
    }
  };

  // Sync node click in relationship graph to highlights
  const handleSelectNodeFromGraph = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  // Copy state variables for active derivative/focus inspector
  const [copiedInspectText, setCopiedInspectText] = useState(false);
  const [copiedInspectLink, setCopiedInspectLink] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Generate beautiful text report
  const generateTextReport = (res: KSERunResult) => {
    let report = `==================================================
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
- Is Fallback Mock Data: ${res.is_fallback ? "Yes (API Quota Fallback Active)" : "No"}

--------------------------------------------------
TUNED WEIGHT CONFIGURATION:
- Chronological Time Weight (w_time): ${res.weights?.provenance?.w_time ?? 0.45}
- Source Authority Weight (w_auth): ${res.weights?.provenance?.w_auth ?? 0.25}
- Downstream Influence Weight (w_infl): ${res.weights?.provenance?.w_infl ?? 0.20}
- Derivative Penalty Weight (w_deriv): ${res.weights?.provenance?.w_deriv ?? 0.35}

--------------------------------------------------
FACT-CHECKING & GROUNDING VERDICT:
${res.verification_grounding?.verdict_summary || "No active grounding verdict."}

Grounding Citations:
${res.verification_grounding?.sources?.map((s, i) => `[${i + 1}] ${s.title} (${s.uri})`).join("\n") || "No citations."}

--------------------------------------------------
TOPIC OVERVIEW SUMMARY:
${res.summary}

--------------------------------------------------
IDENTIFIED HIGH-SIGNAL ORIGINAL SOURCES:
`;

    res.originals.forEach((orig) => {
      report += `
--------------------------------------------------
RANK #${orig.rank} | ${orig.author.name} (${orig.author.handle})
Timestamp: ${new Date(orig.item.created_at).toUTCString()}
Followers: ${orig.author.follower_count?.toLocaleString()}
Likes: ${orig.item.source_meta?.likes || 0} | Retweets: ${orig.item.source_meta?.retweets || 0}

Scores:
- Originality: ${Math.round(orig.scores.originality * 100)}%
- Authority: ${Math.round(orig.scores.authority * 100)}%
- Influence: ${Math.round(orig.scores.influence * 100)}%
- Evidence: ${Math.round(orig.scores.evidence * 100)}%
- Freshness: ${Math.round(orig.scores.freshness * 100)}%

Provenance Verdict:
- Why it matters: ${orig.why_it_matters}
- Current relevance: ${orig.current_relevance}

Derivative Cascades:
- Collapsed Copies: ${orig.derivatives.copied_narratives.length}
${orig.derivatives.copied_narratives.map((c, i) => `  [${i + 1}] "${c}"`).join("\n")}

- Commentary / Replies: ${orig.derivatives.notable_followups.length}
${orig.derivatives.notable_followups.map((f, i) => `  [${i + 1}] "${f}"`).join("\n")}
`;
    });

    return report;
  };

  const handleExportJSON = () => {
    if (!filteredResult) return;
    const blob = new Blob([JSON.stringify(filteredResult, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kse-analysis-${topic.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareAnalysis = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }
    if (selectedNodeId) {
      params.set("node", selectedNodeId);
    }
    if (dateRange) {
      params.set("tMin", dateRange[0].toString());
      params.set("tMax", dateRange[1].toString());
    }
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const handleExportTXT = () => {
    if (!filteredResult) return;
    const reportStr = generateTextReport(filteredResult);
    const blob = new Blob([reportStr], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kse-provenance-report-${topic.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    if (!overriddenResult) return;
    setIsExportingPDF(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      
      const drawBg = (p: jsPDF) => {
        p.setFillColor(9, 13, 22); // #090d16
        p.rect(0, 0, 210, 297, "F");
      };

      const drawHeader = (p: jsPDF, pageTitle: string) => {
        drawBg(p);
        p.setFillColor(16, 185, 129); // #10b981
        p.rect(10, 10, 190, 1.5, "F");
        
        p.setTextColor(16, 185, 129);
        p.setFont("helvetica", "bold");
        p.setFontSize(14);
        p.text("KNOWLEDGE SIGNAL ENGINE", 15, 20);
        
        p.setTextColor(148, 163, 184); // slate 400
        p.setFont("helvetica", "normal");
        p.setFontSize(8);
        p.text(`SOCIAL PROVENANCE REPORT  |  ${pageTitle.toUpperCase()}`, 15, 24);
        
        p.setDrawColor(30, 41, 59); // slate 800
        p.line(10, 28, 200, 28);
      };

      // 1. Capture RelationshipGraph container using html2canvas
      const container = document.getElementById("relationship-graph-container");
      let graphImgData: string | null = null;
      if (container) {
        const canvas = await html2canvas(container, {
          useCORS: true,
          scale: 2,
          backgroundColor: "#090d16",
        });
        graphImgData = canvas.toDataURL("image/png");
      }

      // PAGE 1: COVER & METRICS
      drawHeader(pdf, "Executive Overview & Metrics");
      
      pdf.setTextColor(241, 245, 249); // slate 100
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(topic, 15, 40);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184); // slate 400
      pdf.text(`Run Timestamp (UTC): ${new Date().toUTCString()}`, 15, 46);

      // Metrics block background
      pdf.setFillColor(15, 23, 42); // slate 900
      pdf.rect(12, 52, 186, 26, "F");
      pdf.setDrawColor(30, 41, 59); // slate 800
      pdf.rect(12, 52, 186, 26, "S");

      // Metrics content
      pdf.setTextColor(16, 185, 129); // emerald
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("PIPELINE EXECUTION METRICS", 16, 58);

      pdf.setTextColor(241, 245, 249); // slate 100
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Collected Candidates: ${overriddenResult.run_meta.collected_candidates}`, 16, 64);
      pdf.text(`Deduplicated Claims: ${overriddenResult.run_meta.after_dedup}`, 16, 69);
      pdf.text(`Provenance Components: ${overriddenResult.run_meta.components}`, 16, 74);

      pdf.text(`API Pipeline Calls Used: ${overriddenResult.run_meta.api_calls_used}`, 105, 64);
      pdf.text(`Is Fallback Dataset: ${overriddenResult.is_fallback ? "Yes" : "No"}`, 105, 69);

      // Verification verdict
      const verdictText = overriddenResult.verification_grounding?.verdict_summary || "No active grounding verdict.";
      pdf.setFillColor(15, 23, 42); // slate 900
      pdf.rect(12, 84, 186, 26, "F");
      pdf.setDrawColor(30, 41, 59); // slate 800
      pdf.rect(12, 84, 186, 26, "S");

      pdf.setTextColor(16, 185, 129); // emerald
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("VERIFICATION VERDICT", 16, 90);

      pdf.setTextColor(241, 245, 249); // slate 100
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      const verdictLines = pdf.splitTextToSize(verdictText, 178);
      let vY = 96;
      verdictLines.slice(0, 2).forEach((line: string) => {
        pdf.text(line, 16, vY);
        vY += 5;
      });

      // Relationship graph visualization section
      pdf.setTextColor(16, 185, 129); // emerald
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("RELATIONSHIP GRAPH CASCADE VISUALIZATION", 15, 120);

      if (graphImgData) {
        // Draw image box
        pdf.setDrawColor(30, 41, 59); // slate 800
        pdf.setFillColor(15, 23, 42); // slate 900
        pdf.rect(12, 124, 186, 110, "F");
        pdf.rect(12, 124, 186, 110, "S");
        // Center the image inside the box
        pdf.addImage(graphImgData, "PNG", 13, 125, 184, 108);
      } else {
        pdf.setTextColor(148, 163, 184); // slate 400
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(9);
        pdf.text("No graph visualization image captured.", 20, 134);
      }

      // PAGE 2: SUMMARY
      pdf.addPage();
      drawHeader(pdf, "Executive Synthesis & Verdict");

      pdf.setTextColor(16, 185, 129); // emerald
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("EXECUTIVE TOPIC SYNTHESIS", 15, 36);

      const summaryText = overriddenResult.summary || "No summary available.";
      const summaryLines = pdf.splitTextToSize(summaryText, 180);
      let curY = 44;
      
      summaryLines.forEach((line: string) => {
        if (curY > 270) {
          pdf.addPage();
          drawHeader(pdf, "Executive Synthesis & Verdict");
          curY = 36;
        }
        pdf.setTextColor(241, 245, 249); // slate 100
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.5);
        pdf.text(line, 15, curY);
        curY += 5.5;
      });

      // PAGE 3: TOP INGESTION ORIGINALS
      pdf.addPage();
      drawHeader(pdf, "Top Provenance Original Claims");

      pdf.setTextColor(16, 185, 129); // emerald
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("IDENTIFIED HIGH-SIGNAL ORIGINAL SOURCES", 15, 36);

      let origY = 44;
      overriddenResult.originals.forEach((orig) => {
        if (origY > 240) {
          pdf.addPage();
          drawHeader(pdf, "Top Provenance Original Claims");
          origY = 36;
        }

        // Card container for each original source
        pdf.setFillColor(15, 23, 42); // slate 900
        pdf.rect(12, origY, 186, 36, "F");
        pdf.setDrawColor(30, 41, 59); // slate 800
        pdf.rect(12, origY, 186, 36, "S");

        // Author and Rank info
        pdf.setTextColor(16, 185, 129); // emerald
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        const flag = flags[orig.content_id] ? ` [Flag: ${flags[orig.content_id]}]` : "";
        pdf.text(`RANK #${orig.rank}  |  ${orig.author.name} (${orig.author.handle})${flag}`, 16, origY + 6);

        // Score details
        pdf.setTextColor(148, 163, 184); // slate 400
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(
          `Fitness Score: ${Math.round(orig.source_fitness * 100)}%  |  Originality: ${Math.round(orig.scores.originality * 100)}%  |  Authority: ${Math.round(orig.scores.authority * 100)}%  |  Influence: ${Math.round(orig.scores.influence * 100)}%`,
          16,
          origY + 11
        );

        // Followers / Likes
        pdf.text(
          `Followers: ${orig.author.follower_count?.toLocaleString()}  |  Likes: ${orig.item.source_meta?.likes?.toLocaleString()}  |  Retweets: ${orig.item.source_meta?.retweets?.toLocaleString()}`,
          16,
          origY + 16
        );

        // Body text of claim (wrapped)
        const textLines = pdf.splitTextToSize(`"${orig.item.text}"`, 178);
        let textY = origY + 22;
        pdf.setTextColor(241, 245, 249); // slate 100
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        textLines.slice(0, 3).forEach((line: string) => {
          pdf.text(line, 16, textY);
          textY += 4.5;
        });

        origY += 40;
      });

      pdf.save(`kse-provenance-analysis-${topic.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    } catch (err) {
      console.error("[KSE PDF Generation Error]", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleCopyInspectText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInspectText(true);
    setTimeout(() => setCopiedInspectText(false), 2000);
  };

  const handleCopyInspectLink = (text: string, id: string, handle: string, urls?: string[]) => {
    const url = urls?.[0] || `https://twitter.com/${handle.replace('@', '')}/status/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedInspectLink(true);
    setTimeout(() => setCopiedInspectLink(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. LEFT CONTROL SIDEBAR */}
      <Sidebar
        onRunAnalysis={handleRunAnalysis}
        onRecalculate={handleRecalculate}
        isLoading={isLoading}
        currentTopic={topic}
        provenanceWeights={provenanceWeights}
        presentationWeights={presentationWeights}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        fullTimeBounds={fullTimeBounds}
        alerts={alerts}
        onAddAlert={handleAddAlert}
        onRemoveAlert={handleRemoveAlert}
        onClearAlertNotification={handleClearAlertNotification}
        onSimulateMatch={handleSimulateMatch}
      />

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* UPPER TITLE BAR (UTC TIME & METRICS) */}
        <header className="h-14 bg-slate-950 border-b border-slate-900 px-6 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <Database size={13} />
              <span className="font-bold uppercase hidden md:inline">engine status: online</span>
              <span className="font-bold uppercase md:hidden">KSE: online</span>
            </div>
            {result?.is_fallback && (
              <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full select-none" title="Gemini free-tier API rate limits were reached. The Knowledge Signal Engine automatically activated its dynamic offline heuristic generator to ensure continuous operations!">
                <AlertTriangle size={12} className="animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Quota Fallback</span>
              </div>
            )}
            {result && (
              <div className="hidden lg:flex items-center gap-3 text-slate-500 pl-4 border-l border-slate-900">
                <span>candidates: <strong className="text-slate-300">{result.run_meta.collected_candidates}</strong></span>
                <span>connected claims: <strong className="text-slate-300">{result.run_meta.components}</strong></span>
              </div>
            )}

            {/* Global Search Input Field in Header */}
            <div className="relative flex items-center max-w-[200px] sm:max-w-xs md:ml-4">
              <Search size={12} className="absolute left-2.5 text-slate-500" />
              <input
                id="header-search-input"
                type="text"
                placeholder="Search claims... (Cmd+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 pl-8 text-[11px] focus:outline-none focus:border-emerald-500 text-slate-100 transition placeholder:text-slate-500 font-sans"
              />
              {searchQuery && (
                <Tooltip content="Clear active search filter">
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-[10px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer animate-fade-in"
                  >
                    ✕
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Export Actions */}
            {filteredResult && (
              <div className="hidden sm:flex items-center gap-1.5 border-r border-slate-900 pr-3 mr-1">
                <Tooltip content="Share current search, time range, & selected claim deep-link">
                  <button
                    onClick={handleShareAnalysis}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[10.5px] font-mono text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 transition cursor-pointer mr-1"
                  >
                    {copiedShareLink ? <Check size={11} className="text-emerald-400" /> : <Share2 size={11} />}
                    <span>{copiedShareLink ? "Copied Link!" : "Share Analysis"}</span>
                  </button>
                </Tooltip>

                <Tooltip content="Export current analysis as high-quality PDF report with graph visualizer">
                  <button
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10.5px] font-mono text-slate-300 hover:text-emerald-400 border border-slate-800/40 transition cursor-pointer disabled:opacity-50"
                  >
                    {isExportingPDF ? (
                      <RefreshCw size={11} className="animate-spin text-emerald-400" />
                    ) : (
                      <FileText size={11} />
                    )}
                    <span>{isExportingPDF ? "Exporting PDF..." : "Export PDF"}</span>
                  </button>
                </Tooltip>

                <Tooltip content="Export formatted textual analysis report as plain text file">
                  <button
                    onClick={handleExportTXT}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10.5px] font-mono text-slate-300 hover:text-emerald-400 border border-slate-800/40 transition cursor-pointer"
                  >
                    <Download size={11} />
                    <span>Export Report</span>
                  </button>
                </Tooltip>

                <Tooltip content="Export raw filtered JSON dataset to file">
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10.5px] font-mono text-slate-300 hover:text-emerald-400 border border-slate-800/40 transition cursor-pointer"
                  >
                    <Download size={11} />
                    <span>JSON</span>
                  </button>
                </Tooltip>
              </div>
            )}

            {/* Theme Toggle Button Segment */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 select-none shrink-0" role="group">
              {[
                { key: "light" as const, icon: Sun, label: "Light", tooltip: "Switch to Light theme" },
                { key: "dark" as const, icon: Moon, label: "Dark", tooltip: "Switch to Dark theme" },
                { key: "system" as const, icon: Monitor, label: "Sys", tooltip: "Use System theme preference" }
              ].map((t) => {
                const Icon = t.icon;
                const isActive = theme === t.key;
                return (
                  <span key={t.key} className="inline-flex">
                    <Tooltip content={t.tooltip}>
                      <button
                        onClick={() => setTheme(t.key)}
                        className={`p-1 px-2 rounded-md transition duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                          isActive
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Icon size={11} className={isActive ? "text-slate-950" : ""} />
                        <span className="text-[10px] font-mono hidden md:inline">{t.label}</span>
                      </button>
                    </Tooltip>
                  </span>
                );
              })}
            </div>

            {/* Clock overlay */}
            <div className="hidden sm:flex items-center gap-2 text-[10.5px] font-mono text-slate-400 bg-slate-900/40 border border-slate-900 px-3 py-1 rounded-lg shrink-0">
              <Clock size={11} className="text-emerald-500" />
              <span className="text-emerald-300 font-bold">{utcTime || "CLOCK_INIT..."}</span>
            </div>
          </div>
        </header>

        {/* INNER GRID SCROLL CONTAINER */}
        <div className="flex-1 overflow-hidden relative flex">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur z-50">
              <div className="max-w-md p-6 rounded-2xl bg-slate-900 border border-red-500/20 text-center flex flex-col items-center gap-3">
                <AlertTriangle className="text-red-500 w-10 h-10" />
                <h3 className="font-bold text-slate-100 font-sans text-sm">Pipeline Error Encountered</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{error}</p>
                <button
                  onClick={() => handleRunAnalysis(topic)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold font-sans hover:bg-emerald-400 cursor-pointer mt-2"
                >
                  Retry Run
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur z-50">
              <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/20 flex items-center justify-center animate-spin">
                  <RefreshCw className="text-emerald-400" size={18} />
                </div>
                <div className="leading-none">
                  <h3 className="font-bold text-slate-200 text-xs font-mono uppercase tracking-wider mb-1">Retrieving candidates</h3>
                  <span className="text-[10px] font-mono text-slate-500">running deduplication & components cascade...</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-900 text-[11px] text-slate-400 font-sans text-left leading-relaxed mt-2 shadow-inner">
                  <strong className="text-slate-300 font-semibold block mb-1">Server-side Gemini Operations:</strong>
                  Gemini is currently evaluating semantic tweet histories, mapping image duplicates, and creating an un-collapsed score vector report.
                </div>
              </div>
            </div>
          ) : null}

          {/* TWO COLUMN GRID FOR VISUAL NETWORK AND BENTO CARDS */}
          {filteredResult && (() => {
            const activeResult = overriddenResult || filteredResult;
            
            const summaryReadingTime = (() => {
              if (!activeResult?.summary) return "";
              const words = activeResult.summary.trim().split(/\s+/).filter(Boolean).length;
              const seconds = Math.max(1, Math.ceil((words / 200) * 60)); // 200 WPM
              if (seconds < 60) return `${seconds}s read`;
              const mins = Math.floor(seconds / 60);
              const remSecs = seconds % 60;
              return remSecs > 0 ? `${mins}m ${remSecs}s read` : `${mins}m read`;
            })();

            // Compute focus node details
            const selectedNode = activeResult.raw_items.find(item => item.id === selectedNodeId);
            const selectedAuthor = selectedNode ? activeResult.authors[selectedNode.author_id] : null;
            const selectedOriginal = activeResult.originals.find(o => o.content_id === selectedNodeId);
            const isSelectedOriginal = !!selectedOriginal;

            // Trace parent original if a derivative node is selected
            const parentOriginal = selectedNode && !isSelectedOriginal
              ? activeResult.originals.find(o => 
                  o.content_id === selectedNode.parent_id ||
                  o.content_id === selectedNode.quoted_id ||
                  (selectedNode.media_hashes?.length && o.item.media_hashes?.some(h => selectedNode.media_hashes.includes(h))) ||
                  o.derivatives.copied_narratives.some(txt => 
                    txt.includes(selectedNode.text.substring(0, Math.min(12, selectedNode.text.length))) ||
                    selectedNode.text.includes(txt.substring(0, Math.min(12, txt.length)))
                  ) ||
                  o.derivatives.notable_followups.some(txt => 
                    txt.includes(selectedNode.text.substring(0, Math.min(12, selectedNode.text.length))) ||
                    selectedNode.text.includes(txt.substring(0, Math.min(12, txt.length)))
                  )
                )
              : null;

            return (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                
                {/* MIDDLE AREA (NETWORK VISUALIZER & GENERAL TOPIC BANNER) */}
                <div className="flex-1 flex flex-col p-5 gap-5 overflow-y-auto lg:h-full">
                  
                  {/* 1. VISUALIZATION GRAPH CARD */}
                  <div className="h-[320px] md:h-[420px] shrink-0">
                    <RelationshipGraph
                      items={activeResult.raw_items}
                      edges={activeResult.edges}
                      authors={activeResult.authors}
                      selectedNodeId={selectedNodeId}
                      onSelectNode={handleSelectNodeFromGraph}
                      originalIds={activeResult.originals.map(o => o.content_id)}
                      searchQuery={searchQuery}
                    />
                  </div>

                  {/* 2. KSE MULTI-STAGE PIPELINE HUB (TABS) */}
                  <div className="rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md relative overflow-hidden flex flex-col min-h-[320px] shrink-0">
                    {/* Tab list header */}
                    <div className="flex border-b border-slate-900 bg-slate-950/80 p-1 gap-1 shrink-0">
                      {[
                        { id: "summary", label: "Overview", icon: FileText, desc: "Stage ① & ⑧" },
                        { id: "verification", label: "Grounding", icon: Search, desc: "Stage ⑤" },
                        { id: "noise", label: "Noise Filter", icon: ShieldAlert, desc: "Stage ②" },
                        { id: "near_dup", label: "Deduplication", icon: ArrowLeftRight, desc: "Stage ③" }
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex flex-col items-center py-2 px-3 rounded-xl transition cursor-pointer ${
                              isActive
                                ? "bg-slate-900 border border-emerald-500/20 text-emerald-400 font-bold shadow-sm"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-mono">
                              <Icon size={12} className={isActive ? "text-emerald-400" : "text-slate-500"} />
                              <span>{tab.label}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-600 font-normal mt-0.5">{tab.desc}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab panels */}
                    <div className="flex-1 p-5 overflow-y-auto">
                      {activeTab === "summary" && (
                        <div className="space-y-4 animate-fade-in">
                          <div className="flex items-center gap-2 text-[10.5px] font-mono text-slate-400 bg-slate-900/40 border border-slate-900/60 px-3 py-1.5 rounded-lg w-fit">
                            <Clock size={11} className="text-emerald-500 shrink-0" />
                            <span>Estimated Summary Reading Time: <strong className="text-emerald-400 font-bold">{summaryReadingTime}</strong></span>
                          </div>
                          <div className="text-xs text-slate-300 leading-relaxed font-sans font-medium space-y-3.5">
                            {activeResult.summary.split("\n\n").map((para, i) => (
                              <p key={i}>{para}</p>
                            ))}
                          </div>
                          
                          {/* Pipeline Metadata Overlay */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-900/80 text-[10px] font-mono text-slate-500">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] uppercase text-slate-600">Verification Engine</span>
                              <span className="text-slate-300 font-bold">Cross-verified UTC</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] uppercase text-slate-600">De-duplication</span>
                              <span className="text-slate-300 font-bold">MinHash LSH (15% collapsed)</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] uppercase text-slate-600">Screenshot tracking</span>
                              <span className="text-slate-300 font-bold">Active (pHash dist &lt; 2)</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] uppercase text-slate-600">Source Selection</span>
                              <span className="text-emerald-400 font-bold">source_fitness_v1.2</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === "verification" && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-950/5 flex items-start gap-3">
                            <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase mb-1">
                                Independent Verification & Claim Grounding
                              </h4>
                              <p className="text-xs font-sans text-slate-300 leading-relaxed font-medium">
                                {activeResult.verification_grounding?.verdict_summary || "Grounding analysis in progress..."}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                              Corroborating Search Citations
                            </h4>
                            <div className="flex flex-col gap-2">
                              {activeResult.verification_grounding?.sources && activeResult.verification_grounding.sources.length > 0 ? (
                                activeResult.verification_grounding.sources.map((source, idx) => (
                                  <a
                                    key={idx}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 rounded-lg bg-slate-900/60 border border-slate-900 hover:border-slate-800 hover:bg-slate-900/80 transition flex items-center justify-between text-xs font-sans group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-5 h-5 rounded bg-slate-950 flex items-center justify-center font-mono text-[9px] text-emerald-400 border border-slate-900">
                                        {idx + 1}
                                      </div>
                                      <span className="text-slate-200 font-semibold truncate group-hover:text-emerald-400 transition">
                                        {source.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 group-hover:text-slate-300 pl-4">
                                      <span className="max-w-[120px] truncate">{new URL(source.uri).hostname}</span>
                                      <ArrowUpRight size={11} className="text-slate-600 group-hover:text-emerald-400" />
                                    </div>
                                  </a>
                                ))
                              ) : (
                                <div className="text-center p-6 bg-slate-900/20 border border-slate-900 rounded-lg">
                                  <span className="text-xs font-mono text-slate-500">No external source citations parsed.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === "noise" && (
                        <div className="space-y-4">
                          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-900 text-[11px] text-slate-400 leading-relaxed font-sans">
                            <strong className="text-slate-300 font-bold font-mono uppercase text-xs block mb-1">
                              Stage ②: Low-Signal Pruning
                            </strong>
                            To isolate genuine, primary disclosures, the KSE Noise Filter crawls incoming items and drops engagement bait, spam accounts, repetitive promotional templates, and suspicious cryptocurrency links.
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                              Pruned Candidates Log ({activeResult.noise_candidates?.length || 0} removed)
                            </div>
                            {activeResult.noise_candidates && activeResult.noise_candidates.length > 0 ? (
                              activeResult.noise_candidates.map((cand) => (
                                <div
                                  key={cand.id}
                                  className="p-3.5 rounded-xl bg-red-950/5 border border-red-500/10 hover:border-red-500/20 transition flex flex-col gap-2 animate-fade-in"
                                >
                                  <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-red-400 font-bold">{cand.author_handle}</span>
                                    <span className="text-[9px] bg-red-950/60 text-red-300 border border-red-900/40 px-2 py-0.5 rounded-full">
                                      PRUNED
                                    </span>
                                  </div>
                                  <p className="text-xs font-sans text-slate-300 italic">
                                    "{cand.text}"
                                  </p>
                                  <div className="text-[10px] font-mono text-red-400/80 flex items-center gap-1.5 pt-1.5 border-t border-slate-900">
                                    <Info size={11} className="text-red-400 shrink-0" />
                                    <span>Reason: {cand.reason}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center p-6 bg-slate-900/20 border border-slate-900 rounded-lg">
                                <span className="text-xs font-mono text-slate-500">No candidates were pruned in this run.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === "near_dup" && (
                        <div className="space-y-4">
                          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-900 text-[11px] text-slate-400 leading-relaxed font-sans">
                            <strong className="text-slate-300 font-bold font-mono uppercase text-xs block mb-1">
                              Stage ③: Near-Duplicate Collapse Analysis
                            </strong>
                            Reprinted text, quote retweets with minimal comment, and screenshots sharing a perceptual image hash (pHash) are grouped and collapsed into their primary original source node, maintaining graph clarity and focusing authority on primary disclosures.
                          </div>

                          <div>
                            <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                              Claim Cluster Volume & Collapsed Narratives
                            </h4>
                            <div className="flex flex-col gap-2.5">
                              {activeResult.originals.map((orig) => {
                                const totalDerivatives = orig.derivatives.copied_narratives.length + orig.derivatives.notable_followups.length;
                                return (
                                  <div
                                    key={orig.content_id}
                                    className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-900 hover:border-slate-800 transition flex flex-col gap-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-mono font-bold text-[10px]">
                                          {orig.rank}
                                        </div>
                                        <span className="text-xs font-bold text-slate-200">
                                          {orig.author.name} ({orig.author.handle})
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-mono text-slate-400">
                                        {totalDerivatives} collapsed descendants
                                      </span>
                                    </div>
                                    <p className="text-[11px] font-sans text-slate-400 truncate italic">
                                      "{orig.item.text}"
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-2">
                                      <div>Duplication: <span className="text-emerald-400 font-bold">{orig.derivatives.copied_narratives.length} (pHash match)</span></div>
                                      <div>Commentary: <span className="text-indigo-400 font-bold">{orig.derivatives.notable_followups.length} (quote/reply)</span></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT PANEL: SCROLLABLE TOP ORIGINALS BENTO GRID (≤10) */}
                <div className="w-full lg:w-[480px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-900 h-[600px] lg:h-full flex flex-col overflow-hidden bg-slate-950">
                  
                  {/* ACTIVE DERIVATIVE TRACE INSPECTOR */}
                  {selectedNode && (
                    <div className="px-5 py-4 shrink-0 border-b border-slate-900 bg-slate-950/60">
                      <div className={`p-4 rounded-xl border relative overflow-hidden ${isSelectedOriginal ? "border-emerald-500/10 bg-emerald-950/5" : "border-amber-500/15 bg-amber-950/5"}`}>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-500/5 to-transparent rounded-full blur-xl" />
                        
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <Flame size={13} className={isSelectedOriginal ? "text-emerald-400" : "text-amber-500 animate-pulse"} />
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isSelectedOriginal ? "text-emerald-400" : "text-amber-500"}`}>
                            {isSelectedOriginal ? "Original Node Focus" : "Derivative Lineage Inspector"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <img
                            src={selectedAuthor?.avatar_url}
                            alt="avatar"
                            className="w-5 h-5 rounded-full border border-slate-800 bg-slate-900"
                          />
                          <div className="leading-tight">
                            <span className="text-xs font-bold text-slate-200 block">{selectedAuthor?.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">{selectedAuthor?.handle}</span>
                          </div>
                        </div>

                        <p className="text-xs font-sans text-slate-300 leading-relaxed font-medium bg-slate-950/60 p-3 rounded-lg border border-slate-900/60 italic">
                          "{selectedNode.text}"
                        </p>

                        {/* Copy Actions inside Inspector */}
                        <div className="flex items-center gap-1.5 mt-2 justify-end">
                          <button
                            onClick={() => handleCopyInspectText(selectedNode.text)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition border border-slate-800/40 cursor-pointer"
                            title="Copy text content to clipboard"
                          >
                            {copiedInspectText ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            <span>{copiedInspectText ? "Copied text!" : "Copy Text"}</span>
                          </button>
                          <button
                            onClick={() => handleCopyInspectLink(selectedNode.text, selectedNode.id, selectedAuthor?.handle || "", selectedNode.urls)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition border border-slate-800/40 cursor-pointer"
                            title="Copy source link to clipboard"
                          >
                            {copiedInspectLink ? <Check size={10} className="text-emerald-400" /> : <LinkIcon size={10} />}
                            <span>{copiedInspectLink ? "Copied link!" : "Copy Link"}</span>
                          </button>
                        </div>

                        {!isSelectedOriginal && (
                          <div className="mt-3.5 pt-3 border-t border-slate-900/80 flex flex-col gap-2.5">
                            <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                              <CornerDownRight size={12} className="text-amber-500" />
                              <span>Derivative Lineage Connection</span>
                            </div>

                            {parentOriginal ? (
                              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-900/80 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded shrink-0">
                                    ORIGINAL
                                  </span>
                                  <span className="text-[11px] font-sans font-bold text-slate-300 truncate">
                                    {parentOriginal.author.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setSelectedNodeId(parentOriginal.content_id)}
                                  className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition font-mono font-bold text-[9px] cursor-pointer shrink-0"
                                >
                                  jump to parent
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10.5px] font-sans text-slate-400 leading-relaxed">
                                This post is a reaction thread commenting under the general claim component.
                              </span>
                            )}
                            
                            <div className="text-[9.5px] font-mono text-slate-500 leading-normal flex items-start gap-1">
                              <Info size={11} className="text-amber-500 shrink-0 mt-0.5" />
                              <span>This derivative node holds low time-priority and inherits media hashes from its parent cluster.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="px-5 py-3 border-b border-slate-900 bg-slate-950 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Binary size={14} className="text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-slate-200">
                        TOP PROVENANCE ORIGINALS ({searchedOriginals.length})
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">sort: presentation_score</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                    {searchedOriginals.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <HelpCircle size={32} className="text-slate-700 mb-2" />
                        <p className="text-xs font-mono text-slate-500">No matching originals identified.</p>
                      </div>
                    ) : (
                      searchedOriginals.map((original) => {
                        const isSelected = selectedNodeId === original.content_id;
                        return (
                          <OriginalCard
                            key={original.content_id}
                            original={original}
                            isSelected={isSelected}
                            onSelect={() => setSelectedNodeId(original.content_id)}
                            activeFlag={flags[original.content_id] || null}
                            onFlagChange={(id, flag) => {
                              setFlags(prev => ({
                                ...prev,
                                [id]: flag
                              }));
                            }}
                          />
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
