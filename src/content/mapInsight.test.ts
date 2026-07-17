import { describe, expect, it } from "vitest";
import type { OriginalSource } from "../types";
import { toFounderInsight } from "./mapInsight";

function sampleOriginal(
  overrides: Partial<OriginalSource> & {
    item?: Partial<OriginalSource["item"]>;
    evidence?: Partial<OriginalSource["evidence"]>;
    scores?: Partial<OriginalSource["scores"]>;
  } = {}
): OriginalSource {
  const base: OriginalSource = {
    rank: 1,
    content_id: "post_1a",
    item: {
      id: "post_1a",
      source: "x",
      source_native_id: "123456",
      author_id: "auth_1",
      created_at: new Date().toISOString(),
      text: "Announcing Core v2.0 with safer edge bounds and open docs.",
      urls: ["https://github.com/dev/example"],
      media_hashes: [],
      mentioned_authors: [],
      parent_id: null,
      quoted_id: null,
      entities: ["Core v2"],
    },
    author: {
      id: "auth_1",
      source: "x",
      handle: "@announcer_tech",
      name: "Alpha Dev",
      verified: true,
      follower_count: 1000,
    },
    why_it_matters: "Founders tracking infrastructure releases need the first notice.",
    current_relevance: "Still the earliest public note in the cascade.",
    source_fitness: 0.9,
    derivative_score: 0.1,
    scores: {
      originality: 0.9,
      authority: 0.8,
      influence: 0.7,
      evidence: 0.75,
      freshness: 0.85,
      community_validation: null,
    },
    evidence: {
      earliest_in_component: true,
      original_media: true,
      corroborated_by: ["https://example.com/corroboration"],
      primary_artifact_link: "https://github.com/dev/example",
    },
    derivatives: { copied_narratives: [], notable_followups: [] },
  };

  return {
    ...base,
    ...overrides,
    item: { ...base.item, ...overrides.item },
    evidence: { ...base.evidence, ...overrides.evidence },
    scores: { ...base.scores, ...overrides.scores },
    author: overrides.author || base.author,
  };
}

describe("toFounderInsight", () => {
  it("maps a complete original with provenance and evidence", () => {
    const original = sampleOriginal();
    const insight = toFounderInsight(original, {
      topic: "AI Coding Assistants",
      verificationSources: [
        { title: "Docs", uri: "https://docs.example.com/v2" },
      ],
      isFallback: false,
    });

    expect(insight.sourceOriginalId).toBe("post_1a");
    expect(insight.claim).toContain("Core v2.0");
    expect(insight.topic).toBe("AI Coding Assistants");
    expect(insight.audience).toBe("INDIAN_ENGLISH");
    expect(insight.sourceUrl).toBe("https://github.com/dev/example");
    expect(insight.authority).toBe(0.8);
    expect(insight.originality).toBe(0.9);
    expect(insight.freshness).toBe(0.85);
    expect(insight.isSimulatedSource).toBe(false);
    expect(insight.evidenceLinks.map((e) => e.uri)).toEqual(
      expect.arrayContaining([
        "https://github.com/dev/example",
        "https://example.com/corroboration",
        "https://docs.example.com/v2",
      ])
    );
  });

  it("handles missing evidence without dropping the claim", () => {
    const original = sampleOriginal();
    original.item = {
      ...original.item,
      urls: [],
      text: "Bare claim with no links.",
    };
    original.evidence = {
      earliest_in_component: true,
      original_media: false,
      corroborated_by: [],
      primary_artifact_link: undefined,
    };
    const insight = toFounderInsight(original, { topic: "Test" });
    expect(insight.claim).toBe("Bare claim with no links.");
    expect(insight.evidenceLinks).toEqual([]);
    expect(insight.sourceUrl).toBe(
      "https://x.com/announcer_tech/status/123456"
    );
  });

  it("labels fallback/simulated origin", () => {
    const insight = toFounderInsight(sampleOriginal(), {
      isFallback: true,
      topic: "Sim topic",
    });
    expect(insight.isSimulatedSource).toBe(true);
  });
});
