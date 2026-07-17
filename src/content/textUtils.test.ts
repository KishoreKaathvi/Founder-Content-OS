import { describe, expect, it } from "vitest";
import {
  clipWithEllipsis,
  dedupeLines,
  safeClip,
  shortClaim,
  stripUrls,
} from "./textUtils";
import { buildFallbackBrief } from "./generateBrief";
import type { FounderInsight } from "../types";
import { generateChannelAssets } from "./generateAssets";

const insight: FounderInsight = {
  id: "insight_x",
  sourceOriginalId: "post_x",
  topic: "Agent evals",
  claim:
    "We shipped agent eval harnesses that catch silent tool failures before customers do. https://github.com/example/eval-harness",
  whyItMatters: "Founders need early failure signals before production trust breaks.",
  evidenceLinks: [
    { title: "Repo", uri: "https://github.com/example/eval-harness" },
  ],
  sourceUrl: "https://github.com/example/eval-harness",
  authority: 0.8,
  originality: 0.9,
  freshness: 0.85,
  audience: "INDIAN_ENGLISH",
  isSimulatedSource: true,
  authorHandle: "@founder_ops",
};

describe("textUtils", () => {
  it("strips urls and shortClaim never leaves mid-url", () => {
    expect(stripUrls(insight.claim)).not.toMatch(/https?:/);
    const s = shortClaim(insight.claim, 80);
    expect(s).not.toMatch(/https?:\/\/\S*$/);
    expect(s.length).toBeLessThanOrEqual(80);
  });

  it("safeClip cuts before http when needed", () => {
    const t =
      "Hello world with a long prefix then a link https://example.com/path/to/thing";
    const c = safeClip(t, 50);
    expect(c).not.toMatch(/https?:\/\/\w+$/);
  });

  it("dedupeLines drops claim-like duplicates", () => {
    const d = dedupeLines(
      [
        insight.claim,
        "Founders need early failure signals before production trust breaks.",
        "Founders need early failure signals before production trust breaks.",
      ],
      insight.claim
    );
    expect(d.length).toBe(1);
  });

  it("clipWithEllipsis adds ellipsis without orphan url fragment", () => {
    const c = clipWithEllipsis(insight.claim, 60);
    expect(c.endsWith("…")).toBe(true);
    expect(c).not.toMatch(/https?:\/\/\S+$/);
  });
});

describe("fallback brief + assets polish", () => {
  it("builds a short angle that is not a raw claim paste", () => {
    const brief = buildFallbackBrief({
      insight,
      objective: "TRUST",
      founderContext: "B2B agent tools for India",
    });
    expect(brief.coreAngle.length).toBeLessThan(220);
    expect(brief.coreAngle.toLowerCase()).toContain("agent evals");
    // angle should not be "objective: full claim" dump
    expect(brief.coreAngle.startsWith("Build credibility")).toBe(false);
    expect(brief.proofPoints.length).toBeGreaterThan(1);
  });

  it("LinkedIn draft does not triple-paste the full claim as angle+claim+proof", () => {
    const brief = buildFallbackBrief({ insight, objective: "LEADS" });
    const assets = generateChannelAssets(brief, insight, ["LINKEDIN", "X"]);
    const li = assets.find((a) => a.channel === "LINKEDIN")!;
    const occurrences = li.draft.split("silent tool failures").length - 1;
    expect(occurrences).toBeLessThanOrEqual(2);
    expect(li.draft).toMatch(/Source:/);
    const x = assets.find((a) => a.channel === "X")!;
    expect(x.draft.length).toBeLessThan(400);
  });
});
