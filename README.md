# Founder Content OS

A TypeScript lab monorepo that combines a **Knowledge Signal Engine (Signal Radar)** — topic → graph → provenance ranking of high-signal “original” posts — with a **Founder Content OS** that turns one ranked original into multi-platform **draft** content (no auto-publish).

## Status

**MVP / Experimental lab** — not production-ready.

| Layer | Status |
|-------|--------|
| Signal Radar (KSE) algorithms + multi-view portal | ✅ Working lab on **Gemini-simulated or local fallback** data |
| Founder Content OS V1 (Studio, 9 channels, quality gate, export) | ✅ Implemented (docs claim shipped 2026-07-18) |
| Live X API collection / real provenance on real posts | ❌ Not built |
| Capture & Context Pipeline (bookmarks → media → tags → store) | ❌ Spec only — zero code in this repo |
| Multi-tenant auth, billing, auto-publish | ❌ Deferred |

**Honest boundary:** this proves the ranking → insight → campaign loop on synthetic/LLM-simulated cascades. Do **not** treat it as a live X provenance product until Stage ① uses official/compliant X data.

---

## Tech stack

From `package.json` and runtime entry points:

| Layer | Choice |
|-------|--------|
| Language | TypeScript |
| Backend | Express (`server.ts` via `tsx`) |
| Frontend | React 19 + Vite 6 |
| Styling | Tailwind CSS 4 |
| LLM | Google Gemini (`@google/genai`) — optional |
| Tests | Vitest |
| Build | Vite client + esbuild server → `dist/` |
| Export helpers | html2canvas, jsPDF (KSE reports) |
| Motion / icons | motion, lucide-react |

**Not used** (despite older SSOT design notes): Python, Tweepy, NetworkX, Qdrant, Prefect, SQLite/Postgres for run persistence.

**Env** (`.env.example`):

```env
GEMINI_API_KEY=   # optional — without it, KSE + Content OS use deterministic local fallback
APP_URL=http://localhost:3000
```

---

## Implemented features (✅)

### Knowledge Signal Engine (Signal Radar)

- Full-stack app: Express + Vite React on port **3000**
- `POST /api/kse/run` — topic → candidates → noise filter → graph (DSU) → provenance + multi-signal rank → ≤10 originals + report
- `POST /api/kse/recalculate` — re-rank from in-memory cache without new LLM ingest (when cache hit)
- Gemini structured **simulation** of a social cascade when `GEMINI_API_KEY` is set
- High-fidelity **local fallback dataset** when key missing / quota / circuit-breaker
- Model retry ladder + exponential backoff + quota circuit-breaker
- Noise filter (regex spam / hashtag-mention heuristics)
- Graph edges emitted: `quote`, `reply`, `same_url`, `same_image_hash`, `semantic_sim` (Jaccard keyword overlap)
- Connected components via union-find / DSU
- `source_fitness` provenance scoring + presentation score vector (originality, authority, influence, evidence, freshness; `community_validation: null`)
- Optional Google Search grounding on the report step (best-effort)
- Multi-view portal (8 views): **Command · Sources · Cascade · Noise · Verify · Weights · Studio · Watchlist**
- Landing page → `#portal` entry
- Theme: Light / Dark / System
- KSE exports: JSON, TXT report, PDF (graph snapshot)
- Deep-link share query params (`q`, `node`, time window)
- Manual claim flags (Verified Fact / Misinformation / Satire) with local score overrides
- Keyboard UX (e.g. Ctrl/Cmd+K search, nav shortcuts)
- Simulated/fallback runs labelled (`is_fallback`)

### Founder Content OS (V1)

- Pure mapper `OriginalSource` → `FounderInsight` (`src/content/mapInsight.ts`)
- `POST /api/content/campaigns` with request validation and structured errors
- Campaign brief via Gemini **or** deterministic fallback
- **9 channel draft adapters:** X, LinkedIn, Instagram post/carousel/reel, WhatsApp, Facebook, YouTube Short, YouTube video
- Heuristic quality gate (evidence / voice / platform / clarity) + live re-score on edit
- Approve blocked when recommendation is REVISE; export only approved + gate-pass assets
- Content Studio UI + Sources “Create content in Studio” CTA + Jump desk link
- Export Markdown + JSON
- Browser campaign history (`localStorage`, max **12**)
- Indian-fluent English voice rules; **no auto-publish**, no stored social credentials
- Unit tests: mapper, campaign build, quality/export, text utils (`npm test`)

