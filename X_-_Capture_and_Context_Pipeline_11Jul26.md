> **Document status:** X - Capture & Context Pipeline (Draft v1.2 — repo-ready) · Owner: (you) · Last updated: 2026-07-11
> **Companion doc:** `X - Knowledge Signal Engine 10Jul26.md` (discovery/provenance). This is the second stage — capture, enrichment, and delivery.
> **Repo README:** `README.md` (how to run the KSE lab that coexists in this monorepo)
> **Reading order:** `00-overview` → **`00b-codebase-reality`** → architecture → build-spec → roadmap
> **GitHub:** https://github.com/KishoreKaathvi/X-KES-App-July26

---

## 0b. Codebase reality (2026-07-11 audit) ⚠️

### Status: design-only — **zero Capture code in the monorepo**

A full audit of `X-KES/` shows:

| Expected (this doc) | In repo? |
|---------------------|----------|
| Capturer (bookmarks/likes poll) | ❌ |
| Media extractor / Supabase Storage | ❌ |
| Classifier / taxonomy tags | ❌ |
| Archivist schema (`captured_items`, …) | ❌ |
| Markdown context exporter | ❌ |
| Railway/cron job for this pipeline | ❌ |

What *is* in the monorepo is the **Knowledge Signal Engine prototype only** (Express + React + Gemini simulation of social cascades, provenance ranking, dashboard, JSON/TXT/PDF export). See companion SSOT section **`00b-codebase-reality`** and `HANDOFF.md`.

### Implications (do not silently merge systems)

1. **This pipeline is still the right second system.** KSE went deep on discovery UI/algorithms; it did **not** implement bookmark → media → tag → store. That gap is exactly why this doc exists.
2. **Do not bolt Capture stages onto `server.ts` as random routes.** KSE is pull/on-demand and LLM-heavy in the lab; Capture is push/hourly and owned-read cheap. Shared Supabase project later is fine; shared process is not required at MVP.
3. **Stack alignment:** this doc already chooses **Node.js/TypeScript** — that matches the live monorepo language. Prefer a separate package or service (e.g. `packages/capture/` or `capture/`) under the same org, not a Python fork.
4. **What KSE already proves that Capture can reuse later (ideas only, not code copy-paste):**
   - Typed TypeScript contracts and paste-ready export discipline (TXT/JSON/PDF patterns)
   - Config-over-code weight/threshold mindset
   - Honest fallback labels (`is_fallback`) when upstream data is degraded
   - **Not reusable as-is:** Gemini post simulation, provenance graph, relationship dashboard — wrong job for Capture
5. **Nothing from the KSE prototype invalidates Phase 0–1 of this doc.** Phase 0 (real bookmark mix + cost) remains the first Capture task. No Capture feature was “accidentally” delivered by AI Studio.

### Cross-system seams (keep in schema even before both run)

When both systems share storage later:

| Seam | Purpose |
|------|---------|
| `source_id` / X post id uniqueness | Dedup Capture vs KSE-surfaced posts |
| `also_in_signal_engine` (or equivalent flag) | Provenance note in Capture exports |
| Fixed taxonomy tags on Capture side | Orthogonal to KSE score vectors |

### Immediate Capture next actions (unchanged intent, clearer context)

1. Phase 0 spike on **owned-read bookmarks/likes** — not on the KSE Gemini lab.
2. Stand up Supabase tables from §6.2.
3. Build Phase 1 only (capture → normalize → media → classify → archive → export).
4. Leave KSE server alone except optional shared types package if/when both are real.

---

## 0. How this fits with the Signal Engine

Two systems, two jobs, one pipeline:

```
SIGNAL ENGINE                          CAPTURE & CONTEXT PIPELINE (this doc)
"what should I look at?"        →      "now do everything with it, automatically"
topic → graph → provenance             bookmark/like → enrich → tag → store → export
OUTPUT: ≤10 posts + why                OUTPUT: structured, searchable, AI-ready context
```

**Why a separate system and not one monolith:** the Signal Engine is *pull*-shaped — you give it a topic and it goes hunting across the whole public graph, which is why it's expensive (public search reads) and precision-obsessed. This system is *push*-shaped — you (or the Signal Engine) already decided a specific post is worth keeping, so the job is no longer "find," it's "never touch this manually again." Different cost profile, different failure modes, different tempo (this runs continuously in the background; Signal Engine runs on demand per topic). Merging them would force the cheap, high-frequency capture loop to inherit the expensive, low-frequency discovery loop's cost model — a real architectural mistake, not just a style preference.

