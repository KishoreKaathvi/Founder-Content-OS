> **Document status:** X - Knowledge Signal Engine (Draft v1.2 — repo-ready) · Owner: (you) · Last updated: 2026-07-11
> **Reading order:** `README.md` → **`00b-codebase-reality`** → `00-overview` → `01-architecture` → `02-reality-and-mvp` → `03-build-spec` → `04-ranking-and-provenance` → `05-roadmap`
> **Companion:** `X_-_Capture_and_Context_Pipeline_11Jul26.md` (push-shaped capture; not built in this repo yet)
> **Handoff detail:** `HANDOFF.md` (pipeline math/API; UI paths may lag — trust §0b + `src/views/` for layout)
> **GitHub:** https://github.com/KishoreKaathvi/X-KES-App-July26

---

## 0b. Codebase reality (what AI Studio / Gemini actually built) ⚠️ READ THIS

This section was added after auditing the live repo against this SSOT. **The design layers below still define product truth.** The codebase is a **working algorithm + UI prototype** that went further in *product surface* than Phase 1 of this doc, while remaining **behind** on the binding constraint: **real X data access**.

### What exists in the repo today

| Area | Status | Location |
|------|--------|----------|
| Full-stack app | ✅ Runs | Express + Vite React on port 3000 (`server.ts`, `src/`) |
| Topic → analysis run | ✅ | `POST /api/kse/run` |
| Instant weight re-rank (no LLM cost) | ✅ | `POST /api/kse/recalculate` + in-memory `resultCache` |
| Noise filter | ✅ | Regex spam + high hashtag/mention + low-authority heuristic |
| Graph edges | ✅ partial | `quote`, `reply`, `same_url`, `same_image_hash`, `semantic_sim` (Jaccard keyword overlap > 0.45) |
| Connected components | ✅ | Disjoint-set / union-find in `computeConnectedComponents` |
| Provenance `source_fitness` | ✅ | Matches `04` formula with default weights |
| Multi-signal score vector | ✅ | originality / authority / influence / evidence / freshness; `community_validation: null` |
| Top ≤10 originals | ✅ | Presentation-score sort |
| Gemini report step | ✅ | Topic summary + `why_it_matters` + `current_relevance` |
| Google Search grounding | ✅ best-effort | `tools: [{ googleSearch: {} }]` → `verification_grounding` |
| Offline fallback dataset | ✅ | `createFallbackDataset(topic)` when no key / 429 / quota |
| Model retry ladder | ✅ | `gemini-3.1-flash-lite` → `gemini-3.5-flash` → `gemini-flash-latest` + exp backoff + 5-min quota circuit-breaker |
| Multi-view UI | ✅ **ahead of SSOT MVP** | `AppShell` + Command/Sources/Cascade/Noise/Verify/Weights/Watchlist |
| Theme | ✅ | Light / Dark / System (no DaisyUI) |
| Export | ✅ | JSON, TXT report, PDF (html2canvas + jsPDF) |
| Capture pipeline | ❌ | Spec only — companion SSOT |
| Deep-link share | ✅ | `?q=&node=&tMin=&tMax=` |
| Manual claim flags | ✅ (UI) | Verified Fact / Misinformation / Satire → local score overrides (localStorage) |
| Topic alerts | ✅ (UI only) | localStorage list — **not** a real notification backend |
| Theme | ✅ | light / dark / system |
| Keyboard UX | ✅ | Ctrl/Cmd+K search, arrows traverse originals, Esc clears |
| Cluster / node sentiment badge | ✅ cosmetic | Keyword heuristic (+amazing/−fake style), not a product criterion |
| Sparkline volatility on cards | ✅ cosmetic | Deterministic hash of post id — **not** real engagement time-series |
| Real X API collection | ❌ **not built** | Stage ① is **Gemini simulation**, not Tweepy / X search |
| Real embeddings / Qdrant | ❌ | Semantic edge = Jaccard on tokens > 3 chars |
| Real pHash on images | ❌ | `media_hashes` are simulated strings from the LLM or fallback |
| MinHash/LSH near-dup collapse | ❌ | Not a separate stage; high Jaccard edges only |
| `shared_entity` / `shared_hashtag` / `time_proximity` edges | ⚠️ typed only | Present in `src/types.ts`, **not** emitted in `server.ts` edge builder |
| Python stack (Tweepy, NetworkX, SQLite…) | ❌ not used | Prototype is **Node/TypeScript + React** |
| Capture & Context Pipeline | ❌ not in repo | Separate system; zero code here |

### Critical honesty (do not re-litigate)

1. **This is not yet a production provenance engine on live X data.** It proves the *graph → source_fitness → score vector → report* loop on **synthetic or LLM-simulated cascades**. Shipping language must not claim live X provenance until Collector uses official X API (or licensed data) and S1–S2 are measured on real posts.
2. **UI ahead of data is intentional for this prototype, not a rewrite of the MVP boundary.** The original SSOT said “no dashboard before S1/S2.” The AI Studio path built a full workstation first so the ranking math is inspectable. That is fine as a **lab**. Production still gates on `02` (data access + rater fixtures).
3. **Demo-path quirks that must not become product truth:**
   - If noise filter finds zero spam, the server **forces** two lowest-like posts into `noise_candidates` so the UI always has a Noise tab demo. Real MVP must not invent noise.
   - Influence uses **incoming edge count / component size**, not full directed reachability / cascade trees.
   - Evidence uses verified + cluster size > 3 + github/arxiv URL heuristics — not a full Verifier against independent sources (grounding is topic-level, not per-original).

### Implemented stack (prototype) vs design stack (SSOT §03)

| Concern | Design SSOT (Python path) | **Shipped prototype (this repo)** |
|---------|---------------------------|-----------------------------------|
| Language | Python 3.11+ | **TypeScript (Node + React 19)** |
| Runtime | Prefect/cron scripts | **Express + Vite** (`tsx server.ts`) |
| Collection | Tweepy / X API | **Gemini structured JSON simulation** (+ local fallback) |
| LLM | Any API at report step only | **@google/genai** — simulation + report + grounding |
| Graph | NetworkX → igraph | **In-memory edges + DSU components** |
| Vectors | Sentence-Transformers + Qdrant | **None** (Jaccard proxy) |
| Storage | SQLite → Postgres | **In-memory Map cache only** (lost on restart) |
| UI | Deferred past Phase 1 | **Full analytical dashboard** |
| Config | `config/` files | **Defaults in `server.ts` + Sidebar sliders** |

**Stack decision going forward:** keep the **TypeScript monorepo** as the active implementation path unless a deliberate rewrite is approved. The Python stack in nested `03` remains a *reference design*, not the current code contract. Source-agnostic types in `src/types.ts` already mirror the SSOT dataclasses closely enough to preserve that principle.

### Default weights (live code)

```
provenance:  w_time=0.45, w_auth=0.25, w_infl=0.20, w_deriv=0.35
presentation: α=0.35, β=0.20, γ=0.25, δ=0.15, ε=0.05, ζ=0.0
```

### API contracts (implemented)

- `POST /api/kse/run` — body: `{ topic, provenanceWeights?, presentationWeights? }` → full `KSERunResult`
- `POST /api/kse/recalculate` — same body; reuses cached items/edges; re-runs only provenance + ranking; preserves Gemini explanations when possible

### UI product surface already built (for product/roadmap accounting)

These are **real code**, not vision slides — treat them as Phase-4-ish surface that landed early:

- Relationship graph (SVG force layout, pan/zoom, edge kinds)
- Original cards with score bars, evidence badges, derivatives, flags
- Pipeline hub tabs (summary, graph, originals, noise, grounding)
- Time-window filter (client-side)
- Export JSON / TXT / multi-page PDF with graph snapshot
- Share deep-link, theme toggle, topic alerts (local), header search

### What this means for phases

| Phase | Doc intent | Prototype status |
|-------|------------|------------------|
| Phase 0 spike (real X cost/latency) | First | **Not done** — still the real first production task |
| Phase 1 vertical slice | Thin report on real data | **Logic + UI exist on simulated data**; not wired to X |
| Phase 2 harden provenance | Rater loop | Algorithms present; **no labeled fixtures / evaluation harness** |
| Phase 3+ data-unlocked | Gated | Unchanged — still blocked on real graph density |
| Capture pipeline | Companion system | **Not started** (see companion SSOT) |

### Immediate next actions (codebase-aware, supersedes old “Python first” list)

1. **Do not expand UI further** until Stage ① is either (a) official X collection with budget, or (b) explicitly frozen as “simulator-only lab.”
2. **Phase 0:** real collection spike at chosen X tier; fill cost table in `02`; reject scraping paths.
3. **Replace Gemini simulation with Collector** behind the same `ContentItem` / `Author` / `Edge` types already in `src/types.ts`.
4. **Remove or gate demo hacks** (forced noise candidates) behind a `DEMO_MODE` flag before any production claim.
5. **Add rater fixtures + degraded-edge tests** against `runProvenancePipeline` (pure function already isolated).
6. **Capture pipeline stays separate** — do not fold bookmark/media work into this server.