---

## In-progress / partial features ()

| Feature | What’s there | What’s missing |
|---------|--------------|----------------|
| **Stage ① collection** | Gemini simulation + local fallback | Real X API / licensed data collector |
| **Semantic similarity** | Jaccard token overlap (threshold ~0.45) | Real embeddings / vector store |
| **Image near-dup (pHash)** | `media_hashes` strings from LLM/fallback | Real perceptual hashing on media |
| **Edge types** | Types include `shared_entity`, `shared_hashtag`, `time_proximity`, `same_external_article` | Those kinds are **not emitted** by `server.ts` edge builder |
| **Influence / cascade** | Incoming-edge / component heuristics | Full directed reachability / diffusion trees |
| **Evidence / verify** | Heuristics + topic-level grounding | Per-original independent verification harness; rater fixtures for S1–S2 |
| **Noise tab demo** | If filter finds zero spam, server **forces** two low-like posts into `noise_candidates` | Production must not invent noise (docs call this a demo hack) |
| **Topic Watchlist** | UI + localStorage list | No real notification backend |
| **Sentiment badges / sparklines** | Cosmetic UI heuristics | Not product criteria or real engagement time-series |
| **Run persistence** | In-memory `Map` cache (lost on restart) | SQLite/Postgres or other durable store |
| **Quality gate** | Deterministic heuristics + live re-score | Full editorial LLM review |
| **CI browser E2E** | Manual Chrome E2E claimed in handoff | No Playwright/CI suite in repo |
| **`package.json` name** | Still `"react-example"` | Not renamed to product name |

---

## Planned but not started (❌)

Pulled from project specs (`X - Knowledge Signal Engine 10Jul26.md`, capture companion, Implementation Plan deferred list, `tasks/todo.md`):

### Signal / product (KSE)

- Official **live X collection** (Phase 0 cost/latency spike still the real production gate)
- Real **MinHash/LSH** near-duplicate stage
- Community detection / `community_validation` scoring
- Cascade / Hawkes-style diffusion modeling
- Multi-source ingestion (Reddit, HN, GitHub, RSS, …)
- Labeled rater fixtures + evaluation harness for S1–S2
- Python reference stack (explicitly not the active path)

### Capture & Context Pipeline

Entire companion system is **design-only** (see `X_-_Capture_and_Context_Pipeline_11Jul26.md`):

- Bookmark/like capturer, media extractor, classifier/taxonomy, archivist schema, markdown context exporter, Railway/cron job, Supabase storage

### Content OS / platform

- Auto-publish / OAuth to social networks
- Hinglish / regional language adapters
- Multi-tenant auth + billing
- Cloud campaign sync
- Performance analytics feedback loop
- Public deploy rate limits / hardening
- Optional split of large `ContentStudioView.tsx` for maintainability

---

## Architecture overview

Summarized from `docs/architecture.md` and `HANDOFF.md` (not copied verbatim).

```text
Topic
  → POST /api/kse/run
  → Gemini sim | fallback dataset
  → noise filter → graph edges + DSU components
  → source_fitness + multi-signal rank → ≤10 originals
  → (optional) grounding report

Selected OriginalSource
  → toFounderInsight()
  → POST /api/content/campaigns
  → CampaignBrief (Gemini | fallback)
  → ChannelAsset[] (9 adapters)
  → ContentQualityReview[] (blocking gate)
  → Approve → Export MD/JSON
  → optional localStorage history (max 12)
```

