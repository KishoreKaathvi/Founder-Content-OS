# X-KES — Knowledge Signal Engine

**Multi-view provenance lab** for high-signal social posts: graph-first ranking, noise filtering, score vectors, and export — built as a full-stack TypeScript app (Express + React/Vite).

> **Honest scope:** This is an **algorithm + UX prototype**. Candidate posts are generated via **Gemini simulation** (or a local fallback dataset). It is **not** yet wired to live X API collection. See SSOT docs for the production path.

| | |
|---|---|
| **Repo** | [KishoreKaathvi/X-KES-App-July26](https://github.com/KishoreKaathvi/X-KES-App-July26) |
| **Stack** | Node.js, TypeScript, Express, React 19, Vite 6, Tailwind CSS 4, Gemini (`@google/genai`) |
| **Default port** | `http://localhost:3000` |

---

## Two systems (product architecture)

| System | Job | Status in this repo |
|--------|-----|---------------------|
| **Knowledge Signal Engine** | Topic → candidates → graph → originals ≤10 + why | ✅ Lab UI + pipeline (simulated/fallback data) |
| **Capture & Context Pipeline** | Bookmark/like → media → tag → store → markdown export | 📄 Spec only (no code yet) |

Keep them **separate**: Signal is pull/on-demand and precision-heavy; Capture is push/hourly and cheap owned-reads.

---

## Documentation (SSOT)

Read in this order:

1. **`X - Knowledge Signal Engine 10Jul26.md`** — vision, graph architecture, ranking/provenance, MVP constraints, **codebase reality (`00b`)**
2. **`X_-_Capture_and_Context_Pipeline_11Jul26.md`** — capture/enrichment pipeline (companion; not implemented here)
3. **`HANDOFF.md`** — deeper API/math notes for the prototype (may lag UI; prefer `00b` for current layout)

---

## Features (current lab app)

- **Motion landing page** (default) — enterprise marketing surface; **one button** enters the portal (**no auth**)
- **Multi-view shell:** Command · Sources · Cascade (graph) · Noise · Verify · Weights · Watchlist  
- **Collapsible nav** (⌘/Ctrl+B), **Light / Dark / System** theme  
- **Pipeline:** noise filter → edges → DSU components → `source_fitness` → multi-signal scores → report  
- **Command center:** funnel, score-vector donut, edge taxonomy, timeline heat, leaderboard  
- **Exports:** Share deep-link, PDF, TXT, JSON  
- **Resilience:** Gemini model ladder + offline fallback dataset when no key / quota  

Open the portal via **Enter enterprise portal** or `http://localhost:3000/#portal`.

---

## Quick start

### Prerequisites

- **Node.js 20+** (or 18+)
- Optional: **Gemini API key** for live simulation + grounding (fallback works without it)

### Install & run

```bash
npm install
```

Create `.env` or `.env.local` (optional):

```env
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

Open **http://localhost:3000**

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server (`tsx server.ts` + Vite middleware) |
| `npm run build` | Production client + bundled server |
| `npm start` | Run production server (`dist/server.cjs`) |
| `npm run lint` | `tsc --noEmit` |

---

## Project layout

```
X-KES/
├─ server.ts                 # Express API + provenance pipeline + Gemini
├─ src/
│  ├─ App.tsx                # View router
│  ├─ hooks/useKseAnalysis.ts
│  ├─ layout/AppShell.tsx    # Nav + top bar
│  ├─ views/                 # Command, Sources, Graph, Noise, Verify, Tuning, Alerts
│  ├─ components/            # Graph, SourceCard, charts, …
│  └─ types.ts               # ContentItem, Edge, ScoreVector, KSERunResult
├─ X - Knowledge Signal Engine 10Jul26.md
├─ X_-_Capture_and_Context_Pipeline_11Jul26.md
├─ HANDOFF.md
└─ package.json
```

---

## API (prototype)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/kse/run` | Full run: simulate/fallback → filter → graph → rank → report |
| `POST` | `/api/kse/recalculate` | Re-score cached items (no LLM) after weight changes |

Body (both):

```json
{
  "topic": "AI Coding Assistants",
  "provenanceWeights": { "w_time": 0.45, "w_auth": 0.25, "w_infl": 0.20, "w_deriv": 0.35 },
  "presentationWeights": { "alpha": 0.35, "beta": 0.20, "gamma": 0.25, "delta": 0.15, "epsilon": 0.05, "zeta": 0.0 }
}
```

---

## What this is not (yet)

- ❌ Official X API search / real bookmarks  
- ❌ Capture & Context Pipeline (media download, Supabase archive, taxonomy export)  
- ❌ Production multi-tenant product  

**Next production step (per SSOT):** Phase 0 collection spike on real X tier; replace Gemini Stage ① with a budgeted Collector; keep graph/rank/UI.

---

## License

Apache-2.0 (see source file headers where present).
