# X-KES — Knowledge Signal Engine + Founder Content OS

**Multi-view provenance lab** for high-signal social posts, plus **Content Studio** that turns one ranked original into multi-platform founder drafts (no auto-publish). Full-stack TypeScript (Express + React/Vite).

> **Honest scope:** Algorithm + UX prototype. Candidates are **Gemini simulation** or a **local fallback** dataset — **not** live X API. Content Studio exports drafts only; nothing posts automatically.

| | |
|---|---|
| **Repos** | [X-KES-App-July26](https://github.com/KishoreKaathvi/X-KES-App-July26) · [Founder-Content-OS](https://github.com/KishoreKaathvi/Founder-Content-OS) |
| **Stack** | Node.js, TypeScript, Express, React 19, Vite 6, Tailwind CSS 4, Gemini (`@google/genai`) |
| **Default port** | `http://localhost:3000` |
| **Default branch** | `main` |

---

## Product systems in this repo

| System | Job | Status |
|--------|-----|--------|
| **Knowledge Signal Engine** | Topic → candidates → graph → originals ≤10 + why | ✅ Lab UI + pipeline (simulated/fallback) |
| **Founder Content OS** | Ranked original → brief → 9 channel drafts → quality gate → export | ✅ Content Studio + API |
| **Capture & Context Pipeline** | Bookmark/like → store → markdown | 📄 Spec only (separate doc) |

---

## Documentation (SSOT)

Read in this order:

1. **`HANDOFF.md`** — current status, APIs, E2E notes, gaps (start here for agents)
2. **`Implementation Plan.md`** — Founder Content OS V1 plan
3. **`docs/architecture.md`** — Content OS module map
4. **`X - Knowledge Signal Engine 10Jul26.md`** — KSE SSOT / ranking theory
5. **`X_-_Capture_and_Context_Pipeline_11Jul26.md`** — companion (not fully coded)

---

## Features (current lab app)

- **Landing** (default) — product surface; **Enter lab** → portal (**no auth**)
- **Multi-view shell:** Command · Sources · Cascade · Noise · Verify · Weights · **Studio** · Watchlist  
- **Collapsible nav** (⌘/Ctrl+B), **Light / Dark / System** theme  
- **KSE pipeline:** noise → graph → `source_fitness` → multi-signal scores → report  
- **Content Studio:** select original → campaign brief → X / LinkedIn / IG / WhatsApp / Facebook / YouTube drafts → quality gate → approve → MD/JSON export  
- **Sources CTA:** “Create content in Studio” with selection handoff  
- **Campaign history:** last 12 campaigns in **browser localStorage** only  
- **Exports:** KSE share/PDF/TXT/JSON · Content MD/JSON  
- **Resilience:** Gemini model ladder + offline fallback when no key / quota  

Portal: `http://localhost:3000/#portal`

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
| `npm run lint` | Typecheck |
| `npm test` | Vitest unit tests (insight / campaign / quality) |

**Windows note:** If the folder path contains `&`, use `node ./node_modules/...` runners if `npm test` mis-resolves.

---

## Project layout

```
X-KES/
├─ server.ts                 # KSE pipeline + POST /api/content/campaigns
├─ src/
│  ├─ content/               # Founder Content OS pure modules
│  ├─ views/ContentStudioView.tsx
│  ├─ hooks/useKseAnalysis.ts
│  ├─ layout/AppShell.tsx
│  └─ types.ts
├─ Implementation Plan.md
├─ HANDOFF.md
├─ docs/
└─ package.json
```

---

## API (prototype)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/kse/run` | Full run: simulate/fallback → filter → graph → rank → report |
| `POST` | `/api/kse/recalculate` | Re-score cached items (no LLM) after weight changes |
| `POST` | `/api/content/campaigns` | Founder insight → brief + channel assets + quality reviews |

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