---

## 0. How to read this document (and why it's layered)

This documentation is deliberately structured in three layers, because the source discussion mixed three different altitudes of thinking that need to be kept separate:

| Layer | Files | Purpose | **Why separated** |
|-------|-------|---------|-------------------|
| **Vision** | `00`, part of `01` | What the platform could become | Aligns stakeholders on ambition. Aspirational by design. |
| **Reality** | `02` | What is actually achievable given data-access constraints | Prevents the team from designing around data it cannot get. This is the layer most X-analysis projects skip, and it is why they fail. |
| **Build spec** | `03`, `04` | Concretely buildable MVP with schemas, repos, formulas | Turns the surviving ideas into code. |

**Why this matters:** A design doc that presents Phase 1 collection and Phase 4 cascade analysis as equally real is a wishlist, not a contract. The single most important architectural fact in this entire document is that **data access — not algorithms — is the binding constraint** (see `02`). Everything downstream is negotiable; that is not.

---

## 1. The problem, stated precisely

### 1.1 The naive framing (and why it's wrong)

The instinct is to ask an LLM: *"Show me the best posts about AI agents."*

**Why this fails:** An LLM has no live timeline, no engagement graph, and no ranking model. "Best" is undefined. Even an X-integrated model (e.g. Grok) still needs an explicit definition of *best* and a retrieval budget. This is a **retrieval + ranking** problem, not a **summarization** problem — and conflating the two is the root error.

### 1.2 The actual signal-to-noise problem

```
1000 posts
   ↓  ~980 are derivatives (rewrites, screenshots, quote-copies, AI summaries)
 20 original
   ↓  ~5 become the actual source everyone else copies
  5 primary sources
```

**Objective (restated):** *Identify the ORIGINAL high-signal posts for a topic, and explain why they matter.*
**Non-objective:** *Summarize AI posts.* Summarization is the **last** step, not the first.

### 1.3 The deeper insight: this is a *provenance* problem

Semantic similarity says "all these posts are alike." That is the wrong question. The right question is:

> **Which post caused the others?**

This is **information provenance**, the same problem Google News solves — it ranks by original publisher, first appearance, and citation graph, *not* by sentence similarity. This reframing is why the architecture in `01` puts a **relationship graph at the center, not embeddings**.

**Why embeddings are demoted:** Embeddings tell you two posts are *about the same thing*. They cannot tell you which came first, who is authoritative, or who copied whom. Embeddings are *one edge type* in the graph, not the organizing principle.

---

## 2. Vision: the Knowledge Signal Engine

The full ambition (documented here, scoped down in `02`) is a **social intelligence platform**, of which "original tweet finder" is only the seed feature.

### 2.1 What it does, at full scope

- **Provenance detection** — for any topic, find the originating post and trace the derivative cascade.
- **Daily intelligence dashboard** — trending topics across time windows (1h → 30d), emerging topics, breaking news, viral originals, high-quality threads.
- **Author intelligence** — influence, expertise, credibility, original-content ratio per author.
- **Community-aware signal** — five respected ML researchers independently linking a post within an hour is a stronger signal than 5,000 likes from unrelated accounts. Community detection makes this measurable.
- **Multi-source, eventually** — X is source #1; the ingestion layer is modular so Reddit, Hacker News, GitHub, RSS, YouTube, and research feeds can join without redesigning the core.

### 2.2 Why the broader framing ("Knowledge Signal Engine", not "Original Tweet Finder")

The requirements have already outgrown tweet retrieval: the system discovers, ranks, explains, *and tracks over time* high-value information across communities. Naming it narrowly would bias the architecture toward X-specific assumptions (tweet IDs, quote-tweet edges) that don't generalize. Naming it broadly forces a **source-agnostic content model** from day one (see `03`, §Data Model). **However** — and this is the reality-layer caveat — broad *framing* does not mean broad *initial build*. See `02`.

### 2.3 What we are explicitly NOT building at MVP

Stated up front so it isn't relitigated later:

- ❌ Multi-source ingestion (X only)
- ❌ Real-time streaming dashboard
- ❌ Cascade / diffusion-tree modeling (Hawkes processes, etc.)
- ❌ Training custom models
- ❌ The full 12-section dashboard

**Why:** Each depends on data volume or data-access we won't have at MVP (`02`), or on infrastructure that only pays off after provenance itself works. Provenance-on-a-single-topic must work first, or none of the rest has a foundation.

---

## 3. Success criteria (how we know the MVP works)

| # | Criterion | Measurement | **Why this one** |
|---|-----------|-------------|------------------|
| S1 | Given a topic, returns ≤10 posts, ≥8 of which a human rater agrees are "original / high-signal" | Manual rater panel, precision@10 | Precision over recall is the whole point (§1.2). Recall is cheap; correct originals are not. |
| S2 | For each returned post, correctly identifies it as the earliest credible source in its cluster ≥70% of the time | Rater-labeled clusters | This is the provenance claim — the differentiator vs. a search box. |
| S3 | Zero returned posts are engagement bait / pure reposts | Rater check | A single "This is huge 🚀" in the top 10 destroys trust in the whole output. |
| S4 | End-to-end run on one topic completes within cost/latency budget (defined in `02`) | Instrumented run | If it can't run within API budget, it isn't a product. |

**Why S2 is the hardest and most important:** anyone can build S1 with keyword search + likes. S2 is the reason this project exists, and (per `02`) it is also the criterion most threatened by data-access limits. If S2 proves infeasible at our API tier, the honest move is to descope to "high-signal finder" and drop the provenance claim — better than shipping a false one.

---

## 4. Document map

- **`01-architecture.md`** — the graph-first architecture, roles/stages, why graph beats cluster-first.
- **`02-reality-and-mvp.md`** — ⚠️ the constraint layer. Data-access tiers, what each unlocks, the honest MVP boundary, cost/latency budgets. **Read this before estimating anything.**
- **`03-build-spec.md`** — data model, component specs, chosen libraries (and rejected ones), interfaces.
- **`04-ranking-and-provenance.md`** — the multi-signal scoring model, provenance inference rules, why scores stay un-collapsed until presentation.
- **`05-roadmap.md`** — phased delivery, each phase gated on a proven capability, not a calendar.

description: Overview/vision doc for the X provenance "Knowledge Signal Engine" project

name: Write
input:
file_path: /home/nate.meyer/src/code/metrics/docs/01-architecture.md
content: |-
# 01 · Architecture
> Prereq: `00-overview.md`. This file describes the *intended* architecture. The *achievable* subset is in `02-reality-and-mvp.md`.

---

## 1. The core architectural decision: graph-first, not cluster-first

The naive ML pipeline is:

```
Search → Embeddings → Clustering → Ranking
```

We reject this ordering. The architecture is:

```
Collection → Normalization → Relationship Graph → Ranking
```

**Why the change:** Clustering-first answers *"which posts are similar?"* But the product question is *"which post caused the others?"* (provenance, `00` §1.3). Clustering flattens a rewrite, a screenshot, a quote-tweet, and the original into one undifferentiated blob labeled "similar." The causal/temporal structure — the exact thing we need — is destroyed at the clustering step. A **graph preserves that structure**: similarity is just one edge type among many, and the directional/temporal edges (quote, reply, "first to post this URL") are what actually locate the source.

**Why embeddings are demoted to a signal, not the spine:** embeddings are symmetric and atemporal. "A is similar to B" carries no arrow. Provenance is inherently directional and temporal. So embeddings contribute *one* undirected edge type; the graph as a whole carries the direction.

---

## 2. The pipeline (stages), with the "why" for each

```
User Topic
    │
    ▼
① Broad Retrieval        ── keywords, hashtags, phrases, semantic, replies, quotes
    │
    ▼
② Noise Filter           ── spam, ads, engagement bait
    │
    ▼
③ Near-Duplicate Removal ── identical / paraphrase / AI-rewrite / screenshot-of
    │
    ▼
④ Graph Construction     ── every post = node; many edge types (§3)
    │
    ▼
⑤ Community Detection     ── who is talking (ML researchers vs. general)
    │
    ▼
⑥ Provenance Detection   ── per connected component, find the source node
    │
    ▼
⑦ Multi-Signal Ranking   ── originality, authority, influence, evidence… (kept separate)
    │
    ▼
⑧ Cross-Verification     ── confirm claims vs. official / independent sources
    │
    ▼
⑨ Final Report           ── ≤10 originals + why each matters (summarization LAST)
```

### Stage-by-stage rationale

**① Broad Retrieval — cast wide, then filter.**
*Why:* You cannot rank what you didn't collect. But (`02`) you also cannot "fetch all posts." So the design target is: *retrieve a broad candidate set that maximizes the chance the true original is somewhere in it.* Recall matters **here and only here**; every later stage trades recall for precision.

