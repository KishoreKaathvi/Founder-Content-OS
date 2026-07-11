/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ContentItem, Edge, Author } from "../types";
import { ZoomIn, ZoomOut, Maximize2, Share2, HelpCircle } from "lucide-react";
import Tooltip from "./Tooltip";

interface RelationshipGraphProps {
  items: ContentItem[];
  edges: Edge[];
  authors: Record<string, Author>;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  originalIds: string[];
  searchQuery?: string;
}

interface SimulatedNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  item: ContentItem;
  author?: Author;
  isOriginal: boolean;
}

interface SimulatedLink {
  source: string;
  target: string;
  kind: string;
}

export default function RelationshipGraph({
  items,
  edges,
  authors,
  selectedNodeId,
  onSelectNode,
  originalIds,
  searchQuery = "",
}: RelationshipGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const panStart = useRef({ x: 0, y: 0 });
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingHoveredNodeId = useRef<string | null>(null);

  // Clean up hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  const getNodeSentiment = (text: string) => {
    const q = text.toLowerCase();
    const posWords = [
      "announce", "release", "mastering", "tutorial", "great", "awesome", "huge", 
      "exciting", "excited", "beat", "save", "appreciate", "love", "perfect", 
      "fast", "10x", "throughput", "improvement", "gain", "revolutionary", "official"
    ];
    
    const negWords = [
      "scam", "spam", "crypto", "suspicious", "leak", "skeptic", "critic", 
      "controversy", "suffer", "penalty", "latency", "expensive", "vulnerability", 
      "hack", "exploit", "threat", "bad", "poor", "issue", "broken", "disrupt", "fake"
    ];

    let posCount = 0;
    let negCount = 0;

    posWords.forEach(w => {
      if (q.includes(w)) posCount++;
    });

    negWords.forEach(w => {
      if (q.includes(w)) negCount++;
    });

    if (posCount > negCount) {
      return { label: "Positive", styles: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    } else if (negCount > posCount) {
      return { label: "Negative", styles: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
    }
    return { label: "Neutral", styles: "bg-slate-800 text-slate-400 border-slate-700/60" };
  };

  // Handle container resize following guidelines
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: width || 600,
          height: height || 400,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initialize and run force simulation
  const [simNodes, setSimNodes] = useState<SimulatedNode[]>([]);

  useEffect(() => {
    // Build initial node coordinates in a circle
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

    const initialNodes: SimulatedNode[] = items.map((item, index) => {
      const angle = (index / items.length) * 2 * Math.PI;
      const author = authors[item.author_id];
      const isOriginal = originalIds.includes(item.id);
      
      // Node size based on followers/authority
      const followers = author?.follower_count || 0;
      const baseRadius = isOriginal ? 12 : 8;
      const extraRadius = Math.min(8, Math.log10(followers + 1) * 1.2);

      return {
        id: item.id,
        x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 20,
        y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        radius: baseRadius + extraRadius,
        item,
        author,
        isOriginal,
      };
    });

    setSimNodes(initialNodes);
  }, [items, originalIds, authors, dimensions.width, dimensions.height]);

  // Run physics ticks
  useEffect(() => {
    if (simNodes.length === 0) return;

    let animationFrameId: number;
    const nodes = [...simNodes];

    // Find links between existing simulated nodes
    const links: SimulatedLink[] = edges
      .map((edge) => ({
        source: edge.src,
        target: edge.dst,
        kind: edge.kind,
      }))
      .filter((link) => 
        nodes.some((n) => n.id === link.source) && 
        nodes.some((n) => n.id === link.target)
      );

    const tick = () => {
      const k = 0.08; // Force strength
      const centerForce = 0.015;
      const repelForce = 320;
      const linkForceStrength = 0.045;

      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;

      // 1. Repel forces (all nodes push each other away)
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        if (nodeA.id === draggedNodeId) continue;

        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeB.x - nodeA.x || 0.1;
          const dy = nodeB.y - nodeA.y || 0.1;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          // Force inversely proportional to distance
          if (dist < 220) {
            const force = repelForce / (distSq + 20);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (nodeA.id !== draggedNodeId) {
              nodeA.vx -= fx;
              nodeA.vy -= fy;
            }
            if (nodeB.id !== draggedNodeId) {
              nodeB.vx += fx;
              nodeB.vy += fy;
            }
          }
        }

        // Center gravity pull
        nodeA.vx += (centerX - nodeA.x) * centerForce;
        nodeA.vy += (centerY - nodeA.y) * centerForce;
      }

      // 2. Link attraction forces (connected nodes pull together)
      links.forEach((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);

        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          const desiredDist = link.kind === "same_image_hash" || link.kind === "quote" ? 70 : 120;
          const force = (dist - desiredDist) * linkForceStrength;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (sourceNode.id !== draggedNodeId) {
            sourceNode.vx += fx;
            sourceNode.vy += fy;
          }
          if (targetNode.id !== draggedNodeId) {
            targetNode.vx -= fx;
            targetNode.vy -= fy;
          }
        }
      });

      // 3. Apply velocities & friction dampening
      nodes.forEach((node) => {
        if (node.id === draggedNodeId) return; // Skip moving nodes being dragged

        node.x += node.vx;
        node.y += node.vy;

        // Friction dampening
        node.vx *= 0.72;
        node.vy *= 0.72;

        // Keep in boundary bounds
        node.x = Math.max(node.radius, Math.min(dimensions.width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(dimensions.height - node.radius, node.y));
      });

      setSimNodes([...nodes]);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [simNodes, edges, draggedNodeId, dimensions.width, dimensions.height]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    // SVG coordinates accounting for zoom and pan
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgX = (clientX - pan.x) / zoom;
    const svgY = (clientY - pan.y) / zoom;

    // Find clicked node
    const clickedNode = simNodes.find((node) => {
      const dist = Math.sqrt((node.x - svgX) ** 2 + (node.y - svgY) ** 2);
      return dist <= node.radius + 8;
    });

    if (clickedNode) {
      setDraggedNodeId(clickedNode.id);
      onSelectNode(clickedNode.id);
    } else {
      // Start pan
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgX = (clientX - pan.x) / zoom;
    const svgY = (clientY - pan.y) / zoom;

    // Check hovered node for tooltips
    const hovered = simNodes.find((node) => {
      const dist = Math.sqrt((node.x - svgX) ** 2 + (node.y - svgY) ** 2);
      return dist <= node.radius + 6;
    });

    if (hovered) {
      if (hovered.id !== pendingHoveredNodeId.current) {
        pendingHoveredNodeId.current = hovered.id;
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => {
          setHoveredNodeId(hovered.id);
        }, 150) as any;
      }
    } else {
      pendingHoveredNodeId.current = null;
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      setHoveredNodeId(null);
    }

    if (draggedNodeId) {
      setSimNodes((prev) =>
        prev.map((node) =>
          node.id === draggedNodeId
            ? { ...node, x: svgX, y: svgY, vx: 0, vy: 0 }
            : node
        )
      );
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Build rendered links
  const renderedLinks = useMemo(() => {
    return edges
      .map((edge) => {
        const sourceNode = simNodes.find((n) => n.id === edge.src);
        const targetNode = simNodes.find((n) => n.id === edge.dst);

        if (!sourceNode || !targetNode) return null;

        let strokeColor = "stroke-slate-700/60";
        let strokeDash = "";
        let width = 1;

        if (edge.kind === "quote") {
          strokeColor = "stroke-emerald-500/85";
          strokeDash = "4 3";
          width = 1.8;
        } else if (edge.kind === "same_image_hash") {
          strokeColor = "stroke-amber-500/85";
          strokeDash = "2 2";
          width = 2.0;
        } else if (edge.kind === "reply") {
          strokeColor = "stroke-sky-500/80";
          strokeDash = "5 4";
          width = 1.2;
        } else if (edge.kind === "same_url" || edge.kind === "same_external_article") {
          strokeColor = "stroke-indigo-500/85";
          width = 1.6;
        } else if (edge.kind === "semantic_sim") {
          strokeColor = "stroke-purple-500/40";
          width = 0.8;
        }

        return (
          <g key={`${edge.src}-${edge.dst}-${edge.kind}`}>
            <line
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              className={`${strokeColor} transition-all duration-300`}
              strokeWidth={width}
              strokeDasharray={strokeDash}
            />
            {/* Direct arrow indicators for directed graphs */}
            {edge.directed && (
              <polygon
                points={`${targetNode.x},${targetNode.y - 4} ${targetNode.x - 4},${targetNode.y + 4} ${targetNode.x + 4},${targetNode.y + 4}`}
                transform={`rotate(${
                  (Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x) * 180) / Math.PI + 90
                }, ${targetNode.x}, ${targetNode.y}) scale(0.6)`}
                className={edge.kind === "same_image_hash" ? "fill-amber-500" : "fill-emerald-500"}
              />
            )}
          </g>
        );
      })
      .filter(Boolean);
  }, [edges, simNodes]);

  // Details of hovered node for rendering tooltips
  const hoveredNode = useMemo(() => {
    return simNodes.find((n) => n.id === hoveredNodeId);
  }, [simNodes, hoveredNodeId]);

  return (
    <div id="relationship-graph-container" className="relative flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800 backdrop-blur-md overflow-hidden">
      {/* Header controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-slate-400">provenance-graph-visualizer v1.0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip content="Zoom In (Increase graph size)">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <ZoomIn size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Zoom Out (Decrease graph size)">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <ZoomOut size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Reset view and recenter graph camera">
            <button
              onClick={handleResetZoom}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition px-1.5 cursor-pointer"
            >
              recenter
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Main SVG Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="absolute inset-0"
        >
          {/* Defined background grid */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Zoom/Pan Group wrapper */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Links layer */}
            {renderedLinks}

             {/* Nodes layer */}
             {simNodes.map((node) => {
               const isSelected = selectedNodeId === node.id;
               const isHovered = hoveredNodeId === node.id;

               // Compute search matches
               const isSearchMatch = (() => {
                 if (!searchQuery.trim()) return false;
                 const q = searchQuery.toLowerCase().trim();
                 return (
                   node.item.text.toLowerCase().includes(q) ||
                   (node.author?.name && node.author.name.toLowerCase().includes(q)) ||
                   (node.author?.handle && node.author.handle.toLowerCase().includes(q))
                 );
               })();

               const hasSearch = !!searchQuery.trim();
               const isDimmed = hasSearch && !isSearchMatch;
               
               let ringColor = "stroke-slate-700";
               let fillGradient = "fill-slate-800";
               let glowColor = "rgba(100, 116, 139, 0)";
 
               if (node.isOriginal) {
                 ringColor = isSelected ? "stroke-emerald-400" : "stroke-emerald-500/80";
                 fillGradient = "fill-emerald-950";
                 glowColor = isSelected ? "rgba(16, 185, 129, 0.45)" : "rgba(16, 185, 129, 0.15)";
               } else if (node.item.parent_id || node.item.quoted_id) {
                 // Secondary reply or quote
                 ringColor = isSelected ? "stroke-sky-400" : "stroke-sky-600/70";
                 fillGradient = "fill-sky-950/70";
               } else {
                 // Generic node
                 ringColor = isSelected ? "stroke-amber-400" : "stroke-slate-600/80";
                 fillGradient = "fill-slate-800/80";
               }
 
               return (
                 <g
                   key={node.id}
                   transform={`translate(${node.x}, ${node.y})`}
                   className="transition-all duration-300 ease-out"
                   style={{ opacity: isDimmed ? 0.25 : 1 }}
                 >
                   {/* Search Match target rotating dash ring */}
                   {isSearchMatch && (
                     <circle
                       r={node.radius + 10}
                       fill="transparent"
                       stroke="#10b981"
                       strokeWidth="2"
                       strokeDasharray="4,3"
                       className="animate-spin"
                       style={{ animationDuration: "12s" }}
                     />
                   )}

                   {/* Glow under originals */}
                   {node.isOriginal && (
                     <circle
                       r={node.radius + (isSelected ? 10 : 4)}
                       fill={glowColor}
                       className={node.isOriginal ? "animate-pulse" : ""}
                     />
                   )}

                  {/* Outer circle border ring */}
                  <circle
                    r={node.radius}
                    className={`${fillGradient} ${ringColor} cursor-pointer transition-all duration-300`}
                    strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                  />

                  {/* Tiny center accent */}
                  <circle
                    r={node.radius > 14 ? 3 : 2}
                    fill={node.isOriginal ? "#10b981" : "#94a3b8"}
                  />

                  {/* Handle Label */}
                  {(node.isOriginal || isSelected || isHovered) && (
                    <text
                      y={-node.radius - 8}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-slate-300 bg-slate-950 font-bold select-none pointer-events-none"
                    >
                      {node.author?.handle || "@unknown"}
                    </text>
                  )}

                  {/* Indicator Badge overlay for Original Rank */}
                  {node.isOriginal && (
                    <circle
                      cx={node.radius - 2}
                      cy={-node.radius + 2}
                      r={5}
                      fill="#10b981"
                      className="stroke-slate-900"
                      strokeWidth={1}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected or Hovered Tooltip Overlay */}
        {hoveredNode && (() => {
          const sentiment = getNodeSentiment(hoveredNode.item.text);
          return (
            <div
              className="absolute p-4 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl pointer-events-none max-w-[280px] sm:max-w-xs z-20 animate-fade-in text-slate-100 flex flex-col gap-3"
              style={{
                left: `${Math.min(dimensions.width - 290, Math.max(16, (hoveredNode.x * zoom) + pan.x + 12))}px`,
                top: `${Math.min(dimensions.height - 240, Math.max(16, (hoveredNode.y * zoom) + pan.y - 120))}px`,
              }}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <img
                    src={hoveredNode.author?.avatar_url}
                    alt="Avatar"
                    className="w-6 h-6 rounded-full border border-slate-800 bg-slate-900"
                  />
                  <div className="leading-tight">
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                      {hoveredNode.author?.name}
                      {hoveredNode.author?.verified && (
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 flex items-center justify-center text-[6px] text-white">✓</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">{hoveredNode.author?.handle}</div>
                  </div>
                </div>

                {/* Sentiment Badge */}
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border shrink-0 ${sentiment.styles}`}>
                  {sentiment.label}
                </span>
              </div>

              {/* Claim Summary Box */}
              <div className="flex flex-col gap-1">
                <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider">Claim Summary</span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans italic bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                  "{hoveredNode.item.text}"
                </p>
              </div>

              {/* Entities extracted if any */}
              {hoveredNode.item.entities && hoveredNode.item.entities.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  {hoveredNode.item.entities.slice(0, 3).map((entity, i) => (
                    <span key={i} className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800/40 text-slate-400">
                      #{entity}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-2 border-t border-slate-900 text-[9px] font-mono text-slate-500">
                <div>Created: <span className="text-slate-300">{new Date(hoveredNode.item.created_at).toLocaleTimeString()}</span></div>
                <div>Followers: <span className="text-slate-300">{hoveredNode.author?.follower_count?.toLocaleString()}</span></div>
                {hoveredNode.isOriginal ? (
                  <div className="col-span-2 text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Original Source Node
                  </div>
                ) : (
                  <div className="col-span-2 text-sky-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Derivative Node
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Legend overlay */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[10px] font-mono grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-950 border border-emerald-500" />
          <span>Original Node</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-950 border border-sky-600" />
          <span>Quote/Reply Node</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 border-t-2 border-dashed border-emerald-500" />
          <span>Quote relation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 border-t-2 border-dotted border-amber-500" />
          <span>Screenshot relation</span>
        </div>
      </div>
    </div>
  );
}
