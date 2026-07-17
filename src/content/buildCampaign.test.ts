import { describe, expect, it } from "vitest";
import type { FounderInsight } from "../types";
import { buildContentCampaign } from "./buildCampaign";
import { validateCampaignRequest } from "./validateCampaignRequest";
import { filterExportableAssets, reviewAsset } from "./qualityGate";
import { buildCampaignMarkdown } from "./exportCampaign";

const insight: FounderInsight = {
  id: "insight_post_1a",
  sourceOriginalId: "post_1a",
  topic: "AI Coding Assistants",
  claim:
    "Announcing Core v2.0 with safer edge bounds and open docs for teams shipping agents.",
  whyItMatters:
    "Founders tracking infrastructure releases need the first credible notice.",
  evidenceLinks: [
    { title: "Repo", uri: "https://github.com/dev/example" },
  ],
  sourceUrl: "https://github.com/dev/example",
  authority: 0.8,
  originality: 0.9,
  freshness: 0.85,
  audience: "INDIAN_ENGLISH",
  isSimulatedSource: true,
  authorHandle: "@announcer_tech",
};

describe("campaign generation", () => {
  it("builds brief + multi-channel assets with reviews (fallback path)", () => {
    const campaign = buildContentCampaign({
      insight,
      objective: "TRUST",
      channels: ["X", "LINKEDIN"],
      is_fallback: true,
    });

    expect(campaign.brief.insightId).toBe(insight.id);
    expect(campaign.brief.objective).toBe("TRUST");
    expect(campaign.assets).toHaveLength(2);
    expect(campaign.reviews).toHaveLength(2);
    expect(campaign.assets[0].draft).toContain("Core v2.0");
    expect(campaign.assets.every((a) => a.status === "DRAFT")).toBe(true);
    // simulated label expected in drafts
    expect(
      campaign.assets.some((a) => /simulat|fallback|sample/i.test(a.draft))
    ).toBe(true);
  });

  it("rejects invalid API payloads", () => {
    const bad = validateCampaignRequest({ objective: "TRUST" });
    expect(bad.ok).toBe(false);
    if (bad.ok === false) {
      expect(bad.error.code).toBe("VALIDATION");
    }

    const good = validateCampaignRequest({
      insight,
      objective: "AWARENESS",
      channels: ["X", "LINKEDIN"],
    });
    expect(good.ok).toBe(true);
  });

  it("blocks approved export when review says REVISE", () => {
    const campaign = buildContentCampaign({
      insight,
      objective: "LEADS",
      channels: ["X"],
    });
    const asset = {
      ...campaign.assets[0],
      draft: "Buy now!!! revolutionary synergy guaranteed https://evil.example/spam",
      status: "APPROVED" as const,
    };
    const review = reviewAsset(asset, insight, campaign.brief);
    expect(review.recommendation).toBe("REVISE");
    expect(review.risks.length).toBeGreaterThan(0);
    const exportable = filterExportableAssets([asset], [review]);
    expect(exportable).toHaveLength(0);
  });

  it("exports markdown for approved gate-passing assets", () => {
    const campaign = buildContentCampaign({
      insight,
      objective: "AWARENESS",
      channels: ["LINKEDIN"],
    });
    const assets = campaign.assets.map((a) => ({
      ...a,
      status: "APPROVED" as const,
    }));
    const md = buildCampaignMarkdown({
      insight,
      brief: campaign.brief,
      assets,
      reviews: campaign.reviews,
      onlyApproved: true,
    });
    expect(md).toContain("Content campaign export");
    expect(md).toContain("LINKEDIN");
  });
});