**Why this system exists at all, precisely stated:** the actual time-sink isn't reading good posts — it's the five manual chores wrapped around each one (bookmark → open a downloader site → paste a URL → open a different site → paste again → check if a repo is worth it → mentally file it → later hand-copy it into a chat with Claude/GPT). None of those five chores requires human judgment. All five are mechanical. The system's entire mandate is: **judgment stays yours (you already decided to bookmark it); everything mechanical after that point gets removed.**

---

## 1. The problem, stated precisely

### 1.1 What's actually being automated

Your current per-item manual loop:

```
See post → bookmark/like → [if image] download manually
                          → [if video] copy URL → twittervideodownloader.com → download
                          → [if long post] copy URL → xunroll.com → export PDF
                          → [if repo link] open GitHub → read it → judge if useful
                          → later: manually re-find and copy-paste into Claude/ChatGPT as context
```

Five branches, five different manual tools, and a sixth manual step (re-assembling context by hand) that happens *every single time* you want to use what you saved — the cost is paid twice.

### 1.2 The non-goal

**Non-objective:** replace your judgment about what's worth bookmarking. That's the Signal Engine's job upstream, or your own scroll-and-spot instinct, and both stay as-is.
**Objective:** once something is bookmarked/liked, zero further manual action should be required to get it downloaded, transcribed, tagged, stored, and ready to paste into any AI assistant as clean context.

### 1.3 Why this is tractable where the Signal Engine is hard

The Signal Engine's hardest problem (provenance, S2) is hard because it needs data about *other people's* posts at scale — expensive, rate-limited, sometimes gated. This system only ever touches data **you already have explicit access to**: things you bookmarked or liked. That's a fundamentally cheaper and more reliable data-access tier (detailed in `02`). This is the single biggest reason to keep the systems separate: this one is close to fully solvable today; the Signal Engine is explicitly gated on data access it may never fully get.

---

## 2. Vision vs. MVP

### 2.1 Full scope (vision)

- Zero-touch capture: bookmark/like on X is the *only* manual action, ever.
- Every media type auto-extracted at source quality (no third-party downloader sites).
- Every long post/thread auto-reconstructed to full text (no manual unroll-and-paste).
- Every GitHub link auto-enriched (README summary, stars, last-commit recency, auto-verdict on relevance to your stack).
- Every video auto-transcribed and summarized, not just downloaded as a file you'll never rewatch.
- Everything auto-tagged against your fixed interest taxonomy (§4.1).
- One-command or auto-scheduled export: a clean markdown context bundle, filterable by tag/date/topic, ready to paste into Claude/ChatGPT/Hermes — or queryable live via MCP so you never manually paste at all.
- Semantic search across everything you've ever saved ("what did I save about agent orchestration loops last month").

### 2.2 Explicitly NOT in MVP

