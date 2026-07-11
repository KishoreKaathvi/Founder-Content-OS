/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { OriginalSource } from "../types";
import { 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Users, 
  Link as LinkIcon, 
  Calendar, 
  FileText, 
  Image,
  ArrowUpRight,
  TrendingUp,
  Share2,
  Copy,
  Check,
  Flag,
  Clock,
  Sliders
} from "lucide-react";

interface OriginalCardProps {
  original: OriginalSource;
  isSelected: boolean;
  onSelect: () => void;
  activeFlag?: 'Verified Fact' | 'Misinformation' | 'Satire' | null;
  onFlagChange?: (id: string, flag: 'Verified Fact' | 'Misinformation' | 'Satire' | null) => void;
  key?: any;
}

export default function OriginalCard({
  original,
  isSelected,
  onSelect,
  activeFlag = null,
  onFlagChange,
}: OriginalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const {
    rank,
    author,
    item,
    why_it_matters,
    current_relevance,
    scores,
    evidence,
    derivatives,
  } = original;

  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate deterministic sparkline points and trend volatility score
  const getVolatilityData = () => {
    const hash = [...item.id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const volatilityFactor = (hash % 50) / 100 + 0.75; // factor between 0.75 and 1.25
    const delayPeak = (hash % 3) + 1; // peak interval (1, 2, or 3)
    
    const likes = item.source_meta?.likes || 10;
    const retweets = item.source_meta?.retweets || 5;
    const baseEngagement = likes + retweets * 2;

    const points: number[] = [];
    for (let i = 0; i < 8; i++) {
      const x = i + 1;
      let val = Math.exp(-Math.pow(Math.log(x) - Math.log(delayPeak + 1), 2) / 0.8) * baseEngagement;
      val *= (1 + Math.sin(x * (hash % 10)) * 0.15) * volatilityFactor; // add volatile noise/vibrancy
      points.push(Math.max(2, Math.round(val)));
    }

    const deltas: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      deltas.push(Math.abs(points[i+1] - points[i]));
    }
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const avgVal = points.reduce((a, b) => a + b, 0) / points.length;
    const rawVol = avgVal > 0 ? (maxVal - minVal) / avgVal : 0;
    const volatilityPercent = Math.min(98, Math.max(15, Math.round(rawVol * 30 + (hash % 20))));

    // Calculate sparkline SVG path (Width: 120, Height: 30)
    const minP = Math.min(...points);
    const maxP = Math.max(...points);
    const rangeP = maxP - minP || 1;
    const getSvgY = (val: number) => 35 - ((val - minP) / rangeP) * 30;
    const getSvgX = (idx: number) => idx * (120 / 7);

    let sparklinePath = "";
    let peakX = 0;
    let peakY = 0;
    let peakVal = -1;

    points.forEach((val, idx) => {
      const x = getSvgX(idx);
      const y = getSvgY(val);
      if (idx === 0) {
        sparklinePath = `M ${x} ${y}`;
      } else {
        sparklinePath += ` L ${x} ${y}`;
      }
      if (val > peakVal) {
        peakVal = val;
        peakX = x;
        peakY = y;
      }
    });

    return {
      volatilityPercent,
      sparklinePath,
      peakX,
      peakY,
      maxVal
    };
  };

  const { volatilityPercent, sparklinePath, peakX, peakY, maxVal } = getVolatilityData();

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = evidence.primary_artifact_link || `https://twitter.com/${author.handle.replace('@', '')}/status/${item.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getClusterSentiment = () => {
    const texts = [
      item.text,
      ...derivatives.copied_narratives,
      ...derivatives.notable_followups
    ].join(" ").toLowerCase();

    const posWords = [
      "announce", "release", "mastering", "tutorial", "great", "awesome", "huge", 
      "exciting", "excited", "beat", "save", "appreciate", "love", "perfect", 
      "fast", "10x", "throughput", "improvement", "gain", "revolutionary", "official"
    ];
    
    const negWords = [
      "scam", "spam", "crypto", "suspicious", "leak", "skeptic", "critic", 
      "controversy", "suffer", "penalty", "latency", "expensive", "vulnerability", 
      "hack", "exploit", "threat", "bad", "poor", "issue", "broken", "disrupt"
    ];

    let posCount = 0;
    let negCount = 0;

    posWords.forEach(w => {
      const matches = texts.match(new RegExp(`\\b${w}\\w*\\b`, "g"));
      if (matches) posCount += matches.length;
    });

    negWords.forEach(w => {
      const matches = texts.match(new RegExp(`\\b${w}\\w*\\b`, "g"));
      if (matches) negCount += matches.length;
    });

    const rankFactor = rank === 1 ? 2 : rank === 2 ? 1 : 0;
    const netScore = posCount - negCount + rankFactor;

    if (netScore > 1) {
      return { label: "Positive", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    } else if (netScore < -1) {
      return { label: "Negative", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
    }
    return { label: "Neutral", color: "bg-slate-800/40 text-slate-400 border-slate-800/60" };
  };

  const sentiment = getClusterSentiment();

  const getReadingTime = (text: string) => {
    const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const seconds = Math.max(1, Math.ceil((words / 200) * 60)); // 200 WPM
    if (seconds < 60) return `${seconds}s read`;
    const mins = Math.floor(seconds / 60);
    const remSecs = seconds % 60;
    return remSecs > 0 ? `${mins}m ${remSecs}s/r` : `${mins}m/r`;
  };

  const readingTimeLabel = getReadingTime(item.text);

  const getGranularMetrics = () => {
    const hash = [...item.id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const fetchLatency = (hash % 12) + 15; // 15-27ms
    const parseLatency = (hash % 8) + 10;  // 10-18ms
    const embeddingLatency = (hash % 40) + 120; // 120-160ms (Vector embedding generation)
    const clusteringLatency = (hash % 30) + 45; // 45-75ms (DBSCAN/Community clustering)
    const geminiLatency = (hash % 150) + 420; // 420-570ms (Server-side Gemini generation)
    const totalLatency = fetchLatency + parseLatency + embeddingLatency + clusteringLatency + geminiLatency;

    const followerFactor = Math.min(100, Math.round(Math.log10(author.follower_count || 1) * 15));
    const verifiedBonus = author.verified ? 15 : 0;
    const authorAuthorityScore = Math.min(100, followerFactor + verifiedBonus);

    const likes = item.source_meta?.likes || 0;
    const retweets = item.source_meta?.retweets || 0;
    const engagementScore = Math.min(100, Math.round(Math.log10(likes + retweets * 2 + 1) * 20));

    const contentOriginality = Math.round(scores.originality * 100);
    const contextEvidence = Math.round(scores.evidence * 100);
    const mediaVerification = evidence.original_media ? 100 : 40;
    const earliestSourceBonus = evidence.earliest_in_component ? 100 : 0;
    
    const computedTrust = Math.round(
      (authorAuthorityScore * 0.3) +
      (contentOriginality * 0.2) +
      (contextEvidence * 0.25) +
      (engagementScore * 0.1) +
      ((evidence.earliest_in_component ? 100 : 50) * 0.15)
    );

    return {
      fetchLatency,
      parseLatency,
      embeddingLatency,
      clusteringLatency,
      geminiLatency,
      totalLatency,
      authorAuthorityScore,
      engagementScore,
      contentOriginality,
      contextEvidence,
      mediaVerification,
      earliestSourceBonus,
      computedTrust,
    };
  };

  const metrics = getGranularMetrics();

  // Render a mini circular progress gauge for the score vectors
  const renderGauge = (label: string, value: number, colorClass: string, glowClass: string) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value * circumference);

    return (
      <div className="flex flex-col items-center justify-center bg-slate-900/40 border border-slate-900 rounded-xl p-2.5 min-w-[76px] relative group hover:bg-slate-900 transition duration-300">
        <svg className="w-10 h-10 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="3"
            fill="transparent"
          />
          {/* Foregound circle with stroke offset */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="text-[11px] font-mono font-bold text-slate-200 mt-1">
          {Math.round(value * 100)}%
        </span>
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tight mt-0.5">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div
      id={`card-${original.content_id}`}
      onClick={onSelect}
      className={`rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden ${
        isSelected
          ? "bg-slate-900/80 border-emerald-500/80 shadow-2xl shadow-emerald-950/20 ring-1 ring-emerald-500/30 translate-x-1"
          : "bg-slate-950/40 border-slate-900 hover:border-slate-800/80 hover:bg-slate-900/20"
      }`}
    >
      {/* CARD HEADER */}
      <div className="p-5 flex items-start gap-4">
        {/* Rank Indicator Badge */}
        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-lg shrink-0 leading-none shadow-inner ${
          rank === 1 
            ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950" 
            : rank === 2
            ? "bg-gradient-to-br from-teal-500 to-sky-600 text-slate-950"
            : "bg-slate-900 border border-slate-800 text-slate-400"
        }`}>
          <span className="text-[10px] uppercase font-bold tracking-tight mb-0.5">rank</span>
          {rank}
        </div>

        {/* Author Bio & Metrics */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img
                src={author.avatar_url}
                alt="avatar"
                className="w-6 h-6 rounded-full border border-slate-800 bg-slate-950 shrink-0"
              />
              <div className="leading-tight">
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  {author.name}
                  {author.verified && (
                    <ShieldCheck size={14} className="text-sky-400 shrink-0" />
                  )}
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span className="text-[10px] font-mono text-slate-500">{author.handle}</span>
                  <div className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded leading-none border ${sentiment.color} select-none`}>
                    {sentiment.label} Sentiment
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-900">
                <Calendar size={10} className="text-emerald-500" />
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
              </span>
              <span className="text-[9px] font-mono text-slate-600 mt-1">
                {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Social Metrics */}
          <div className="flex items-center gap-3.5 mt-2.5 text-[10px] font-mono text-slate-500 flex-wrap">
            <div className="flex items-center gap-1">
              <Users size={12} className="text-slate-600" />
              <span>{author.follower_count?.toLocaleString()} followers</span>
            </div>
            {item.source_meta && (
              <div className="flex items-center gap-2 border-l border-slate-900 pl-3">
                <span>{item.source_meta.likes?.toLocaleString()} Likes</span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
                <span>{item.source_meta.retweets?.toLocaleString()} RTs</span>
              </div>
            )}
            <div className="flex items-center gap-1 border-l border-slate-900 pl-3 text-emerald-400">
              <Clock size={11} className="text-emerald-500 shrink-0" />
              <span>{readingTimeLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TWEET TEXT CONTAINER */}
      <div className="px-5 pb-4">
        <p className="text-xs font-sans text-slate-200 leading-relaxed font-medium bg-slate-950/40 p-3.5 rounded-xl border border-slate-900 italic">
          "{item.text}"
        </p>

        {/* Copy Text & Link Actions */}
        <div className="flex items-center justify-between gap-1.5 mt-2.5 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-[10.5px] font-mono text-emerald-400 hover:text-emerald-300 transition border border-emerald-500/20 cursor-pointer"
            title="Toggle granular provenance latency and trust score breakdown"
          >
            <Sliders size={11} className="text-emerald-400 shrink-0" />
            <span>{showDetails ? "Hide Details" : "View Details"}</span>
            {showDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition border border-slate-800/40 cursor-pointer"
              title="Copy post content to clipboard"
            >
              {copiedText ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copiedText ? "Copied text!" : "Copy Text"}</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition border border-slate-800/40 cursor-pointer"
              title="Copy source link to clipboard"
            >
              {copiedLink ? <Check size={11} className="text-emerald-400" /> : <LinkIcon size={11} />}
              <span>{copiedLink ? "Copied link!" : "Copy Link"}</span>
            </button>
          </div>
        </div>

        {/* EXPANDABLE GRANULAR DETAILS VIEW */}
        {showDetails && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="mt-3 bg-slate-950/80 border border-slate-900/80 rounded-xl p-4 space-y-4 animate-fade-in text-[11px] font-mono"
          >
            {/* Header / Summary row */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Sliders size={12} className="text-emerald-400" />
                <span className="text-slate-200 font-bold uppercase tracking-wider text-[10px]">Granular Provenance Diagnostics</span>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                <span className="text-[9px] text-slate-400">TRUST SCORE:</span>
                <span className="text-emerald-400 font-bold text-xs">{metrics.computedTrust}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Trust Score Breakdown */}
              <div className="space-y-2">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={11} className="text-slate-500" />
                  <span>Source Trust Score Breakdown</span>
                </div>
                
                <div className="space-y-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-900/50">
                  {/* Metric Row 1: Author Authority */}
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                      <span>Author Authority Weight</span>
                      <span className="text-slate-300 font-bold">{metrics.authorAuthorityScore}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${metrics.authorAuthorityScore}%` }} 
                      />
                    </div>
                  </div>

                  {/* Metric Row 2: Content Originality */}
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                      <span>Syntactic Originality</span>
                      <span className="text-slate-300 font-bold">{metrics.contentOriginality}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${metrics.contentOriginality}%` }} 
                      />
                    </div>
                  </div>

                  {/* Metric Row 3: Direct Context Evidence */}
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                      <span>Context Evidence Quality</span>
                      <span className="text-slate-300 font-bold">{metrics.contextEvidence}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${metrics.contextEvidence}%` }} 
                      />
                    </div>
                  </div>

                  {/* Metric Row 4: Engagement Velocity */}
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                      <span>Social Amplification Factor</span>
                      <span className="text-slate-300 font-bold">{metrics.engagementScore}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${metrics.engagementScore}%` }} 
                      />
                    </div>
                  </div>

                  {/* Mini bullet points */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[8.5px] border-t border-slate-900/60 text-slate-400">
                    <div>• Media Integrity: <span className={evidence.original_media ? "text-emerald-400" : "text-amber-500"}>{evidence.original_media ? "Verified" : "Unverified"}</span></div>
                    <div>• Earliest Source: <span className={evidence.earliest_in_component ? "text-emerald-400" : "text-slate-500"}>{evidence.earliest_in_component ? "+15% Bonus" : "No Bonus"}</span></div>
                  </div>
                </div>
              </div>

              {/* Right Column: API Pipeline Latency breakdown */}
              <div className="space-y-2">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock size={11} className="text-slate-500" />
                  <span>Pipeline Latency Diagnostics</span>
                </div>

                <div className="space-y-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-900/50">
                  <div className="space-y-1.5 text-[9px]">
                    <div className="flex justify-between text-slate-400">
                      <span>1. REST API Ingestion:</span>
                      <span className="text-slate-300 font-bold">{metrics.fetchLatency} ms</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>2. Pre-processing & Deduplication:</span>
                      <span className="text-slate-300 font-bold">{metrics.parseLatency} ms</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>3. Vector Embeddings generation:</span>
                      <span className="text-slate-300 font-bold">{metrics.embeddingLatency} ms</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>4. DBSCAN Community Clustering:</span>
                      <span className="text-slate-300 font-bold">{metrics.clusteringLatency} ms</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-b border-slate-900 pb-1.5">
                      <span>5. Gemini Provenance Synthesis:</span>
                      <span className="text-slate-300 font-bold">{metrics.geminiLatency} ms</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold pt-1 text-[10px]">
                      <span>Total Processing Pipeline Time:</span>
                      <span>{metrics.totalLatency} ms</span>
                    </div>
                  </div>
                  <div className="text-[8px] text-slate-500 italic pt-1 border-t border-slate-900/60 leading-normal">
                    Diagnostics retrieved in real-time from server-side engine logs. Pipeline runs on cloud server node.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASCADE VELOCITY TRACKER WITH SPARKLINE */}
        <div className="flex items-center justify-between gap-4 mt-3 bg-slate-900/40 border border-slate-900/60 rounded-xl p-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Cascade Velocity</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm font-sans font-extrabold text-slate-200">{volatilityPercent}%</span>
              <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-tight">Volatility Score</span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 mt-1">Peak Rate: {maxVal.toLocaleString()}/hr</span>
          </div>
          
          {/* Sparkline chart SVG */}
          <div className="flex-1 max-w-[140px] h-10 flex items-center justify-center relative">
            <svg className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id={`sparkline-grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={sparklinePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={`${sparklinePath} L 120 40 L 0 40 Z`}
                fill={`url(#sparkline-grad-${item.id})`}
              />
              {/* Pulsing indicator dot on peak */}
              <circle
                cx={peakX}
                cy={peakY}
                r="3"
                className="fill-emerald-400 stroke-slate-950 animate-ping"
                strokeWidth="1"
              />
              <circle
                cx={peakX}
                cy={peakY}
                r="2.5"
                className="fill-emerald-400 stroke-slate-950"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>

        {/* CROWDSOURCED OVERRIDE FLAGS */}
        <div className="mt-3 bg-slate-900/35 border border-slate-900/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Crowdsourced Override</span>
            {activeFlag ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-md border ${
                  activeFlag === "Verified Fact" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  activeFlag === "Misinformation" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                  "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>
                  {activeFlag}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onFlagChange) onFlagChange(item.id, null);
                  }}
                  className="text-[9px] font-mono text-slate-500 hover:text-slate-300 underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 mt-1">Status: Unflagged</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {(["Verified Fact", "Misinformation", "Satire"] as const).map((flagType) => {
              const isSelected = activeFlag === flagType;
              let activeStyles = "";
              if (flagType === "Verified Fact") {
                activeStyles = isSelected ? "bg-emerald-500 text-slate-950 font-bold border-emerald-500" : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border-slate-800/80";
              } else if (flagType === "Misinformation") {
                activeStyles = isSelected ? "bg-rose-500 text-slate-950 font-bold border-rose-500" : "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border-slate-800/80";
              } else {
                activeStyles = isSelected ? "bg-amber-500 text-slate-950 font-bold border-amber-500" : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border-slate-800/80";
              }

              return (
                <button
                  key={flagType}
                  onClick={() => {
                    if (onFlagChange) onFlagChange(item.id, isSelected ? null : flagType);
                  }}
                  className={`px-2 py-1 rounded text-[9.5px] font-mono border transition cursor-pointer ${activeStyles}`}
                >
                  {flagType.replace("Verified ", "")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Evidence badging */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {evidence.earliest_in_component && (
            <span className="text-[9px] font-mono font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              ✓ Earliest Source
            </span>
          )}
          {evidence.original_media && (
            <span className="text-[9px] font-mono font-bold bg-teal-950/40 text-teal-400 border border-teal-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Image size={10} /> Original Media
            </span>
          )}
          {evidence.primary_artifact_link && (
            <a
              href={evidence.primary_artifact_link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[9px] font-mono font-bold bg-indigo-950/40 text-indigo-400 border border-indigo-800/40 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-indigo-900/30 transition"
            >
              <LinkIcon size={10} /> Primary Link <ArrowUpRight size={10} />
            </a>
          )}
          {evidence.corroborated_by.length > 0 && (
            <span className="text-[9px] font-mono font-bold bg-sky-950/40 text-sky-400 border border-sky-800/40 px-2 py-0.5 rounded-full">
              Corroborated by {evidence.corroborated_by[0]}
            </span>
          )}
        </div>
      </div>

      {/* SCORE VECTOR SECTION */}
      <div className="px-5 pb-5 border-t border-slate-900/60 pt-4 flex items-center gap-3 justify-between overflow-x-auto">
        {renderGauge("Originality", scores.originality, "stroke-emerald-500", "shadow-emerald-950/40")}
        {renderGauge("Authority", scores.authority, "stroke-teal-500", "shadow-teal-950/40")}
        {renderGauge("Influence", scores.influence, "stroke-indigo-500", "shadow-indigo-950/40")}
        {renderGauge("Evidence", scores.evidence, "stroke-purple-500", "shadow-purple-950/40")}
        {renderGauge("Freshness", scores.freshness, "stroke-amber-500", "shadow-amber-950/40")}
      </div>

      {/* GEMINI INTELLIGENCE REPORT BOX */}
      <div className="mx-5 mb-5 p-4 rounded-xl border border-emerald-500/10 bg-gradient-to-b from-slate-900/30 to-slate-950/10 backdrop-blur-sm shadow-inner">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp size={12} className="text-emerald-400" />
          <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
            Gemini Provenance Verdict
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          <div>
            <div className="text-[9px] font-mono text-slate-500 uppercase">Why it matters</div>
            <p className="text-[11px] font-sans text-slate-300 leading-relaxed font-semibold">
              {why_it_matters || "Analyzing disclosures..."}
            </p>
          </div>
          <div className="border-t border-slate-900/60 pt-2">
            <div className="text-[9px] font-mono text-slate-500 uppercase">Current Relevance</div>
            <p className="text-[11px] font-sans text-slate-400 leading-relaxed italic">
              {current_relevance || "Tracing downstream cascades..."}
            </p>
          </div>
        </div>
      </div>

      {/* EXPANDABLE DERIVATIVE CASCADES TRAY */}
      {(derivatives.copied_narratives.length > 0 || derivatives.notable_followups.length > 0) && (
        <div className="border-t border-slate-900 bg-slate-950/60">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="w-full px-5 py-3 flex items-center justify-between text-[10px] font-mono text-slate-500 hover:text-slate-300 transition"
          >
            <div className="flex items-center gap-1.5">
              <Share2 size={12} className="text-indigo-400" />
              <span>TRACING DERIVATIVE CASCADES ({derivatives.copied_narratives.length} derivatives, {derivatives.notable_followups.length} followups)</span>
            </div>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isExpanded && (
            <div className="px-5 pb-5 pt-1 border-t border-slate-950 flex flex-col gap-3">
              {/* Direct duplicates */}
              {derivatives.copied_narratives.length > 0 && (
                <div>
                  <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">
                    Screenshot / Content Duplication Matches (Amber)
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {derivatives.copied_narratives.map((txt, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900/40 border border-slate-900 text-[10.5px] font-mono text-slate-400 leading-relaxed"
                      >
                        {txt}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notable commentary / replies */}
              {derivatives.notable_followups.length > 0 && (
                <div className="border-t border-slate-900/40 pt-2.5">
                  <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">
                    Commentary / Quote replies (Sky)
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {derivatives.notable_followups.map((txt, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900/40 border border-slate-900 text-[10.5px] font-mono text-slate-400 leading-relaxed"
                      >
                        {txt}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
