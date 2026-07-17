# Knowledge Signal Engine + Founder Content OS — Technical Handoff

Deep notes for the next engineer or agent. Prefer this file for **current product state**; use SSOT docs for algorithm theory.

| Doc | Role |
|-----|------|
| `README.md` | Runbook + scope |
| `Implementation Plan.md` | Founder Content OS V1 plan (source of truth for feature scope) |
| `docs/architecture.md` | Content OS module map |
| `docs/ATTRIBUTION.md` | Taste Skill / Social Media Skills notes |
| `tasks/plan.md` · `tasks/todo.md` | Slice tracker |
| `X - Knowledge Signal Engine 10Jul26.md` | KSE SSOT |
| `X_-_Capture_and_Context_Pipeline_11Jul26.md` | Companion system (not all in this repo’s code) |

**Claim discipline:** Stage ① candidates are Gemini simulation or local fallback — **not** live X API. Content Studio does **not** auto-publish.

---

## 0. Current status (2026-07-17)

### Verdict

| Question | Answer |
|----------|--------|
| Is Implementation Plan **V1** implemented? | **Yes** |
| Does the full user journey work? | **Yes** (browser-proven; fallback mode without Gemini) |
| Production-ready with live X + polished Gemini copy? | **No** — lab prototype |
| Everything perfect? | **No** — core path works; polish / live data / publish still open |

### Tip commits

| Commit | Summary |
|--------|---------|
| `cdb6e86` | feat: Founder Content OS (contracts, API, Studio, tests) |
| `3976a1c` | fix: live quality re-score + stop mid-URL draft clips |
| `75fc68c` | fix: Studio discoverability (landing, Sources CTA, Jump desk) |

### Remotes

| Remote | Repo | Notes |
|--------|------|--------|
| `origin` | https://github.com/KishoreKaathvi/X-KES-App-July26 | Historical repo; default branch historically `master` |
| `founder-os` | https://github.com/KishoreKaathvi/Founder-Content-OS | New product repo; **`main`** = Content OS tip |

### E2E proof (real browser, Chrome DevTools MCP)

Path exercised:

```text
Landing → FAQ (not live X) → Enter lab
  → Command: run / switch topic
  → Sources: inspect + flag + Create content in Studio
  → Studio: select signal → objective → Generate campaign
  → 9 channel drafts → quality gate → Approve → Export MD/JSON
```

**Passed after fixes:** LinkedIn approve (no stale REVISE trap), WhatsApp approve, MD export blob, clean console, fallback labeled, Studio discoverable.

**Bugs found in real-user testing (fixed):**

1. Quality gate scores frozen after draft edit → Approve blocked even when draft fixed  
2. Truncated URLs (`https://……`) treated as unknown evidence  
3. Studio hard to find (landing “7 views”, no Sources CTA)

---

## 1. System architecture

Express owns the KSE pipeline and Content OS API; React is a multi-view lab + Content Studio.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     REACT CLIENT (PORT 3000)                           │
│  Landing · AppShell (collapsible nav) · Light/Dark/System · exports    │
│  Analyze: Command | Sources | Cascade | Noise                          │
│  Quality: Verify | Weights                                             │
│  Create:  Studio (Founder Content OS)                                  │
│  Ops:     Watchlist                                                    │
│  POST /api/kse/run · /api/kse/recalculate · /api/content/campaigns     │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────────┐
│                     EXPRESS BACKEND (server.ts)                        │
│  KSE: ① Ingest (Gemini sim | fallback) → ② Noise → ③ Graph (DSU)      │
│       → ④ Provenance + multi-signal rank → ⑤ Report → Grounding      │
│  Content OS: insight validation → brief (Gemini | fallback)            │
│              → channel adapters → quality reviews → JSON response      │
└────────────────────────────────────────────────────────────────────────┘
```

### Core source paths

| Path | Role |
|------|------|
| `server.ts` | KSE pipeline + `POST /api/content/campaigns` |
| `src/types.ts` | KSE + Content OS contracts |
| `src/content/mapInsight.ts` | `OriginalSource` → `FounderInsight` |
| `src/content/generateBrief.ts` | Campaign brief (fallback + prompt) |
| `src/content/generateAssets.ts` | 9 channel draft adapters |
| `src/content/qualityGate.ts` | Evidence/voice/platform/clarity gate |
| `src/content/exportCampaign.ts` | MD/JSON export builders |
| `src/content/buildCampaign.ts` | Orchestration for API + tests |
| `src/content/validateCampaignRequest.ts` | API validation |
| `src/views/ContentStudioView.tsx` | Content Studio UI |
| `src/hooks/useKseAnalysis.ts` | Client state, run/export, `AppView` |
| `src/layout/AppShell.tsx` | Nav + top bar (includes Studio) |
| `src/landing/LandingPage.tsx` | Marketing; lists 8 views including Studio |
| `src/views/SourcesView.tsx` | Ranked sources + **Create content in Studio** CTA |
| `src/views/OverviewView.tsx` | Command center + Jump desk → Studio |
| `vitest.config.ts` | Unit tests |

> **Note:** Legacy `Sidebar.tsx` / `OriginalCard.tsx` may remain; active shell is **AppShell + views + SourceCard**.

### Founder Content OS data flow

```text
KSERunResult.originals
  → toFounderInsight(OriginalSource)     // pure; preserves provenance
  → POST /api/content/campaigns
  → CampaignBrief + ChannelAsset[] + ContentQualityReview[]
  → Studio edit / live re-score / Approve
  → Export Markdown | JSON (approved + gate-pass only)