**② Noise Filter — kill spam/ads/bait early.**
*Why first-ish:* engagement bait ("This is huge 🚀", "Thoughts?", "10 lessons…") pollutes both the graph and the embeddings. Removing it before graph construction keeps components clean and cuts downstream cost.

**③ Near-Duplicate Removal — collapse rewrites/screenshots/reposts.**
*Why before the graph:* if you don't collapse near-dupes, the graph fills with thousands of "same content" nodes that inflate false influence and bury the original. Note the ordering nuance: we collapse *exact and near-exact* dupes here, but we **keep** quote-tweets and threads as distinct nodes, because their *edges* are provenance evidence. (Screenshots are dupes to remove *by content* but their existence is a signal — see `04`.)

**④ Graph Construction — the heart of the system.** Detailed in §3.

**⑤ Community Detection — who is amplifying.**
*Why before ranking:* the source insight is that *whose* attention a post gets matters more than *how much*. Community structure lets us weight "5 independent ML researchers" above "5,000 unrelated likes." Ranking that ignores community is just disguised popularity ranking.

**⑥ Provenance Detection — the differentiator.**
Per connected component, pick the source node by: earliest credible timestamp, original media (not screenshot), author directly involved / official, first technical explanation, lowest derivative score. Detailed rules in `04`.
*Why per-component and not global:* "original" is only meaningful *relative to a conversation*. There is no global first post; there is a first post *per claim/event*.

**⑦ Multi-Signal Ranking — many scores, not one.**
*Why kept separate:* collapsing to a single number too early destroys explainability and tunability (`04` §"Why we don't collapse scores"). A post can be highly *original* but low *evidence*; the report needs both faces.

**⑧ Cross-Verification — confirm before asserting.**
*Why:* the report makes claims ("this is the original announcement"). Asserting an unverified claim as fact violates the honesty requirement. Where possible, confirm against the official source or ≥2 independent accounts.

**⑨ Final Report — summarization is LAST.**
*Why last:* summarizing before filtering just produces a fluent summary of noise. The LLM's job is to *explain the survivors*, not to *find* them.

---

## 3. The graph model — nodes and edges

Every post becomes a **node**, enriched with extracted features:

```
post
  ├─ entities        (named entities, products, orgs)
  ├─ URLs            (external links)
  ├─ media hashes    (perceptual hash of images — catches screenshots)
  ├─ mentioned accts
  ├─ quoted post id
  ├─ reply-to id
  └─ semantic embedding
```

**Edges** connect nodes by relationship. Each edge type is a distinct provenance signal:

| Edge type | Direction | **Why it's a provenance signal** |
|-----------|-----------|----------------------------------|
| `quote` | derivative → original | Explicit "I'm reacting to this." Direct causal arrow. Strongest single signal. |
| `reply` | reply → parent | Reveals the conversation tree; parents precede children. |
| `same_url` | undirected | Two posts sharing an external link discuss the same artifact; earliest is likely source. |
| `same_image_hash` | undirected | Catches **screenshots of the original** — the classic derivative that semantic search misses. |
| `semantic_sim` | undirected | Same topic; weakest, atemporal. One signal among many. |
| `shared_entity` | undirected | Same product/event/person; groups a discussion. |
| `shared_hashtag` | undirected | Weak topical grouping; heavily discounted (hashtags are gamed). |
| `time_proximity` | undirected | Co-bursting posts likely react to a common trigger. |
| `same_external_article` | undirected | Multiple posts citing one article → the article (or its earliest poster) is the source. |

**Why so many edge types instead of just semantic similarity:** each covers a failure mode of the others. Semantic sim misses screenshots (image hash catches them). Image hash misses paraphrases (semantic catches them). Neither gives direction (quote/reply do). Provenance emerges from the *combination*, which is exactly why a single-signal approach (embeddings-only) cannot solve it.

### 3.1 From graph to answer

For each **connected component** (≈ one event/claim), compute:

```
oldest  ·  highest authority  ·  largest downstream influence  ·  lowest derivative score
```

The node maximizing this (see `04` for the exact rule) is the **Original Source** — replacing the naive "most liked." *Why this is a huge difference:* "most liked" systematically returns the *best-marketed derivative*, not the origin. The whole value proposition is refusing to do that.

---

## 4. Roles (logical decomposition)

The pipeline maps to seven logical roles. **Why decompose into roles** rather than one mega-prompt/service: each role has a different failure mode, a different data dependency, and a different testability profile. Isolating them lets us test the Source Finder independently of the Searcher, and swap the Ranker's formula without touching collection.

| Role | Stage(s) | Input → Output | Hardest failure mode |
|------|----------|----------------|----------------------|
| Searcher | ① | topic → raw candidate set | missing the true original entirely (recall) |
| Deduplicator | ③ | ~1000 → ~250 unique ideas | collapsing an original into a dupe cluster |
| Clusterer / Graph builder | ④⑤ | posts → graph/components | wrong edges → wrong components |
| **Source Finder** | ⑥ | component → origin node | picking a fluent derivative as origin |
| Influence Ranker | ⑦ | sources → influence scores | popularity masquerading as influence |
| Quality Judge | ⑦ | sources → quality scores | rewarding polished marketing as "depth" |
| Final Reporter | ⑨ | ranked sources → report | summarizing noise fluently |

The **Source Finder** is the role the entire product lives or dies on (`00` §3, S2).

---

## 5. Component / community and cascade analysis (vision-layer)

Two capabilities elevate this from search engine to intelligence platform. Both are **vision-layer** — gated on data access (`02`):

- **Community detection** (Louvain / Leiden / Label Propagation): partition authors into communities (AI Twitter, ML researchers, VC Twitter, org employees). *Why:* enables the "independent respected voices" signal. Cross-community spread is a strong authenticity indicator; single-community virality often indicates coordinated amplification.
- **Cascade / diffusion analysis** (Information Diffusion, Hawkes processes, retweet cascades): every viral post spawns a diffusion tree (RT → quote → summary → blog → newsletter). *Why:* the cascade *is* the provenance record — its root is the origin. **Reality check:** reconstructing cascades requires retweet/quote graph data that is expensive/gated on X (`02`). This is why cascade analysis is Phase 3+, not MVP.

---

## 6. Source-agnostic content model (design principle)

Even though MVP is X-only, the internal content model is **source-agnostic** from day one (see `03` §Data Model). *Why now and not later:* retrofitting a `source` abstraction after the schema hardens around tweet-specific fields (tweet IDs, quote edges) is the expensive kind of rework the source discussion explicitly warned against. Abstracting the *shape* early is cheap; abstracting it late is a rewrite.



description: Graph-first architecture doc — pipeline stages, node/edge model, roles, with rationale

name: Write
input:
file_path: /home/nate.meyer/src/code/metrics/docs/02-reality-and-mvp.md
content: |-
# 02 · Reality & MVP — the Constraint Layer ⚠️
> **This is the most important file in the set.** Read it before estimating, scoping, or promising anything. The architecture in `01` describes what we'd build with unlimited data access. This file describes what we can *actually* get, and therefore what the MVP is.

---

## 1. The one fact that dominates everything: data access is the binding constraint

**Not algorithms. Not compute. Not the model. Data access.**

Every ambitious capability in this project — provenance, cascade trees, community detection, influence scoring — is downstream of *what X data we can obtain, at what fidelity, at what cost, at what rate*. If the data isn't obtainable, no amount of clever ML recovers it.

**Why this deserves its own file:** most X-analysis projects design the algorithm first, then discover at integration time that the retweet graph they assumed is free actually costs thousands of dollars/month or isn't exposed at their tier. They then either (a) quietly ship a popularity ranker and call it provenance, or (b) resort to ToS-violating scraping. Both are failure modes. We surface the constraint *first* so the design bends around reality instead of breaking against it.

---

## 2. Honest assessment of X data-access options

> ⚠️ **Verify current terms before building.** API tiers, pricing, and rate limits change frequently; the values below reflect the general shape as of this writing and must be re-checked against X's current developer terms. Do **not** treat specific numbers here as authoritative — treat the *relationships* between tiers as the guidance.

| Option | Access shape | Provenance-relevant data | Status / risk |
|--------|--------------|--------------------------|---------------|
| **X API — paid tiers** | Official, rate-limited, tiered pricing | Search, some engagement metrics; full retweet/quote graph & high-volume search are gated to higher tiers | ✅ Legitimate. 💰 Cost scales steeply with the exact data provenance needs. **Verify current tier limits.** |
| **snscrape** | Historically scraped search | Was broad and free | ❌ **Largely non-functional against X today.** Do not design around it. |
| **Twikit / browser automation** | Automates a logged-in session | Can reach more than the API | ❌ **Violates X ToS**, fragile, risk of account/legal action. **Not recommended.** Documented only to explicitly reject it. |
| **Third-party data vendors** | Licensed firehose/resellers | Potentially full | 💰💰 Expensive; licensing terms vary. Viable only if funded. |

