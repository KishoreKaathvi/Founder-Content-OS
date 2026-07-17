# Founder Content OS — Execution Plan

Source of truth: `Implementation Plan.md`

## Slices

| Slice | Phase | Deliverable | Status |
|-------|-------|-------------|--------|
| 0 | Phase 0 | Git branch, tasks/docs, test runner, scripts | Done |
| 1 | Phase 1 | `FounderInsight` contracts + `OriginalSource` mapper + tests | Done |
| 2 | Phase 2–4 | Campaign API, multi-channel assets, quality gate, export | Done |
| 3 | Phase 5 | Content Studio UI in portal | Done |
| 4 | Phase 6 | Full path verification; commit + push | Done |

## Architecture (V1)

```text
KSERunResult.originals
  -> toFounderInsight(OriginalSource)
  -> POST /api/content/campaigns
  -> CampaignBrief + ChannelAsset[] + ContentQualityReview[]
  -> Content Studio (edit / approve / export MD+JSON)
```

## Constraints

- No auto-publish
- Indian-fluent English only
- Evidence-bound drafts; quality gate blocks weak approval/export
- Simulated/fallback Signal Radar data must stay labelled
- No secrets committed
