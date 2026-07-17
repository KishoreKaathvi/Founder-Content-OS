# Architecture: Signal Radar + Founder Content OS

## Product split

| Layer | Role |
|-------|------|
| **Signal Radar** | X-only intelligence: collect (or simulate), rank, evidence, verify |
| **Founder Content OS** | Turn one ranked original into multi-platform draft assets (no publish) |

## Data flow

```text
KSERunResult
  → selected OriginalSource
  → FounderInsight          (pure client/server mapper)
  → CampaignBrief           (Gemini or deterministic fallback)
  → ChannelAsset[]          (channel adapters)
  → ContentQualityReview[]  (blocking gate)
  → approved exports (Markdown / JSON)
```

## Modules

| Path | Responsibility |
|------|----------------|
| `src/types.ts` | Shared domain contracts |
| `src/content/mapInsight.ts` | `OriginalSource` → `FounderInsight` |
| `src/content/generateBrief.ts` | Brief prompts + fallback brief |
| `src/content/generateAssets.ts` | Per-channel draft adapters |
| `src/content/qualityGate.ts` | Evidence / voice / platform scores |
| `src/content/exportCampaign.ts` | Markdown + JSON export builders |
| `server.ts` `POST /api/content/campaigns` | API boundary + Gemini |
| `src/views/ContentStudioView.tsx` | Portal UI |

## Safety rules

1. Never claim live X API when `is_fallback` is true.
2. Never invent evidence URLs; only pass through known citations.
3. Assets stay `DRAFT` until quality gate recommends `APPROVE` and user approves.
4. Export of approved packages skips assets that fail the gate.

## Deferred

Live multi-network ingestion, publishing OAuth, Hinglish, multi-tenant auth/billing.