**Why we reject Twikit/scraping outright:** the honesty and authorization principles governing this project don't permit building the product on a ToS violation, and it's operationally fragile (breaks on every UI change). If the only path to full provenance is scraping, the correct answer is to **descope the provenance claim**, not to scrape.

---

## 3. What each data tier *unlocks* (capability ladder)

This is the crux. Map capability directly to data access so scope decisions are grounded:

| Capability | Data required | Obtainable at reasonable cost? |
|------------|---------------|-------------------------------|
| Keyword/topic search of candidates | Search endpoint | ✅ Yes (paid tier) |
| Semantic dedup / clustering | Just the post text (from search) | ✅ Yes — this is *our* compute, not X's data |
| Screenshot detection (image hash) | Post media | ✅ Yes if media URLs returned |
| `same_url` edges | Post text (URLs are in it) | ✅ Yes |
| Reply-tree edges | Conversation/reply data | 🟡 Partial — depends on tier & rate limits |
| **Quote-tweet edges** | Quote relationships | 🟡 **Gated / rate-limited** — the key provenance edge, and the shaky one |
| **Full retweet cascade** | Complete RT graph | ❌ Expensive/gated — **assume unavailable at MVP** |
| Community detection | Author-follow / interaction graph at scale | ❌ Expensive/gated — **Phase 3+** |
| Historical (weeks/months) trends | Full-archive search | 💰 Higher tier |

### The decisive implication

- Provenance signals that survive on **cheap data**: timestamp ordering, `same_url`, `same_image_hash` (screenshots), semantic similarity, quote-edges *where available*.
- Provenance signals that need **expensive/gated data**: full cascade trees, community weighting, complete RT influence.

**Therefore the MVP provenance model is built on the cheap signals**, and treats quote/reply edges as a *bonus* when the tier provides them — not a foundation. This is why `00` S2 carries the explicit fallback: if even the cheap signals can't hit 70% source-identification, we descope to "high-signal finder."

---

## 4. The honest MVP boundary

### In scope (MVP)
- **One topic/domain** at a time (e.g. "AI Coding"), operator-supplied.
- **Batch, not streaming.** Run on demand or on a schedule.
- Retrieval → noise filter → near-dup removal → graph (cheap edges) → provenance (cheap signals) → multi-signal ranking → ≤10-post report with "why."
- Success measured against `00` §3 (S1–S4).
- **UI note (2026-07-11):** an interactive dashboard already exists in the monorepo as a **lab workstation** on simulated data (`00b`). That does **not** change the product gate: S1–S4 on **real X data** still define MVP done. The UI is allowed to ship with production MVP once data is real; it is not a substitute for real collection.

### Out of scope (MVP) — and *why each is deferred*
| Deferred | Why |
|----------|-----|
| Multi-source ingestion | X provenance must work first; abstraction kept (`01` §6) but no second source built. |
| Real-time / streaming dashboard | Needs continuous API spend before core value is proven. (Batch UI already exists in lab.) |
| Full 12-section vision dashboard | Each extra widget presumes data (cascades, communities, historical archive) we won't have. |
| Cascade / Hawkes modeling | Needs full RT graph → gated data (§3). |
| Community detection | Needs author-interaction graph at scale → gated data (§3). |
| Custom-trained models | Off-the-shelf embeddings suffice at MVP; training is premature optimization. |
| **Gemini simulation as production input** | Lab only. Production Collector must be official X API or licensed data (`02` §2). |

**Why draw the line here and not further out:** this boundary encloses exactly the set of capabilities buildable on *cheap, legitimate* data. Everything outside it depends on data we've shown (§3) to be gated or expensive. Committing to those before the funded data access exists would be designing around data we don't have — the exact failure mode §1 warns against.

---

## 5. Cost & latency budget (MVP)

> Placeholders to be filled once your target API tier is chosen — but the *structure* of the budget is the point.