| Deferred | Why |
|---|---|
| Semantic search / embeddings | Needs volume before it's worth the infra; markdown export + tags cover retrieval at current save-volume. |
| Live MCP query endpoint | Nice-to-have; scheduled export file gets 80% of the value at near-zero build cost. |
| Video transcription | Real cost driver (Whisper API isn't free); add once text-based capture is solid and stable. |
| Auto-verdict scoring on repos ("is this useful for me") | Genuinely hard to get right without training data on *your* actual usage patterns; ship repo metadata first, add scoring once you've manually judged ~100 repos through the system. |
| Multi-source (Reddit, HN, YouTube) | X-only until this pipeline is proven, matching the Signal Engine's own MVP discipline. |

**Why the line is here:** everything in scope is buildable on data you already have owned-read access to, at near-zero marginal cost per item. Everything deferred either needs volume/history to be worth building, or has a real dollar cost per use that should be validated manually first (you judging repos yourself for a while) before automating the judgment.

---

## 3. Success criteria

| # | Criterion | Measurement | Why this one |
|---|---|---|---|
| C1 | From bookmark/like to fully processed (media downloaded, text extracted, tagged, stored) with **zero manual steps** | Time-to-processed per item, tracked automatically | This is the entire point — manual steps remaining = failure |
| C2 | Context export is directly paste-ready with no cleanup | Manual spot-check weekly | If you still have to edit the export before pasting it, the export step didn't do its job |
| C3 | Media/text fidelity matches or beats the manual tools it replaces (no broken video links, no truncated threads) | Spot-check against 20 items processed via old manual method vs. new pipeline | A faster pipeline that loses data is worse than the manual process |
| C4 | Runs entirely inside budget (see `02` §4) with no surprise bills | Monthly cost tracked in Supabase, alert if projected to exceed cap | This must stay a rounding error next to your other product spend, or it's not worth automating |

---

## 4. Architecture

### 4.1 Interest taxonomy (fixed tag set — config, not code)

Derived directly from what you stated as your recurring interests:

```
AI_AGENTS        — agents, sub-agents, multi-agent systems, orchestration, loops, dynamic workflows
AI_MODELS        — model news/updates, API access, Claude Code, ChatGPT/OpenAI, other model releases
AI_TRICKS        — prompting insights, technique/trick posts
BUSINESS         — end-to-end business lifecycles, opportunities via AI, monetization
AUTOMATION       — automations, workflows, systems, frameworks
MENTAL_MODELS    — mental models, system thinking, system design, patterns
PSYCHOLOGY       — human psychology, hook techniques, persuasion
REPO             — GitHub repositories (cross-tagged with one of the above)
UNSORTED         — didn't confidently match anything above — reviewed, never silently dropped
```

**Why a fixed list instead of open tagging:** open-ended LLM tagging drifts (synonyms multiply: "agent-orchestration" vs "multi-agent-systems" vs "agentic-workflows" all meaning the same thing six months apart), which quietly breaks retrieval. A fixed, config-level taxonomy keeps every export filterable and stable. New tags get added deliberately, not accidentally.

### 4.2 Pipeline (stages)

```
① Trigger              — scheduled poll (not real-time; batch, matching Signal Engine's own discipline)
    ↓
② Capturer             — pull new bookmarks + likes since last run (owned-read API)
    ↓
③ Content Normalizer    — expand note_tweet (long-form) text, resolve real URLs, detect item type
    ↓
④ Media Extractor       — pull image/video variant URLs directly from the API response
    ↓
⑤ Thread Reconstructor  — walk conversation_id when the bookmarked post is part of a thread (cost-gated, §5.3)
    ↓
⑥ Repo Enricher         — for github.com links: fetch README, stars, last-commit date via GitHub API (free)
    ↓
⑦ Classifier / Tagger   — Claude Haiku: tag against §4.1 taxonomy, 2–3 line summary, relevance note
    ↓
⑧ Deduplicator          — skip items already surfaced by the Signal Engine for the same source_id
    ↓
⑨ Archivist             — write structured record + media to storage
    ↓
⑩ Exporter              — generate/refresh the markdown context bundle
```

### 4.3 Roles (why decomposed)

Same reasoning as the Signal Engine doc: each stage has a different failure mode and a different cost profile, so isolating them means a Thread Reconstructor bug can't corrupt the Classifier, and you can swap the tagging model without touching capture.

| Role | Stage(s) | Input → Output | Hardest failure mode |
|---|---|---|---|
| Capturer | ①② | last-run timestamp → new raw items | missed items if pagination/cursor handling is sloppy |
| Normalizer | ③ | raw item → clean text + type | misclassifying item type (thread vs single post vs quote) |
| Media Extractor | ④ | raw item → media URLs/files | video variant missing at expected quality |
| Thread Reconstructor | ⑤ | root post → full thread text | runaway cost on long threads (§5.3) — must have a hard cap |
| Repo Enricher | ⑥ | GitHub URL → metadata | rate-limited GitHub API on burst |
| Classifier | ⑦ | clean text → tags + summary | mis-tagging into UNSORTED too often (signal it's a taxonomy gap, review monthly) |
| Deduplicator | ⑧ | item → keep/skip | skipping something that's actually new because of an ID-matching bug |
| Archivist | ⑨ | processed item → stored record | partial writes on failure (needs transactional write) |
| Exporter | ⑩ | stored records → markdown bundle | stale export if scheduler silently fails — needs a heartbeat check |

---

## 5. Data access reality (the constraint layer)

### 5.1 The good news: this is mostly "owned reads"

As of the April 2026 X API repricing, reads of **your own** bookmarks, likes, and lists are billed as **Owned Reads at $0.001 per resource** (1,000 items = $1) — a 5–10x cut from the old rate. Media variant URLs (image/video) come back **inside that same response** at no extra charge. This alone kills the twittervideodownloader.com step for cost reasons, not just convenience — you're already paying for the data that contains the direct download link.

### 5.2 What's still full-price

| Data need | Endpoint type | Rate | Why it's not "owned" |
|---|---|---|---|
| Your bookmarks/likes list | Owned read | $0.001/item | Your own account data |
| Media variants attached to your bookmarks | Included free | — | Bundled in the owned-read response |
| GitHub README/stars/commits | GitHub API | Free (rate-limited) | Not an X endpoint at all |
| **Someone else's replies in a thread you bookmarked** | Standard read | $0.005/item | You bookmarked *one* post; the rest of the thread belongs to the original author's timeline, not your account |

### 5.3 The thread-reconstruction cost cliff (read this before building §4.2 stage ⑤)

This is the one place this system inherits a real constraint from the Signal Engine's playbook, and it needs the same honesty. Unrolling a long thread means walking `conversation_id` across posts that are **not your own data** — every one of those is a standard read at $0.005, not an owned read at $0.001. A 40-tweet thread you bookmark once could cost $0.20 to fully reconstruct. That's fine occasionally; it's not fine if it happens silently on every save.

**Rule:** Thread Reconstructor gets a **hard per-item cap** (e.g. reconstruct up to N=20 replies, config-driven) and a **daily budget cap** across all reconstructions. Past the cap, store what you have and flag `thread_partial: true` rather than silently truncating or silently overspending. This mirrors the Signal Engine's own principle: an honest partial result beats a silently wrong or silently expensive one.

### 5.4 What each tier unlocks

| Capability | Data required | Cost tier |
|---|---|---|
| Capture bookmarks/likes | Owned read | ✅ Cheap, always on |
| Download images/video at source quality | Bundled in owned read | ✅ Free once you're already paying for the read |
| Full text of long-form posts (X "Notes") | `note_tweet` field, owned read | ✅ Cheap — kills the xunroll.com step for single long posts |
| Full thread reconstruction | Standard reads on other accounts' replies | 💰 Capped (§5.3) |
| Repo metadata | GitHub REST API | ✅ Free, generous rate limit |
| Video transcription | Whisper API or equivalent | 💰 Deferred to Phase 3 (§7) — real per-minute cost |

---

## 6. Build spec

### 6.1 Tech stack — chosen, with reasons

| Concern | Chosen | Why |
|---|---|---|
| Runtime | Node.js/TypeScript | Matches your existing stack (Next.js/Supabase/Railway) — no new language to maintain |
| Scheduler | Railway cron (or GitHub Actions cron as a free fallback) | You already deploy here; no new infra |
| X API client | Direct `fetch` against X API v2 (thin wrapper) | Pipeline is simple enough that a full SDK is unnecessary overhead |
| Classification | Claude Haiku via Anthropic API | Cheapest capable model for a bounded tagging/summarization task — this is not a reasoning-heavy job |
| Storage (structured) | Supabase Postgres | Matches your stack; relational fits this schema better than a vector store at MVP volume |
| Storage (media files) | Supabase Storage | Same project, same auth, no third vendor |
| Repo enrichment | GitHub REST API (unauthenticated or PAT for higher limits) | Free, official, no scraping |
| Export format | Markdown, generated on schedule + on-demand | Directly paste-ready; matches your `obsidian-notemaker` skill's output shape so exports can double as vault notes |

### 6.2 Data model

```sql
-- one row per captured item
captured_items (
  id                uuid primary key,
  source_id         text unique,        -- X post ID, dedup key
  source_url        text,
  item_type         text,               -- 'post' | 'thread_root' | 'image' | 'video' | 'repo_link'
  raw_text          text,
  thread_text       text,               -- null unless reconstructed
  thread_partial    boolean default false,
  captured_via      text,               -- 'bookmark' | 'like'
  author_handle     text,
  posted_at         timestamptz,
  captured_at       timestamptz default now(),
  processed_at      timestamptz,
  status            text default 'pending' -- 'pending'|'processed'|'failed'
);

media_assets (
  id                uuid primary key,
  item_id           uuid references captured_items(id),
  media_type        text,               -- 'image' | 'video'
  storage_path      text,               -- Supabase Storage path
  source_variant_url text,
  duration_seconds  int                 -- video only
);

repo_enrichment (
  id                uuid primary key,
  item_id           uuid references captured_items(id),
  repo_url          text,
  stars             int,
  last_commit_at    timestamptz,
  readme_summary    text,               -- Claude-generated, 2-3 lines
  fetched_at        timestamptz
);

tags (
  item_id           uuid references captured_items(id),
  tag                text,               -- one of the §4.1 taxonomy values
  primary key (item_id, tag)
);

item_summary (
  item_id           uuid primary key references captured_items(id),
  summary           text,               -- Claude-generated, 2-3 lines
  relevance_note    text                -- why this matters, 1 line
);

export_runs (
  id                uuid primary key,
  run_at            timestamptz default now(),
  item_count        int,
  export_path       text
);
```

**Why relational over vector store at this stage:** at your save volume (dozens/day, not thousands), tag filtering + full-text search in Postgres covers retrieval needs. Adding pgvector is a Phase 3 item (§7) once volume actually demands semantic search — building it now would be optimizing for a problem you don't have yet.

### 6.3 Component specs

**Capturer**
- Runs on schedule (hourly is plenty; bookmarks don't need real-time processing).
- Tracks `last_captured_at` cursor in a config table; pulls only new items since last run via the owned-read bookmarks/likes endpoints with pagination.
- Idempotent: `source_id` uniqueness constraint means re-running is always safe.

**Content Normalizer**
- Detects `item_type` from response shape: has media → image/video; `note_tweet` present → long-form; `conversation_id != id` → part of a thread.
- Resolves t.co shortened URLs to real destinations (needed to correctly detect GitHub links).

**Media Extractor**
- Reads `media_keys` expansion, pulls highest-bitrate video variant or original-resolution image URL, downloads to Supabase Storage.
- Failure handling: if a variant URL 404s (can happen on older posts), retry once, then flag `status: 'failed'` rather than silently skipping — a silent gap is worse than a visible one.

**Thread Reconstructor**
- Only triggers when `conversation_id != source_id` (i.e., this is a reply-chain, not a standalone post).
- Enforces the cap from §5.3. Writes `thread_partial: true` when capped.

**Repo Enricher**
- Regex-detects `github.com/{owner}/{repo}` in normalized text.
- Pulls README + repo metadata via GitHub REST API, summarizes README with Haiku in 2-3 lines.
- No "is this useful" verdict yet — deferred per §2.2 until you've manually judged enough of these to define what "useful" means in your own patterns.

**Classifier**
- Single Haiku call per item: input = normalized text (+ thread text if reconstructed, + repo README summary if present); output = JSON `{tags: [...], summary: "...", relevance_note: "..."}` constrained to the §4.1 taxonomy via the system prompt.
- Anything the model isn't confident about → `UNSORTED`, never force-fit into a wrong tag.

**Deduplicator**
- Before writing, checks whether `source_id` already exists in the Signal Engine's own output tables (if you're running both systems against the same Supabase project — recommended so this check is a simple join, not a cross-service API call).
- If already surfaced there, still capture it here (you still want it downloaded/tagged/exported) but mark `source: 'also_in_signal_engine'` so exports can note provenance.

**Archivist**
- Single transactional write per item across `captured_items` + `media_assets` + `repo_enrichment` + `tags` + `item_summary` — all-or-nothing, so a crash mid-write never leaves an orphaned half-record.

**Exporter**
- Generates a markdown file per run: grouped by tag, each entry = summary + relevance note + source link + local media path + repo metadata if present.
- Also supports on-demand filtered export ("give me everything tagged AI_AGENTS from the last 14 days") as a simple CLI/script command — this is your paste-into-Claude-or-ChatGPT step, now one command instead of manual re-assembly.

---

## 7. Processing rules & edge cases

| Case | Rule |
|---|---|
| Post is deleted before processing | Mark `status: 'failed'`, log reason, move on — don't retry indefinitely |
| Video variant requires a bitrate tier not returned for older posts | One retry, then flag rather than drop |
| Item already exists (re-bookmark, or overlap with Signal Engine output) | Deduplicate on `source_id`; never create duplicate rows |
| Classifier returns a tag outside the fixed taxonomy | Reject and force `UNSORTED` — a hallucinated tag is worse than an honest miss |
| Thread exceeds reconstruction cap | Store partial + `thread_partial: true`, never silently overspend past the daily cap |
| GitHub API rate-limited | Queue enrichment for next run rather than failing the whole item |
| Export requested but no new items since last run | Return "nothing new," don't regenerate an identical file |

---

## 8. Cost & latency budget (concrete, not placeholder)

Assuming ~30–50 saves/day (bookmarks + likes combined), realistic for your current routine:

| Line item | Volume | Rate | Monthly cost |
|---|---|---|---|
| Owned-read capture | ~1,200/mo | $0.001 | ~$1.20 |
| Media (bundled) | — | free | $0 |
| Thread reconstruction (capped, ~20% of items are threads, avg 10 replies) | ~240 reconstructions × 10 replies | $0.005 | ~$12 |
| GitHub API | — | free | $0 |
| Claude Haiku classification (~1,200 calls, ~600 tokens avg in/out) | 1,200 calls | Haiku pricing | ~$3–5 |
| **Total** | | | **≈ $16–18/month** |

This stays a rounding error against your other product spend. If thread reconstruction ever dominates the bill, that's the signal to tighten the per-thread cap in §5.3, not to redesign the system.

Latency: batch, hourly — no item needs to be processed in under an hour, so there's no case for real-time infra here, matching the Signal Engine's own batch-first discipline.

---

## 9. Roadmap

### Phase 0 — Spike (before writing the real pipeline)
- Pull your last 30 days of real bookmarks via the owned-read endpoint.
- Measure actual item-type mix (how many are images vs video vs long text vs threads vs repo links) — this validates or corrects the §8 budget assumptions with your real data, not estimates.

**Exit gate:** real cost-per-item number in hand.

### Phase 1 — MVP
- Stages ①②③④⑦⑨⑩ (capture, normalize, media extract, classify, archive, export). **No thread reconstruction yet** — store the root post text only.
- Ship condition: C1–C2 hold for images/single posts/repo links.

### Phase 2 — Thread reconstruction + repo enrichment
- Add stage ⑤ with the hard cap from §5.3, and stage ⑥.
- Ship condition: C3 holds against a 20-item spot check vs. your old manual xunroll workflow.

### Phase 3 — Intelligence layer
- Dedup against Signal Engine output (stage ⑧, once both systems share a Supabase project).
- pgvector embeddings + semantic search, once saved-item volume justifies it.
- Repo "is this useful" verdict, trained on your own accumulated judgments from Phase 1–2.

### Phase 4 — Delivery upgrade
- Video transcription (Whisper) + summary, once text-based capture has been stable for a few weeks.
- Optional MCP export endpoint so Claude Code / your AI assistants can query the store live instead of you pasting a markdown file.

---

## 10. Cross-cutting rules

| Concern | Rule |
|---|---|
| Legitimacy | Owned-read endpoints only for your data; standard reads only for reconstructing threads you explicitly bookmarked — no scraping, same principle as the Signal Engine doc |
| Budgets | Hard daily cap on thread-reconstruction spend; alert if projected monthly cost exceeds a configured ceiling |
| Config over code | Taxonomy (§4.1), thread cap, and budget ceiling all live in config, not hardcoded |
| Honesty | `thread_partial` and `status: 'failed'` are always visible in exports — never silently drop or silently truncate |
| Schema seams | Keep dedup/Signal-Engine-provenance fields in the schema now even before Phase 3 wires them up |

---

## 11. Immediate next actions

> **Codebase note:** KSE prototype work in this monorepo does **not** advance Capture. Start from zero for this system (`00b`).

1. Run the Phase 0 spike — pull real bookmark history, get real item-type mix and real cost numbers.
2. Stand up the `captured_items` + related tables in Supabase.
3. Scaffold Capture as a **separate** Node/TS package or service (not new routes inside KSE `server.ts` pipeline).
4. Build Phase 1 only (capture → normalize → media → classify → archive → export). Stop there — no thread reconstruction, no repo scoring, no video transcription until Phase 1 is proven in daily use.
5. Run it for a week against your real routine; check C1–C2 hold before touching Phase 2.
6. Only after both systems persist to a shared Supabase project, wire dedup flag `also_in_signal_engine` (Phase 3).

---

## Appendix — One-page MVP reminder

```
IN:   your own bookmarks + likes, owned-read API, batch hourly
PIPE: capture → normalize → extract media → classify/tag → dedup → store → export
OUT:  structured records + downloaded media + one paste-ready markdown bundle
WIN:  zero manual steps from bookmark to AI-ready context (C1), stays under ~$20/month (C4)
NOT:  thread reconstruction (Phase 2), repo scoring (Phase 3), video transcription (Phase 4), semantic search (Phase 3)
```
