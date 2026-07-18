# Architecture: Signal Radar + Founder Content OS

**Last updated:** 2026-07-18 · **V1 status:** implemented and shipped on `main`

## Product split

| Layer | Role | Status |
|-------|------|--------|
| **Signal Radar (KSE)** | X-oriented intelligence: simulate/fallback collect, rank, evidence, verify | ✅ Lab |
| **Founder Content OS** | One ranked original → multi-platform **draft** assets (no publish) | ✅ Lab |

## Data flow

```text
KSERunResult
  → selected OriginalSource
  → FounderInsight                 // pure mapper (mapInsight.ts)
  → POST /api/content/campaigns
  → CampaignBrief                  // Gemini or deterministic fallback
  → ChannelAsset[]                 // 9 channel adapters
  → ContentQualityReview[]         // blocking gate (live re-score in UI)
  → Approve
  → Export Markdown / JSON
  → Optional: browser localStorage history (max 12)
```

## Portal views

| Group | Views |
|-------|--------|
| Analyze | Command · Sources · Cascade · Noise |
| Quality | Verify · Weights |
| Create | Studio |
| Ops | Watchlist |

Entry: landing → `#portal`. Sources exposes **Create content in Studio**. Command Jump desk links Studio.

## Modules

| Path | Responsibility |
|------|----------------|
| `src/types.ts` | KSE + Content OS domain contracts |
| `src/content/mapInsight.ts` | `OriginalSource` → `FounderInsight` |
| `src/content/voice.ts` | Indian-English founder voice rules + CTAs |
| `src/content/textUtils.ts` | URL-safe clip / short claim / dedupe |
| `src/content/generateBrief.ts` | Brief prompt + fallback brief |
| `src/content/generateAssets.ts` | Per-channel draft adapters |
| `src/content/qualityGate.ts` | Evidence / voice / platform / clarity |
| `src/content/exportCampaign.ts` | Markdown + JSON builders + download helper |
| `src/content/buildCampaign.ts` | Orchestration (API + tests) |
| `src/content/validateCampaignRequest.ts` | API boundary validation |
| `src/content/campaignHistory.ts` | Browser localStorage history |
| `server.ts` | `POST /api/kse/*` + `POST /api/content/campaigns` |
| `src/views/ContentStudioView.tsx` | Content Studio UI |
| `src/views/SourcesView.tsx` | Ranked sources + Studio CTA |
| `src/layout/AppShell.tsx` | Nav shell including Studio |
| `src/landing/LandingPage.tsx` | Marketing (8 views incl. Studio) |

## Channels (V1)

`X` · `LINKEDIN` · `INSTAGRAM_POST` · `INSTAGRAM_CAROUSEL` · `INSTAGRAM_REEL` · `WHATSAPP` · `FACEBOOK` · `YOUTUBE_SHORT` · `YOUTUBE_VIDEO`

## Safety rules

1. Never claim live X API when `is_fallback` / `isSimulatedSource` is true.  
2. Never invent evidence URLs; only pass through known citations.  
3. Assets stay drafts until quality gate allows **APPROVE** and the user approves.  
4. Export packages only include approved, gate-passing assets.  
5. No auto-publish; no stored social credentials.  
6. Do not commit secrets (`.env*` gitignored; `.env.example` only).

## Fallback behavior

| Condition | Behavior |
|-----------|----------|
| No `GEMINI_API_KEY` | KSE offline dataset + Content OS deterministic brief/assets |
| Gemini 429 / quota | Circuit-breaker; same fallback paths |
| Invalid campaign body | `400` + `code: VALIDATION` |

## Deferred

Live multi-network ingestion · publishing OAuth · Hinglish · multi-tenant auth/billing · cloud campaign sync · CI browser E2E.

See `HANDOFF.md` for operational detail and `Implementation Plan.md` for original V1 acceptance.