| Dimension | Budget (fill in) | Why it's a hard constraint |
|-----------|------------------|----------------------------|
| API calls per topic run | e.g. ≤ N search calls | Directly caps candidate-set size → caps recall. Retrieval is the only recall-sensitive stage (`01` §2). |
| $ per topic run | e.g. ≤ $X | If a single topic report costs more than it's worth, it's not a product (`00` S4). |
| Wall-clock per run | e.g. ≤ M minutes | Batch tolerates minutes; sets embedding/graph compute ceiling. |
| LLM tokens (report step) | e.g. ≤ T tokens | Report step only — it explains ≤10 posts, not thousands (that's why summarization is last, `01` ⑨). |

**Action item:** the first engineering task is a **spike** that measures actual cost/latency of collecting a broad candidate set for one topic at the chosen tier. Everything else is estimated on sand until that number exists.

---

## 6. Reality-adjusted definition of "done" for MVP

The MVP ships when, for a single topic on cheap+legitimate data, it satisfies S1, S3, S4 fully and **either**:
- satisfies S2 (provenance ≥70%) → we keep the provenance claim, **or**
- fails S2 → we ship as a **"high-signal original finder"**, drop the causal-provenance language, and log S2 as blocked-on-data for Phase 3.

**Why encode the fallback into "done":** it removes the pressure to overclaim. A truthful "high-signal finder" is a real product; a "provenance engine" that quietly returns the best-marketed post is a liability.




description: The constraint layer — X data-access reality, capability ladder, honest MVP boundary, budgets

name: Write
input:
file_path: /home/nate.meyer/src/code/metrics/docs/03-build-spec.md
content: |-
# 03 · Build Spec

> Prereq: `01-architecture.md`, `02-reality-and-mvp.md`. This is the buildable MVP: data model, components, chosen (and rejected) libraries, interfaces.

---

## 1. Tech stack — chosen, with rejections

**Why "with rejections":** the source discussion listed many repos and explicitly said *"ignore half the list."* Recording *why* something was rejected prevents re-adding it later.

### 1.0 Active implementation path (updated 2026-07-11)

The **live repo** is a **TypeScript** full-stack prototype (AI Studio / Gemini), not the Python path below. See **`00b-codebase-reality`**. Going forward:

| Concern | **Active (this monorepo)** | Notes |
|---------|----------------------------|-------|
| Language / app | **TypeScript — Express + React/Vite** | `server.ts`, `src/` |
| LLM | **Google Gemini** via `@google/genai` | Simulation (lab only), report, Search grounding |
| Graph / provenance | **In-memory** edges + DSU + `runProvenancePipeline` | No Neo4j; formulas aligned with `04` |
| Semantic similarity (current) | **Jaccard keyword overlap** (threshold 0.45) | Placeholder until embeddings justified by real volume |
| Storage (current) | **In-memory cache** | Must become Postgres/SQLite when runs must persist |
| Collection (target) | **Official X API client** (thin `fetch` or Tweepy-equivalent in Node) | Replace Gemini simulation; still **reject** snscrape / Twikit |
| Image hashing (target) | Real pHash when media URLs are real | Today: simulated `media_hashes` strings only |
| UI | **Shipped early** (dashboard) | Lab workstation; production claims still need real data + S1–S2 |

### 1.1 Reference design (Python path — not current code)

Kept for historical/design comparison. **Do not implement a second parallel stack** unless explicitly decided.

| Concern | Chosen (reference) | Rejected (and why) |
|---------|--------------------|--------------------|
| Language | **Python 3.11+** | — NLP/graph ecosystem; *superseded by active TS monorepo* |
| X collection | **Tweepy** (official X API client) | `snscrape` — non-functional vs. X today (`02`). `Twikit`/browser automation — **ToS violation** (`02`). |
| Embeddings | **Sentence-Transformers** (`bge-*` or `e5-*`; consider `BERTweet` for tweet-native text) | Custom training — premature (`02` §4). |
| Vector store | **Qdrant** (self-hostable, OSS) | Pinecone — managed/proprietary; skip for OSS stack. |
| Near-dup detection | **datasketch** (MinHash/LSH) + **rapidfuzz** | textdistance kept optional; rapidfuzz is faster for pairwise. |
| Graph | **NetworkX** (prototype) → **igraph** (scale) | Neo4j — only if graph queries become a product surface; overkill for batch MVP. |
| Image hashing | **imagehash** (pHash/dHash) | — needed for screenshot detection edge. |
| Orchestration | Plain Python + a task runner (e.g. **Prefect** or cron) | Heavy streaming infra (Kafka etc.) — out of scope (batch, `02`). |
| Storage | **SQLite** (MVP) → Postgres (later) | — SQLite is enough for single-topic batch. |
| LLM (report step) | Any capable model via API | — used only at stage ⑨ in pure design; prototype also uses LLM for simulation. |

**Why not dual-stack:** provenance math is already portable in TS; rewriting into Python would duplicate `04` without unlocking data access.

---

## 2. Data model (source-agnostic)

**Why source-agnostic now** (`01` §6): so a second source can be added later without a schema rewrite. The X-specific bits live in a `source_meta` blob, not in the core columns.

```python
# Core content node — source-agnostic
@dataclass
class ContentItem:
    id: str                    # internal UUID
    source: str                # "x" for MVP; future: "reddit", "hn", ...
    source_native_id: str      # tweet id, etc. (in source_meta too)
    author_id: str
    created_at: datetime       # UTC — critical for provenance ordering
    text: str
    urls: list[str]            # extracted external links
    media_hashes: list[str]    # perceptual hashes of attached images
    mentioned_authors: list[str]
    parent_id: str | None      # reply-to (internal id if resolvable)
    quoted_id: str | None      # quoted content (internal id if resolvable)
    entities: list[str]        # NER output
    embedding: list[float] | None
    source_meta: dict          # raw source-specific fields (engagement, etc.)

@dataclass
class Author:
    id: str
    source: str
    handle: str
    verified: bool
    follower_count: int | None
    # community_id, credibility_score — populated in later phases
    source_meta: dict

@dataclass
class Edge:
    src: str                   # ContentItem.id
    dst: str
    kind: str                  # quote|reply|same_url|same_image_hash|
                               # semantic_sim|shared_entity|shared_hashtag|
                               # time_proximity|same_external_article
    directed: bool
    weight: float
    evidence: dict             # e.g. {"cosine": 0.91} or {"phash_dist": 2}
```

**Why `created_at` is called out as critical:** provenance ordering *is* timestamp ordering plus authority. If timestamps are missing, wrong-timezone, or coarse, provenance degrades to a guess. Normalize everything to UTC at ingest; store source-native timestamps in `source_meta` for audit.

**Why `evidence` on every edge:** the final report must *justify* its provenance claim (cross-verification, `01` ⑧). An edge without evidence is an assertion; with evidence it's a citation.

---

## 3. Components (map to `01` stages)

### 3.1 Collector (stage ①)
- **In:** topic spec (keywords, hashtags, phrases, optional author seeds).
- **Out:** raw `ContentItem[]` (candidate pool).
- **Behavior:** issue bounded search calls (respect `02` §5 budget), paginate up to budget, extract URLs/media/mentions/quote/reply at ingest.
- **Why bounded here specifically:** this is the *only* recall-sensitive stage (`01`), and the *only* stage that spends X-API money. Bound it explicitly and log calls used per run.

### 3.2 Noise Filter (stage ②)
- Rules + lightweight classifier: drop ads, obvious spam, engagement bait ("This is huge", "Thoughts?", "10 lessons…", bare "Wow").
- **Why rules before ML:** the bait patterns are cheap, high-precision, and cutting them early shrinks everything downstream (cost + graph cleanliness).

### 3.3 Deduplicator (stage ③)
- MinHash/LSH (datasketch) for near-dup candidates → rapidfuzz confirm → collapse.
- Screenshots handled via `same_image_hash` at graph stage, **kept as nodes** (their existence is signal), but flagged `derivative`.
- **Why keep quotes/threads distinct here:** their edges are provenance evidence (`01` §2 ③). Only collapse content-identical rewrites/reposts.

### 3.4 Graph Builder (stage ④)
- Instantiate nodes; add edges per §2 `Edge.kind` using the extractors:
  - `quote`, `reply` from source fields (directed).
  - `same_url`, `same_external_article` from URL extraction.
  - `same_image_hash` from imagehash (pHash distance ≤ threshold).
  - `semantic_sim` from Qdrant top-k over embeddings (undirected, weighted by cosine).
  - `shared_entity`, `shared_hashtag`, `time_proximity` from extracted features.
- **Why thresholds are config, not constants:** every edge type has a precision/recall knob; these must be tunable against the rater panel (`00` S1–S2) without code changes.

### 3.5 Provenance Detector (stage ⑥) — see `04` for the rule
- Per connected component, select source node.
- **Why it gets its own file:** it's the product's reason to exist (`00` S2) and the logic is subtle enough to warrant dedicated treatment (`04`).

### 3.6 Ranker (stage ⑦) — see `04`
- Emits a **vector** of scores per source, not one number.

### 3.7 Verifier (stage ⑧)
- For each candidate original, attempt confirmation: does an official account / ≥2 independent accounts corroborate? Attach to `evidence`.
- **Why:** the report asserts originality; unverified assertion-as-fact is disallowed.

### 3.8 Reporter (stage ⑨)
- LLM formats the surviving ≤10 originals into the output schema (§4).
- **Why LLM only here:** it explains survivors; it does not find them (`01` ⑨).

---

## 4. Output schema (per topic)

Mirrors the source discussion's requested shape, tightened:

```yaml
topic: "AI Coding"
run_meta:
  collected_candidates: 1000
  after_dedup: 250
  components: 18
  api_calls_used: 42          # against budget (02 §5)
originals:                    # ≤ 10
  - rank: 1
    content_id: "..."
    author: { handle, verified, follower_count }
    why_it_matters: "..."     # LLM, grounded in evidence
    evidence:                 # from Edge.evidence + Verifier
      earliest_in_component: true
      original_media: true
      corroborated_by: ["@official", "@indep1"]
    scores:                   # NOT collapsed (see 04)
      originality: 0.0-1.0
      authority:   0.0-1.0
      influence:   0.0-1.0
      evidence:    0.0-1.0
      freshness:   0.0-1.0
      community_validation: null   # Phase 3+ (02)
    derivatives:              # what copied it
      copied_narratives: ["...", "..."]
      notable_followups: ["...", "..."]
    current_relevance: "..."
```

**Why keep `community_validation: null` visible rather than omitting it:** it advertises, in the artifact itself, exactly which signal is blocked on data (`02` §3). Future readers see the seam instead of assuming it was forgotten.

---

## 5. Repository layout

### 5.0 Actual monorepo layout (2026-07-11)

```
X-KES/
├─ X - Knowledge Signal Engine 10Jul26.md   # this SSOT
├─ X_-_Capture_and_Context_Pipeline_11Jul26.md
├─ HANDOFF.md                 # deep tech handoff for prototype
├─ server.ts                  # Express API + pipeline + Gemini + fallback
├─ src/
│  ├─ types.ts                # ContentItem, Edge, ScoreVector, KSERunResult…
│  ├─ App.tsx                 # dashboard orchestrator
│  ├─ components/
│  │  ├─ Sidebar.tsx          # search, weight sliders, alerts, time window
│  │  ├─ RelationshipGraph.tsx
│  │  ├─ OriginalCard.tsx
│  │  └─ Tooltip.tsx
│  ├─ main.tsx
│  └─ index.css
├─ package.json               # npm run dev → tsx server.ts
├─ vite.config.ts
└─ .env.example               # GEMINI_API_KEY, APP_URL
```

**Still missing (must add for production path):** `collect/` (real X), persistent storage, `config/` files (weights currently hardcoded + UI), `tests/` + rater fixtures, `scripts/spike_collect.*` (Node or Python) for `02` §5.

### 5.1 Reference Python layout (not current)

```
metrics/
├─ docs/
├─ src/kse/   # collect, normalize, filter, dedup, graph, provenance, rank, verify, report
├─ config/
├─ tests/
└─ scripts/spike_collect.py
```

**Why the collection spike is still first:** per `02` §5, every cost estimate is sand until real X collection is measured. Gemini simulation cost ≠ X search cost.


description: Buildable MVP spec — stack (chosen/rejected), source-agnostic data model, components, output schema, repo layout

name: Write
input:
file_path: /home/nate.meyer/src/code/metrics/docs/04-ranking-and-provenance.md
content: |-
# 04 · Ranking & Provenance

> Prereq: `01-architecture.md` (graph model), `03-build-spec.md` (data model). This file specifies the two hardest, most product-defining pieces: **how we decide which post is the original**, and **how we score originals** — plus the rationale for every design choice.

---

## 1. Provenance detection: which node is the original?

### 1.1 Definition of "original" (the contract)

A post P is the **original** for a connected component C if it best satisfies, in roughly this priority:

1. **Earliest credible timestamp** within C.
2. **Original media**, not a screenshot of another post (via `same_image_hash` — the screenshot points *back* to something earlier).
3. **First announcement / first technical explanation**, not reaction.
4. **Author directly involved / official source** (the person shipping the thing, the org's account).
5. **Lowest derivative score** (see §1.3).

**Why "earliest" is necessary but not sufficient:** the earliest post in a component can still be a low-authority rumor or a bot. Timestamp gets you ordering; authority and involvement get you *credibility*. Original = earliest **credible** node, not merely earliest node.

### 1.2 What is explicitly NOT the original

Reaction/commentary posts, regardless of engagement: *"This is huge"*, *"Wow"*, *"Thoughts?"*, *"Here's what happened"*, *"10 lessons from…"*. These are the derivatives the whole system exists to filter out.

**Why call these out explicitly:** they are exactly the posts that win on likes and therefore win in every naive system. Naming them as non-originals in the contract makes the filter testable.

### 1.3 Derivative score (per node)

A node's `derivative_score` rises with evidence that it descends *from* something else:

| Signal | Contribution to derivative_score |
|--------|----------------------------------|
| Is a `quote` of an in-component node | high |
| Is a `reply` under an in-component node | medium |
| `same_image_hash` matches an earlier node (screenshot) | very high |
| Near-dup of an earlier node (rewrite/repost) | very high |
| Later `created_at` than a `same_url`/`same_article` neighbor | medium |
| Reaction-language classifier fires | medium |

**Why a derivative score instead of a binary flag:** provenance is probabilistic. A post can be *partly* original (adds a technical explanation) while *partly* derivative (built on someone's announcement). A continuous score lets the source-selection rule weigh it rather than mis-binarize it.

### 1.4 The selection rule

Per component C, the source node maximizes:

```
source_fitness(P) =
      w_time  · time_priority(P, C)      # earlier ⇒ higher
    + w_auth  · authority(P)             # author authority
    + w_infl  · downstream_influence(P)  # how much of C descends from P
    − w_deriv · derivative_score(P)      # penalize derivatives
```

- `time_priority` normalized within the component (earliest → 1.0).
- `downstream_influence` = size/weight of the sub-graph reachable *from* P along directed (quote/reply) edges + neighbors that postdate P on shared-url/article edges.
- Weights `w_*` live in `config/`, tuned against the rater panel (`00` S2).

**Why `downstream_influence` and not just "earliest":** the original is the node the rest of the component *flows from*. In a healthy component the earliest credible node is also the one with the largest downstream footprint — when those two disagree, it's usually because the earliest node is a low-signal coincidence, and downstream footprint corrects for it.

**Why the minus sign on derivative_score:** a node can be early *and* obviously a screenshot (someone screenshots then posts fast). The penalty ensures "early screenshot" never beats "slightly-later original media."

### 1.5 Reality caveat (from `02`)

Directed edges (`quote`, `reply`) power `downstream_influence` and are the strongest provenance signals — **but they're the data most likely to be gated/rate-limited** (`02` §3). So the rule is built to **degrade gracefully**: if quote/reply edges are sparse, `source_fitness` leans harder on `time_priority` + `same_url`/`same_image_hash` + authority, all of which run on cheap data. This graceful degradation is *why* `00` S2 has a fallback rather than being a hard gate.

---

## 2. Multi-signal ranking (after a source is chosen)

Provenance (§1) answers *which node is the original* per component. Ranking answers *which originals matter most* for the ≤10 report. These are deliberately separate stages (`01` ⑥ then ⑦).

**Why separate:** a node can be the true original of a low-value conversation (e.g. a joke that spawned 200 derivatives). Provenance must still identify it correctly; ranking must still be free to rank it low. Collapsing "is original" into "is valuable" is how systems start quietly rewarding engagement bait that happens to be first.

### 2.1 The score vector (never collapsed until presentation)

Each selected source emits a **vector**, not a scalar. Matches the output schema in `03` §4:

| Score | Range | What it measures | Primary inputs |
|-------|-------|------------------|----------------|
| `originality` | 0–1 | How strongly this node is the component origin | inverse of `derivative_score`, `source_fitness` rank within C, original-media flag |
| `authority` | 0–1 | Author credibility on *this* topic | verified, follower_count (log-scaled, capped), historical original-content ratio if available, official-account match |
| `influence` | 0–1 | How much of the discussion descends from it | `downstream_influence` (directed edges) + same_url / same_image_hash neighbors that postdate it |
| `evidence` | 0–1 | How well the claim is corroborated | Verifier (`03` 3.7): official account, ≥2 independent accounts, link to primary artifact (paper, repo, product page) |
| `freshness` | 0–1 | Recency relative to the topic window | `created_at` vs. query window; decays outside the operator-chosen range |
| `community_validation` | 0–1 or `null` | Independent respected voices amplifying | **MVP: always `null`** — blocked on community graph data (`02` §3). Field kept visible so the seam is explicit (`03` §4). |

**Why these six and not twenty:** each maps to a distinct failure mode the product must defend against.

- Without `originality` → best-marketed derivative wins.
- Without `authority` → earliest bot wins.
- Without `influence` → a correct-but-ignored source ranks above the one that actually seeded the conversation.
- Without `evidence` → the report asserts originality as fact with no corroboration (`01` ⑧).
- Without `freshness` → stale canonical posts drown current signal.
- Without a *reserved* `community_validation` slot → Phase 3 quietly invents a new schema instead of filling a known null.

### 2.2 Why we don't collapse scores (until presentation)

Collapsing to a single number too early destroys three things the product needs:

1. **Explainability.** "Rank #1 because score=0.87" is not an explanation. "High originality + high evidence, moderate influence" *is* — and it is exactly what the Reporter (`03` 3.8) needs to write `why_it_matters` without hallucinating reasons.
2. **Tunability.** Different operators care about different faces (a researcher wants evidence+originality; a PM wants influence+freshness). A collapsed score freezes that tradeoff into weights that nobody can inspect at read time.
3. **Honest degradation.** When `community_validation` is null, a collapsed formula must either invent a default or silently reweight. A vector makes the missing signal *visible* in the artifact (`03` §4 rationale).

**Presentation-time ordering (the only place a scalar appears):**

```
presentation_score(P) =
      α · originality
    + β · authority
    + γ · influence
    + δ · evidence
    + ε · freshness
    + ζ · community_validation   # 0 when null; ζ itself is 0 at MVP
```

Weights live in `config/` (same home as provenance `w_*`). Defaults favor **originality + evidence** over raw influence — because the product promise is provenance, not popularity. Operators may reweight; the vector in the report never disappears.

**Why a presentation scalar at all:** humans and UIs need an ordered list of ≤10. The scalar is a *display sort key*, not a stored truth. Stored truth is the vector.

### 2.3 Per-score formulas (MVP-implementable)

All formulas below use only data available on the cheap/legitimate path (`02` §3). Gated inputs appear as optional terms that default to neutral when missing.

#### Originality

```
originality(P, C) =
    clip01(
        0.45 · time_priority(P, C)
      + 0.25 · (1 − derivative_score(P))
      + 0.20 · original_media(P)          # 1 if media not a screenshot of earlier node
      + 0.10 · source_fitness_rank_norm   # rank of source_fitness within C → [0,1]
    )
```

**Why heavily weighted on time + inverse derivative:** those are the two signals that survive without quote/reply graphs. Fitness rank is a soft tie-break, not the spine.

#### Authority

```
authority(P) =
    clip01(
        0.35 · verified_bonus             # 1 if verified else 0
      + 0.35 · log_followers_norm         # log1p(followers) / log1p(cap)
      + 0.20 · official_or_involved       # handle matches product/org/person in entities
      + 0.10 · prior_original_ratio       # if history available; else 0.5 neutral
    )
```

**Why log-scale followers and cap them:** raw follower count is a popularity channel. Log + cap keeps "has an audience" without letting mega-accounts dominate every component they touch. **Why official/involved is a first-class term:** the person shipping the thing is often medium-followed and still the correct authority; follower count alone misses them.

#### Influence

```
influence(P, C) =
    clip01(
        0.60 · downstream_influence_norm(P, C)   # directed, when edges exist
      + 0.40 · cheap_reach_norm(P, C)            # later same_url / same_image_hash / semantic neighbors
    )
```

When directed edges are sparse (`02` §3), `downstream_influence_norm` → 0 and influence **falls through** to `cheap_reach_norm`. That is intentional degradation, not a bug — same philosophy as §1.5.

**Why influence is not likes/RTs:** engagement metrics measure *distribution quality of a post*, not *causal role in a component*. A quote-summary with great copy can out-like the original; counting likes would recreate the naive ranking this system exists to replace.

#### Evidence

```
evidence(P) =
    clip01(
        0.40 · official_corroboration     # 1 if official account confirms / is the author
      + 0.30 · independent_corroboration  # min(1, n_independent / 2)
      + 0.30 · primary_artifact_link      # links to paper, repo, changelog, product URL
    )
```

Produced primarily by the Verifier (`03` 3.7). **Why evidence is a score and not a boolean gate:** some true originals have no official account (independent researchers). Gating would drop them; scoring lets them survive with lower confidence visible in the report.

#### Freshness

```
freshness(P, window) =
    clip01( 1 − age(P) / window_length )   # 0 outside window if hard-clip configured
```

**Why freshness is last among equals, not first:** a provenance engine that overweights freshness becomes a trend scraper. The default presentation weights keep freshness as a secondary sort among strong originals, not a ticket to the top 10.

#### Community validation (Phase 3+)

```
community_validation(P) = null   # MVP contract
# Later:
#   fraction of distinct high-credibility communities that independently
#   linked/quoted P within a short window — NOT total engagement.
```

**Why the definition is written now even though the value is null:** so Phase 3 fills a known contract instead of redesigning the score vector. Cross-community *independent* attention is the signal; single-community pile-on is not (see `01` §5).

### 2.4 Ranking procedure (end-to-end)

1. Run provenance (`§1`) per connected component → candidate sources.
2. Drop sources that fail hard filters: pure engagement bait (S3), empty text, unresolved spam.
3. Compute the score vector for each remaining source.
4. Sort by `presentation_score` (config weights).
5. Take top ≤10.
6. Hand the ordered list + full vectors + edge evidence to Verifier → Reporter.

**Why hard filters before soft scores:** a bait post with accidentally high `time_priority` must not be "rescued" by weight tuning. S3 is a product invariant, not a weight.

---

## 3. Edge cases and adversarial patterns

These are the patterns that break naive systems. Each has an explicit handling rule so they become tests, not surprises.

| Pattern | Why it fools naive systems | Our handling |
|---------|---------------------------|--------------|
| **Early screenshot** | Earliest timestamp + high engagement | `same_image_hash` → very high `derivative_score`; originality and `source_fitness` both penalize (`§1.4`) |
| **Fluent AI rewrite of the original** | Semantic sim clusters it with origin; may out-like it | Near-dup collapse (`03` 3.3) or high derivative if slightly later; never selected as source if earlier original media exists |
| **Official account late to its own news** | Authority is high but not first | Authority helps; time_priority + downstream_influence still prefer the true first credible post. Official late post becomes strong *evidence* for the earlier original, not a replacement — unless the earlier post is low-credibility rumor |
| **Quote-tweet that adds the real technical content** | Pure "first" rule misses the better original explanation | `source_fitness` allows a slightly later node to win when derivative_score is low *and* downstream_influence is high *and* reaction-language classifier is off. Document as "first technical explanation" (`§1.1` item 3) |
| **Coordinated engagement bait** | Likes/RTs look like influence | Influence ignores likes; noise filter kills bait language; S3 rater check |
| **Missing quote/reply edges (tier limit)** | Cascade-based provenance collapses | Graceful degradation (`§1.5`, `§2.3` influence) onto time + url + image + authority |
| **Two independent true originals (same idea, no copy)** | Graph may still connect via semantic_sim | If no directional/url/image evidence of descent, components may split or both survive as separate sources. Prefer over-splitting to false "A copied B" claims — honesty over forced uniqueness |

**Why over-split beats false provenance:** a wrong "this caused that" claim is worse than returning two related originals. S2 measures correct origin *within a cluster*; inventing causal edges the data doesn't support violates the Verifier/honesty rule (`01` ⑧).

---

## 4. Tuning, evaluation, and the rater loop

### 4.1 What gets tuned

| Knob | Location | Tuned against |
|------|----------|---------------|
| Provenance weights `w_time, w_auth, w_infl, w_deriv` | `config/` | S2 (source identification) |
| Presentation weights `α…ζ` | `config/` | S1 (precision@10 human agreement) + operator preference |
| Edge thresholds (cosine, pHash distance, etc.) | `config/` | Graph quality / component purity (rater-labeled clusters) |
| Noise-filter rules | `config/` + code | S3 (zero bait in top 10) |

**Why all knobs are config:** the Source Finder and Ranker must be tunable against the rater panel without code changes (`03` 3.4). If a weight requires a deploy, it will not get tuned.

### 4.2 Evaluation fixtures (required before claiming S1/S2)

- **Labeled clusters:** for N topics, human-labeled connected components and the true original per component.
- **Bait negatives:** posts that must never appear in top 10.
- **Degraded-data runs:** same fixtures with quote/reply edges stripped — measures graceful degradation (`§1.5`). If S2 collapses without directed edges, log it and activate the `02` §6 fallback (ship as high-signal finder).

**Why degraded-data runs are mandatory:** production *will* often look like the degraded case (`02` §3). Evaluating only on full graphs overstates provenance accuracy and sets up a false launch claim.

### 4.3 What "good" looks like (ties back to `00` §3)

| Criterion | Ranking/provenance responsibility |
|-----------|-----------------------------------|
| S1 precision@10 | Presentation weights + hard filters + quality of candidate sources |
| S2 origin@cluster ≥70% | `source_fitness` + derivative score + edge quality |
| S3 zero bait | Noise filter + reaction-language term in derivative_score |
| S4 budget | Ranking itself is local compute; must not trigger extra API calls. Influence/authority use already-collected fields only |

**Invariant:** the Ranker and Source Finder spend **$0 of X API budget**. All API spend is confined to Collector (`03` 3.1, `02` §5). If a ranking idea requires a new API call per candidate, it is out of MVP scope.

---

## 5. Interface contract (for implementers)

```python
# provenance.py
def select_source(component: Graph, cfg: ProvenanceConfig) -> ContentItem:
    """Maximize source_fitness; return the origin node for component C."""

def derivative_score(node: ContentItem, component: Graph, cfg) -> float: ...

# rank.py
def score_vector(source: ContentItem, component: Graph, cfg: RankConfig) -> ScoreVector:
    """Return originality, authority, influence, evidence, freshness, community_validation."""

def presentation_order(sources: list[ScoredSource], cfg: RankConfig) -> list[ScoredSource]:
    """Sort by presentation_score; truncate to cfg.top_k (≤10). Does not mutate vectors."""
```

**Why thin interfaces:** roles stay independently testable (`01` §4). Source Finder tests use labeled components; Ranker tests use fixed sources with known vectors; neither needs the Collector.

---


description: Ranking & provenance — original selection rule, multi-signal score vector, no early collapse, edge cases, rater-loop tuning

name: Write
input:
file_path: /home/nate.meyer/src/code/metrics/docs/05-roadmap.md
content: |-
# 05 · Roadmap

> Prereq: `00`–`04`. This is not a calendar. Every phase is **gated on a proven capability or a data-access unlock**, not on a date. If a gate fails, the phase does not start — scope changes instead.

---

## 1. Why capability-gated, not calendar-gated

Calendar roadmaps in data-constrained products produce one of two lies: (a) "we're on track" while blocked on API tier, or (b) shipping a popularity ranker labeled as provenance to hit a date. Capability gates make the block *visible* and force the honest descope path already encoded in `02` §6 and `00` S2.

**Rule:** no phase begins until its entry gate is measured and green. Gates are binary where possible; "feels ready" is not a gate.

---

## 2. Phase map

```
Phase 0  Spike & contracts
    │  gate: cost/latency number exists; tier chosen; ToS path clean
    ▼
Phase 1  Thin vertical slice (one topic → report)
    │  gate: S1, S3, S4 green; S2 measured (pass or explicit fallback)
    ▼
Phase 2  Harden provenance & ranking
    │  gate: S2 ≥70% on labeled set *or* product repositioned per 02 §6
    ▼
Phase 3  Data-unlocked intelligence
    │  gate: paid data access that actually yields quote/community graphs
    ▼
Phase 4  Multi-source & product surface
    │  gate: X path stable; second source justified by user demand
    ▼
Phase 5  Vision-layer (cascades, full dashboard)
         gate: volume + graph fidelity that make cascade math meaningful
```

---

## 3. Phase 0 — Spike & contracts (FIRST)

**Goal:** replace sand estimates with one real number; lock the legitimacy boundary.

| Work item | Done when | Why first |
|-----------|-----------|-----------|
| `scripts/spike_collect.py` | Measures API calls, $, wall-clock for one topic candidate pull at the chosen tier | `02` §5 / `03` §5 — every later estimate depends on this |
| Tier decision | Written in config: which X API tier, what endpoints, what is *not* available | Stops design from assuming quote graphs you didn't buy |
| Legitimacy check | Written rejection of Twikit/scraping; vendor path only if funded | `02` §2 — no ToS-shaped time bombs |
| Rater fixture skeleton | ≥1 topic with labeled "originals" and "bait" examples | Unblocks S1–S3 measurement in Phase 1 |
| Doc freeze for MVP boundary | `02` §4 In/Out list agreed | Prevents scope creep during the first build |

**Exit gate (all required):**

1. Spike numbers committed to the budget table in `02` §5 (fill the placeholders).
2. Collection path is official API or licensed vendor — not scraping.
3. Success criteria S1–S4 still accepted as the definition of done (`00` §3).

**If spike cost > willingness to pay:** stop. Descope candidate-set size, narrow the topic, or pause. Do not "make it up in ranking."

---

## 4. Phase 1 — Thin vertical slice (MVP build)

**Goal:** one topic in → ≤10 explained originals out, on cheap legitimate data.

### 4.1 Build order (dependency-respecting)

| Step | Component | Depends on | Proves |
|------|-----------|------------|--------|
| 1 | Collector + normalize (`ContentItem`) | Phase 0 spike | Bounded retrieval within budget |
| 2 | Noise filter | Collector | S3 path starts working |
| 3 | Deduplicator (MinHash/LSH + rapidfuzz) | Normalize | Candidate set is tractable |
| 4 | Graph builder (cheap edges only) | Dedup + media hash + URLs + embeddings | Components exist without gated edges |
| 5 | Provenance detector (`04` §1) | Graph | S2 is *testable* |
| 6 | Multi-signal ranker (`04` §2) | Provenance | Ordered ≤10 with vectors |
| 7 | Verifier (best-effort) | Ranker | Evidence field not empty fiction |
| 8 | Reporter (LLM, schema `03` §4) | Verifier | Human-readable artifact |

**Why this order and not "dashboard first":** each step has a testable output without UI. The report schema *is* the product surface for MVP. A dashboard before S1/S2 is decoration on an unproven core.

### 4.2 Phase 1 exit gate

| Check | Required |
|-------|----------|
| S1 precision@10 | ≥ threshold on rater panel for the pilot topic |
| S3 zero bait | Hold on the same runs |
| S4 cost/latency | Within Phase 0 filled budgets |
| S2 provenance | **Measured and recorded** — pass (≥70%) *or* formal fallback to "high-signal finder" (`02` §6) |
| Output schema | Stable; `community_validation: null` present |
| No ToS-violating collection | Still true |

**Ship condition:** exit gate green. Marketing language must match the S2 outcome (provenance engine *or* high-signal finder — not both).

---

## 5. Phase 2 — Harden provenance & ranking

**Entry gate:** Phase 1 shipped; rater loop running.

**Goal:** make S2 robust under degraded data; stabilize weights; expand fixture set.

| Work item | Why |
|-----------|-----|
| Expand labeled clusters across ≥K topics | One-topic success is not a product |
| Degraded-edge evaluation runs (`04` §4.2) | Production often lacks quote/reply density |
| Weight search against fixtures (provenance + presentation) | Move knobs using evidence, not intuition |
| Screenshot / rewrite adversarial suite (`04` §3) | These are the classic false-original paths |
| Authority features v2 (topic-local, not global followers) | Reduces mega-account bias |
| Observability: log edge-type counts, budget burn, score vectors per run | Without this, production failures are undiagnosable |

**Exit gate:**

- S2 ≥70% on the multi-topic labeled set **with degraded-edge runs within an agreed drop tolerance**, **or**
- Product permanently repositioned; provenance language removed from UX; Phase 3 cascade work deprioritized.

**Why Phase 2 exists as its own phase:** Phase 1 proves the pipe; Phase 2 proves the *claim*. Shipping Phase 1 without Phase 2 is acceptable only with the fallback label.

---

## 6. Phase 3 — Data-unlocked intelligence

**Entry gate (hard):** funded, legitimate access that yields at least one of:

- reliable quote-tweet / conversation edges at usable volume, and/or
- author interaction or follow graph sufficient for community detection.

Until that gate is green, **do not schedule Phase 3 work**. Designing Louvain pipelines against imaginary graphs is the failure mode `02` §1 exists to prevent.

| Unlock | Capability enabled | Notes |
|--------|-------------------|-------|
| Dense quote/reply edges | Stronger `downstream_influence`; tighter S2 | Re-tune `w_infl`; re-run degraded vs full comparison |
| Author interaction / follow graph | `community_validation` becomes non-null | Fill the reserved score; update presentation weights carefully |
| Higher archive retention | Multi-window trends (1h → 30d) | Still batch-first unless streaming is separately justified |
| Full RT graph (if ever) | Cascade / diffusion analysis (`01` §5) | **Not** required to start Phase 3; often still gated |

**Exit gate:** at least one previously-null intelligence signal is live in the report schema with a measured lift on S1/S2 (or a documented decision that it doesn't lift and should stay off).

---

## 7. Phase 4 — Multi-source & product surface

**Entry gate:** X path stable in production; clear demand for a second source *or* a UI beyond the report artifact.

| Work item | Why this phase, not earlier |
|-----------|----------------------------|
| Second source adapter (e.g. HN, Reddit, RSS) using source-agnostic model (`01` §6, `03` §2) | Abstraction was prepared in MVP so this is additive, not a rewrite — but only after X provenance is real |
| Cross-source `same_url` / `same_external_article` edges | Often the highest-value multi-source provenance link |
| Minimal product UI (run history, topic configs, report browser) | Operators need something other than YAML-in-terminal once trust exists |
| Auth, multi-tenant, billing — only if going multi-user | Premature before single-operator value is proven |

**Exit gate:** second source contributes at least one accepted original in rater review that X-only missed, **or** UI is in daily operator use for the X-only path. Vanity multi-source without rater lift is not an exit.

---

## 8. Phase 5 — Vision layer (explicitly last)

Only after Phases 1–3 are real:

- Cascade / diffusion trees (Hawkes or simpler empirical trees) when RT/quote graphs justify them (`01` §5, `02` §4).
- Full multi-section intelligence dashboard (the deferred "12-section" surface).
- Streaming / near-real-time runs if cost model supports continuous spend.
- Custom model training if off-the-shelf embeddings are the measured bottleneck (not before).

**Why last:** every item here multiplies cost and complexity. They amplify a working provenance core; they cannot substitute for one.

---

## 9. Cross-cutting work (all phases)

| Concern | Rule |
|---------|------|
| **Legitimacy** | No scraping. Re-check X developer terms when tiers change (`02` §2 warning). |
| **Budgets** | Collector is the only API spender; Ranker/Source Finder are $0-API (`04` §4.3). |
| **Config over code** | Weights and thresholds in `config/`; tuned via rater loop. |
| **Honesty in language** | UX and docs match S2 reality — provenance vs high-signal finder. |
| **Schema seams** | Keep `community_validation` and other Phase-3 fields visible as null rather than deleting them. |
| **Tests** | Per-role tests (`01` §4); fixture-based S1–S3 checks before any "we're done" claim. |

---

## 10. Immediate next actions (after reading this doc set)

> **Codebase-aware (2026-07-11):** the algorithm lab + dashboard already exist on simulated data. Do not re-build the UI from zero. See also `00b`.

1. **Run the collection spike** at the intended X API tier (`scripts/spike_collect.ts` or equivalent); fill `02` §5. *Gemini sim cost does not count.*
2. **Pick the pilot topic** and build the first rater fixture (originals + bait) against *real* posts when available; until then, freeze fixtures from the fallback dataset only for unit tests of `runProvenancePipeline`.
3. **Wire Collector into the existing pipeline** — replace Stage ① simulation; keep graph/provenance/rank/report/UI.
4. **Gate demo hacks** (forced noise injection) behind `DEMO_MODE`.
5. **Measure S2 under full and degraded edges** before writing any launch copy.
6. **Only then** decide Phase 2 hardening vs. formal fallback labeling ("high-signal finder").
7. **Do not start Capture Pipeline code inside KSE server** — keep systems separate (companion SSOT).

**Why this sequence is non-negotiable:** it is the only path that keeps the architecture (`01`), the reality constraint (`02`), the buildable spec (`03`), and the ranking contract (`04`) aligned with what the product is allowed to claim — without discarding the working prototype.

---

## Appendix A — Document set checklist

| Doc | Role | Status when this roadmap is followed |
|-----|------|--------------------------------------|
| `00-overview` | Problem, vision, success criteria, map | Frozen as contract for S1–S4 |
| `01-architecture` | Graph-first pipeline, roles, edges | Implemented selectively per phase |
| `02-reality-and-mvp` | Binding constraint, MVP boundary, budgets | Phase 0 fills numbers; gates all later phases |
| `03-build-spec` | Stack, data model, components, schema, repo | Phase 1 implementation guide |
| `04-ranking-and-provenance` | Source fitness + score vector + tuning | Phase 1–2 core logic |
| `05-roadmap` | Capability-gated phases | This file — operating plan |

---

## Appendix B — One-page MVP reminder

```
IN:   one topic, official X API, batch run, budget hard-capped
PIPE: collect → filter → dedup → cheap graph → provenance → score vector → verify → report
OUT:  ≤10 posts, each with why + evidence + un-collapsed scores
WIN:  S1 + S3 + S4, and S2 either held or honestly dropped
NOT:  scraping, streaming dashboard, cascades, community graph, multi-source, custom models
```

If a proposed task is not required by the IN/PIPE/OUT/WIN lines and is listed under NOT, it is not MVP work.

---

## Appendix C — Prototype vs production (one-page)

```
PROTOTYPE (shipped in this repo, Gemini lab):
  IN:  topic string → Gemini simulates 15–20 posts OR local fallback cascade
  PIPE: noise → edges (quote/reply/url/hash/Jaccard) → DSU → source_fitness → scores → Gemini report → Search grounding
  OUT: dashboard + JSON/TXT/PDF + ≤10 originals + noise tab + weight sliders
  CLAIM: "algorithm + UX lab" — NOT live X provenance

PRODUCTION (not yet — still the real MVP):
  IN:  official X search (budget-capped) for one topic
  PIPE: same types + formulas; real media hashes; real embeddings optional; no forced noise
  OUT: same schema; S1–S4 measured on rater fixtures
  CLAIM: provenance engine OR honest high-signal finder per S2 outcome
```

---