```

**Channels (V1):** X, LINKEDIN, INSTAGRAM_POST, INSTAGRAM_CAROUSEL, INSTAGRAM_REEL, WHATSAPP, FACEBOOK, YOUTUBE_SHORT, YOUTUBE_VIDEO.

**No auto-publish.** Audience: Indian-fluent English only.

---

## 2. Theoretical ingestion & social media simulation

When a topic search is dispatched, KSE models a chronological event sequence to represent a realistic social cascade.

### 2.1. The simulation prompt

If **GEMINI_API_KEY** is set, KSE uses structured JSON simulation (`responseMimeType: "application/json"`, `temperature: 0.3`) over a ~48-hour window:

- **Original seeds** — primary disclosures with URLs / media hashes  
- **Derivative copies** — paraphrases / clones  
- **Engagement bait** — traffic threads  
- **Inter-node refs** — `parent_id`, `quoted_id`  
- **Screenshot vectors** — shared `media_hashes`  

If the key is missing or quota is exhausted → **local high-fidelity fallback** dataset (`is_fallback: true`).

---

## 3. Detailed algorithmic processing pipeline

Backend stages for KSE (unchanged theory; still SSOT in the July docs):

### Stage 1: Noise filter

Spam regexes, hashtag/mention density on low-follower unverified accounts → `noise_candidates`.

### Stage 2: Graph / DSU

Edges: quote, reply, same_url, same_image_hash, semantic_sim (Jaccard > 0.45). Components = narrative clusters.

### Stage 3: Source fitness

$$F_s = w_{\text{time}} \cdot T_p + w_{\text{auth}} \cdot A_s + w_{\text{infl}} \cdot D_i - w_{\text{deriv}} \cdot D_s$$

### Stage 4: Presentation rank

$$P_s = \alpha \cdot \text{orig} + \beta \cdot \text{auth} + \gamma \cdot \text{infl} + \delta \cdot \text{evid} + \epsilon \cdot \text{fresh}$$

Top ≤10 originals.

### Stage 5: Grounding

Gemini Search Grounding when available; offline dynamic check in fallback.

---

## 4. API contracts

### 4.1. Run KSE

- **POST** `/api/kse/run`  
- Body: `{ topic, provenanceWeights?, presentationWeights? }`  
- Response: `KSERunResult` (`is_fallback`, `originals`, `edges`, `noise_candidates`, `verification_grounding`, …)

### 4.2. Recalculate weights

- **POST** `/api/kse/recalculate`  
- Cached / offline re-rank without new LLM ingest cost when cache hit.

### 4.3. Content campaign (Founder Content OS)

- **POST** `/api/content/campaigns`  
- Body:
```json
{
  "insight": { /* FounderInsight */ },
  "objective": "AWARENESS | TRUST | LEADS",
  "audience": "optional string",
  "founderContext": "optional string",
  "channels": ["X", "LINKEDIN", "..."]
}
```
- Success: `{ id, brief, assets, reviews, is_fallback, createdAt }`  
- Validation errors: `{ error, code: "VALIDATION", details: string[] }`  
- Internal failures: `{ error, code: "INTERNAL" }` (no raw model dumps)

**FounderInsight** must include: `id`, `sourceOriginalId`, `topic`, `claim`, `audience: "INDIAN_ENGLISH"`, `evidenceLinks[]`, scores, optional `isSimulatedSource`, `sourceUrl`.

---

## 5. Frontend architecture & state

### 5.1. Views (`AppView`)

`overview` | `sources` | `graph` | `noise` | `verify` | `tuning` | `content` | `alerts`

### 5.2. Content Studio UX

1. Select ranked original (or arrive via Sources **Create content in Studio**)  
2. Objective: Awareness / Trust / Leads  
3. Optional founder context  
4. Generate → brief + channel tabs + quality scores  
5. Edit drafts → **gate re-scores live** on edit/approve  
6. Approve only if recommendation is APPROVE  
7. Export MD/JSON (approved + gate-pass only)

### 5.3. Temporal window & exports (KSE)

- Client `dateRange` filters nodes/edges  
- Export analysis JSON / text report / PDF still available from shell  

### 5.4. Themes

Light / Dark / System via AppShell.

---

## 6. Failure recovery & API optimization

1. Model list with retries + exponential backoff  
2. Quota flag → skip Gemini, use fallback  
3. Missing `GEMINI_API_KEY` → full local path for KSE **and** Content OS briefs  
4. Content OS always produces deterministic channel adapters + reviews even when brief is fallback  

---

## 7. Testing & scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | `tsx server.ts` (Vite middleware + APIs) on **:3000** |
| `npm run lint` | `tsc --noEmit` (node-direct path for folders with `&`) |
| `npm test` | Vitest: mapper + campaign/quality/export |
| `npm run build` | Vite client + esbuild `server.ts` → `dist/` |

**Windows path note:** Workspace path contains `&` (`X (Signal Radar) & SM Co`). Prefer:

```powershell
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\typescript\bin\tsc --noEmit
```

if bare `npm test` / `tsc` mis-resolves modules.

### Unit coverage (V1)

- Complete / missing-evidence / simulated `toFounderInsight`  
- Campaign build X+LinkedIn, validation errors  
- Quality REVISE blocks export  
- Markdown export for approved assets  

### Not in CI yet

- Playwright / Chrome full-browser E2E suite  

---

## 8. What’s in V1 vs missing

### In scope and done

- [x] Insight contracts + pure mapper + provenance  
- [x] Campaign API + Gemini/fallback brief  
- [x] All planned channels as editable drafts  
- [x] Quality gate (blocking approve/export)  
- [x] Content Studio UI + discoverability  
- [x] MD/JSON export  
- [x] Simulated/fallback labeling  
- [x] Unit tests + typecheck + production build  
- [x] Feature branch + Founder-Content-OS `main`  
- [x] Tighter fallback copy (less claim triple-paste)  
- [x] Browser campaign history (localStorage)  
- [x] Landing FAQ + README for Content Studio  
- [x] Sources → Studio CTA + Jump desk  

### Out of scope (deferred roadmap)

- Live X collection  
- Auto-publish / OAuth to social platforms  
- Hinglish / regional languages  
- Multi-tenant auth / billing  
- Performance analytics feedback  

### Remaining product gaps (after polish pass)

| Gap | Severity | Notes |
|-----|----------|--------|
| No Gemini key → fallback briefs | Medium | Optional `GEMINI_API_KEY`; fallback is tighter but not LLM-quality |
| No automated browser E2E in CI | Low–Med | Unit tests cover pure path; browser still manual/agent |
| No cloud campaign sync | Low | **Browser localStorage** history (max 12) — not multi-device |
| Quality gate is heuristic | Low | Live re-score on edit; not full editorial LLM |
| Live X / publish / Hinglish / multi-tenant | Deferred | Explicitly out of V1 |

---

## 9. Local runbook

```powershell
# From repo root
copy .env.example .env   # if present; add GEMINI_API_KEY optionally
npm install
npm run dev              # http://localhost:3000
```

Portal: `#portal`  
Content path: run topic → Sources → **Create content in Studio** → Generate → Approve → Export.

---

## 10. Next engineer checklist

1. Confirm remotes: work on **Founder-Content-OS** `main` or merge feature into **X-KES-App-July26** `master` as needed.  
2. Optional: `.env` with `GEMINI_API_KEY` and re-test campaign quality.  
3. Optional: Playwright smoke for Studio path in CI.  
4. Do **not** claim live X provenance until Collector uses compliant live data.  
5. Do **not** add auto-publish without explicit platform auth product decision.  

---

## 11. Historical KSE notes (still valid)

### Sentiment (if present on cards)

Downstream keyword heuristics for positive/negative/neutral badges.

### Export engine

- KSE: `kse-analysis-[topic].json`, text report, PDF  
- Content OS: `content-campaign-[topic].md` / `.json`  

### Model list (server)

```ts
const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
```

---

*Last updated: 2026-07-17 — V1 complete + polish (fallback copy, history, docs); main shipped.*