| Path | Role |
|------|------|
| `server.ts` | KSE pipeline + Content campaign API |
| `src/types.ts` | KSE + Content OS contracts |
| `src/content/*` | Insight map, brief, assets, quality, export, history |
| `src/views/*` | Portal views including Content Studio |
| `src/layout/AppShell.tsx` | Nav shell (8 views) |
| `src/landing/LandingPage.tsx` | Marketing landing |
| `src/hooks/useKseAnalysis.ts` | Client state, run/export, deep-links |

**Safety rules (in force):** never claim live X when fallback/simulated; never invent evidence URLs; drafts only until gate + user approve; no auto-publish; no secrets in git.

Further reading: `HANDOFF.md` (ops), `Implementation Plan.md` (Content OS V1 scope), `X - Knowledge Signal Engine 10Jul26.md` (algorithm SSOT + codebase reality §0b), `docs/architecture.md`.

---

## Setup / installation

```powershell
# From repo root
copy .env.example .env   # optional: set GEMINI_API_KEY
npm install
npm run dev              # http://localhost:3000
```

| Script | Purpose |
|--------|---------|
| `npm run dev` | `tsx server.ts` — Vite middleware + APIs on **:3000** |
| `npm test` | Vitest unit tests |
| `npm run lint` | `tsc --noEmit` |
| `npm run build` | Vite client + esbuild server → `dist/` |
| `npm start` | Run production `dist/server.cjs` |

Without `GEMINI_API_KEY`, both Signal Radar and Content Studio still run via **fallback** paths (labelled in UI/API).

---

## Usage

Working entry point: `npm run dev` → open `http://localhost:3000`.

**Signal Radar path**

1. Landing → **Enter lab** / `#portal`
2. Command: enter a topic and run analysis (expect **FALLBACK MODE** without a key)
3. Inspect Sources, Cascade graph, Noise, Verify, Weights

**Content OS path**

1. After a run, open **Sources** → **Create content in Studio** (or Jump desk / Studio nav)
2. Choose objective (Awareness / Trust / Leads), optional founder context
3. Generate → edit drafts → quality gate re-scores live
4. Approve only when gate says APPROVE → Export Markdown / JSON
5. Optional: recent campaigns from local history

**APIs (for integration testing)**

- `POST /api/kse/run` — `{ topic, provenanceWeights?, presentationWeights? }`
- `POST /api/kse/recalculate` — same body; reuses cached items when available
- `POST /api/content/campaigns` — `{ insight, objective, audience?, founderContext?, channels? }`

---

## Notes: docs vs code

| Topic | Docs say | Code reality |
|-------|----------|--------------|
| Content OS V1 | Complete / shipped | Matches — modules, API, Studio, tests present |
| KSE “MVP done” (S1–S2 on real X) | Success criteria still require real data + raters | Lab only; collection is simulated/fallback |
| Capture pipeline | Full design SSOT | **No implementation** in this repo |
| Stack | Older nested sections still describe Python | **Active path is Node/TS + React** (docs §0b already say this) |
| Edge model | Many edge kinds in types/SSOT | Only 5 kinds built in `server.ts` |
| Noise | Product filter | Demo path can **inject** noise candidates |
| Campaign history | Cloud sync planned later | Browser `localStorage` only |
| Existing README | Was a 2-line stub | This file rebuilt from code + all project `.md` sources |
| Remotes | Handoff mentions dual remotes (`X-KES-App-July26` + this repo) | This checkout’s `origin` is `Founder-Content-OS` |

**Trust rule used for this README:** code defines what works; `.md` specs define intent and deferred scope.

### Key project docs

| File | Role |
|------|------|
| `HANDOFF.md` | Current product state / runbook for engineers |
| `Implementation Plan.md` | Founder Content OS V1 scope (marked complete) |
| `docs/architecture.md` | Content OS module map |
| `docs/ATTRIBUTION.md` | Taste Skill / Social Media Skills notes |
| `tasks/plan.md` · `tasks/todo.md` | Slice tracker + deferred backlog |
| `X - Knowledge Signal Engine 10Jul26.md` | KSE design + codebase reality |
| `X_-_Capture_and_Context_Pipeline_11Jul26.md` | Separate capture system (not built here) |

---

*Auto-generated from repository docs and source analysis. Prefer honesty over polish.*
