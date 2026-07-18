# X-KES — Knowledge Signal Engine + Founder Content OS

Full-stack **TypeScript** lab (Express + React/Vite) that:

1. **Signal Radar (KSE)** — ranks ≤10 high-signal “originals” for a topic (graph-first provenance).  
2. **Founder Content OS** — turns one ranked original into multi-platform **editable drafts** (Content Studio).

> **Honest scope:** Algorithm + UX **prototype**. Stage ① candidates are **Gemini simulation** or a **local fallback** — **not** live X API. Content Studio **exports** drafts only; **no auto-publish**.

| | |
|---|---|
| **Repos** | [X-KES-App-July26](https://github.com/KishoreKaathvi/X-KES-App-July26) · [Founder-Content-OS](https://github.com/KishoreKaathvi/Founder-Content-OS) |
| **Default branch** | `main` (tip includes Content OS V1 + polish) |
| **Stack** | Node.js, TypeScript, Express, React 19, Vite 6, Tailwind CSS 4, `@google/genai` |
| **Local URL** | http://localhost:3000 · Portal: `#portal` |
| **V1 status** | **Complete** (2026-07-18) — real-user E2E verified; lab confidence ~83% |

---

## Product systems

| System | Job | Status |
|--------|-----|--------|
| **Knowledge Signal Engine** | Topic → candidates → noise → graph → rank ≤10 + verify/export | ✅ Shipped (simulated/fallback data) |
| **Founder Content OS** | Original → insight → brief → 9 channel drafts → quality gate → export | ✅ Shipped (Content Studio + API) |
| **Capture & Context Pipeline** | Bookmark/like → media → taxonomy → archive | 📄 Spec only — `X_-_Capture_and_Context_Pipeline_11Jul26.md` |

---

## Documentation map

| Doc | Use when |
|-----|----------|
| **`HANDOFF.md`** | **Start here** — current state, APIs, modules, E2E, gaps, runbook |
| **`Implementation Plan.md`** | Founder Content OS V1 requirements + phase checklist (implementation status at top) |
| **`docs/architecture.md`** | Content OS module map + safety rules |
| **`docs/ATTRIBUTION.md`** | Taste Skill / Social Media Skills pattern credits |
| **`tasks/plan.md`** · **`tasks/todo.md`** | Execution tracker |
| **`X - Knowledge Signal Engine 10Jul26.md`** | KSE product SSOT + ranking theory + **§0b codebase reality** |
| **`X_-_Capture_and_Context_Pipeline_11Jul26.md`** | Companion system (not coded) |

---

## Features (what ships today)

### Portal (8 views)

| Group | Views |
|-------|--------|
| Analyze | Command · Sources · Cascade · Noise |
| Quality | Verify · Weights |
| Create | **Studio** (Founder Content OS) |
| Ops | Watchlist |

Also: landing page, collapsible nav (Ctrl/Cmd+B), Light/Dark/System theme, Sources **Create content in Studio**, Jump desk → Studio, campaign **localStorage** history (max 12).

### Signal Radar

Noise filter → edges (quote/reply/same_url/same_image_hash/semantic_sim) → DSU components → `source_fitness` → multi-signal scores → report/grounding → JSON/TXT/PDF export.

### Content Studio path

```text
Ranked OriginalSource
  → FounderInsight
  → POST /api/content/campaigns
  → CampaignBrief + ChannelAsset[9] + ContentQualityReview[]
  → edit · live re-score · Approve
  → Markdown / JSON export (approved + gate-pass only)
```

**Channels:** X · LinkedIn · IG Post · IG Carousel · IG Reel · WhatsApp · Facebook · YouTube Short · YouTube Video.

---

## Quick start

### Prerequisites

- Node.js **20+** (or 18+)
- Optional: `GEMINI_API_KEY` (without it, KSE + Content OS use **deterministic fallback**)

### Install & run

```bash
npm install
cp .env.example .env   # optional: set GEMINI_API_KEY
npm run dev
```

Open http://localhost:3000 → **Enter lab** (or `#portal`).

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server (`tsx server.ts` + Vite) |
| `npm run build` | Production client + `dist/server.cjs` |
| `npm start` | Run production server |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Vitest (13 tests: mapper, campaign, quality, text utils) |

**Windows:** If the folder path contains `&`, prefer:

```bash
node ./node_modules/vitest/vitest.mjs run
node ./node_modules/typescript/bin/tsc --noEmit
```

---

## Project layout

```text
├─ server.ts                      # KSE pipeline + content campaign API
├─ src/
│  ├─ types.ts                    # KSE + Content OS contracts
│  ├─ content/                    # Pure Content OS modules
│  │  ├─ mapInsight.ts
│  │  ├─ generateBrief.ts · generateAssets.ts
│  │  ├─ qualityGate.ts · exportCampaign.ts
│  │  ├─ buildCampaign.ts · validateCampaignRequest.ts
│  │  ├─ campaignHistory.ts · textUtils.ts · voice.ts
│  │  └─ *.test.ts
│  ├─ views/                      # Command, Sources, Graph, Noise, Verify, Tuning, ContentStudio, Alerts
│  ├─ layout/AppShell.tsx
│  ├─ landing/LandingPage.tsx
│  └─ hooks/useKseAnalysis.ts
├─ Implementation Plan.md
├─ HANDOFF.md
├─ docs/
├─ tasks/
├─ vitest.config.ts
└─ package.json
```

---

## API

### `POST /api/kse/run`

Full analysis for a topic.

```json
{
  "topic": "AI Coding Assistants",
  "provenanceWeights": { "w_time": 0.45, "w_auth": 0.25, "w_infl": 0.20, "w_deriv": 0.35 },
  "presentationWeights": { "alpha": 0.35, "beta": 0.20, "gamma": 0.25, "delta": 0.15, "epsilon": 0.05, "zeta": 0.0 }
}
```

### `POST /api/kse/recalculate`

Re-rank from cache / offline path without full LLM re-ingest when possible.

### `POST /api/content/campaigns`

```json
{
  "insight": { "/* FounderInsight */": true },
  "objective": "AWARENESS | TRUST | LEADS",
  "founderContext": "optional",
  "channels": ["X", "LINKEDIN"]
}
```

Returns `{ id, brief, assets, reviews, is_fallback, createdAt }`.  
Validation failures: `{ error, code: "VALIDATION", details: string[] }`.

---

## Verification snapshot (2026-07-18)

| Check | Result |
|-------|--------|
| Unit tests | 13/13 pass |
| Typecheck | pass |
| Real-user browser E2E | Landing → KSE → Sources/Studio → generate → approve → export |
| npm audit | 0 known vulns (at last check) |
| Confidence (lab) | ~83% — ship with conditions for public multi-tenant |

Details: `HANDOFF.md`.

---

## What this is not (yet)

| Item | Status |
|------|--------|
| Live X / Twitter collection | ❌ Deferred |
| Auto-publish / OAuth to socials | ❌ Out of V1 |
| Capture & Context Pipeline code | ❌ Spec only |
| Multi-tenant auth / billing | ❌ Deferred |
| Hinglish / regional languages | ❌ Deferred |
| CI browser E2E suite | ❌ Unit-only in CI |
| Public unmetered deployment hardening | ⚠️ Rate limits / auth not productized |

---

## License

Apache-2.0 (see source headers where present).
