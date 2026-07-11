# Knowledge Signal Engine (KSE) — Technical Handoff

Deep notes on the **prototype** pipeline (math, API, recovery). For product truth and MVP constraints, prefer:

- `README.md` — runbook + scope
- `X - Knowledge Signal Engine 10Jul26.md` — SSOT (including **§0b codebase reality**)
- `X_-_Capture_and_Context_Pipeline_11Jul26.md` — companion system (not in this repo’s code)

**Claim discipline:** Stage ① is Gemini simulation or local fallback — **not** live X API.

---

## 1. System Architecture & Component Mapping

Express backend owns the pipeline; React client is a multi-view analytical workstation.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     REACT CLIENT (PORT 3000)                           │
│  AppShell (collapsible nav) · Light/Dark/System · exports              │
│  Views: Command | Sources | Cascade | Noise | Verify | Weights | Watch │
│  POST /api/kse/run  ·  POST /api/kse/recalculate                       │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────────┐
│                     EXPRESS BACKEND (server.ts)                        │
│  ① Ingestion (Gemini JSON sim | fallback) → ② Noise → ③ Graph (DSU)    │
│  → ④ Provenance + multi-signal rank → ⑤ Report (Gemini) → Grounding  │
└────────────────────────────────────────────────────────────────────────┘
```

### Core source paths (current)

| Path | Role |
|------|------|
| `server.ts` | Pipeline, Gemini, fallback, APIs |
| `src/types.ts` | Shared contracts |
| `src/hooks/useKseAnalysis.ts` | Client state, run/export, filters |
| `src/layout/AppShell.tsx` | Nav + top bar |
| `src/views/*` | One concern per view |
| `src/components/RelationshipGraph.tsx` | Force graph |
| `src/components/SourceCard.tsx` | Ranked source cards |
| `src/components/viz/DashCharts.tsx` | Donuts, funnel, sparklines |

> **Note:** Legacy one-page `Sidebar.tsx` / `OriginalCard.tsx` may still exist in the tree; the active shell uses **AppShell + views + SourceCard**.

---

## 2. Theoretical Ingestion & Social Media Simulation

When a topic search is dispatched, KSE models a chronological event sequence to represent a realistic social cascade.

### 2.1. The Simulation Prompt
If the **Gemini API Key** is configured, KSE issues a highly targeted simulation instruction utilizing structured JSON output (`responseMimeType: "application/json"`, `temperature: 0.3`). The prompt directs the LLM to construct a logical cascade across a $48$-hour window:
- **Original Seeds**: Primary disclosures with URLs, scientific paper identifiers, or perceptual file footprints.
- **Derivative Copies**: Paraphrased retweets or low-effort informational clones.
- **Engagement Bait**: Speculative threads designed for traffic maximization.
- **Inter-node References**: Explicitly tracking `parent_id` (conversational replies) and `quoted_id` (quote-retweets).
- **Screenshot Vectors**: Shared perceptual hashes (`media_hashes`) that trace non-textual graphic distribution.

---

## 3. Detailed Algorithmic Processing Pipeline

The backend processes the raw simulation streams through five distinct modular stages.

### Stage 1: Noise Filter Engine (Spam Pruning)
Before executing provenance calculation, incoming nodes are run through a heuristic signature scanner to discard low-signal spam or coordinate baiting.
1. **Signature Scan**: Evaluates the text content against a set of predefined spam regex indices:
   $$\text{Regexes} = \{ \text{crypto}, \text{giveaway}, \text{airdrop}, \text{click link}, \text{get rich}, \text{mlm}, \text{telegram channel} \}$$
2. **Metadata Engagement Check**: Detects high hashtag and mention densities originating from unverified accounts with minimal follower foundations:
   $$\text{Flagged if } \left( N_{\text{hashtags}} + N_{\text{mentions}} > 5 \right) \ \land \ (\text{Followers} < 100) \ \land \ (\neg \text{Verified})$$
3. **Outcome**: All matching nodes are quarantined into `noise_candidates`, while high-signal nodes move forward to graph assembly.

### Stage 2: Disjoint-Set Graph & Edge Resolution
The engine maps structural relationships to detect information cascades using Disjoint-Set Union (DSU) or Breadth-First Search (BFS) component grouping.
1. **Structural Edges**:
   - **Quotes**: Directly resolves $A \rightarrow B$ where $A.\text{quoted\_id} = B.\text{id}$. (Weight: $1.0$)
   - **Replies**: Resolves $A \rightarrow B$ where $A.\text{parent\_id} = B.\text{id}$. (Weight: $0.8$)
2. **Cross-Reference Edges**:
   - **Same URL**: Connects nodes sharing identical external targets (e.g. GitHub repositories). (Weight: $0.9$)
   - **Same Image Hash**: Connects nodes sharing identical `media_hashes` (identifying graphic plagiarism/screenshots). (Weight: $0.95$)
   - **Semantic Similarity**: Calculates keyword Jaccard overlap $J(A, B)$. Connects if $J(A, B) > 0.45$. (Weight: $J(A, B)$)
3. **Cascade Clustering**: Connects nodes into localized components representing distinct narrative branches:
   $$\text{Union}(u, v) \implies \text{Find}(u) = \text{Find}(v)$$

### Stage 3: Provenance Detection & Heuristic Calculations
For each individual narrative cluster, KSE identifies the true original seed by maximizing **Source Fitness** ($F_s$):

$$F_s = w_{\text{time}} \cdot T_p + w_{\text{auth}} \cdot A_s + w_{\text{infl}} \cdot D_i - w_{\text{deriv}} \cdot D_s$$

Where:
*   **$T_p$ (Temporal Priority)**: Chronological precedence normalized across the component's timeline bounds $[T_{\text{earliest}}, T_{\text{latest}}]$:
    $$T_p = 1.0 - \frac{T_{\text{node}} - T_{\text{earliest}}}{T_{\text{latest}} - T_{\text{earliest}}}$$
*   **$D_s$ (Derivative Penalty Score)**: Measures how derivative a post is based on structural cues and spammy language triggers:
    $$D_s = \min\left(1.0, \ \delta_{\text{quote}} \cdot 0.5 + \delta_{\text{reply}} \cdot 0.3 + \delta_{\text{screenshot\_in}} \cdot 0.8 + \delta_{\text{paraphrase\_in}} \cdot 0.6 + \delta_{\text{bait\_regex}} \cdot 0.4\right)$$
*   **$D_i$ (Downstream Influence)**: The fraction of the cluster's nodes that directly or indirectly reference the target post:
    $$D_i = \frac{\text{Count}(\text{Incoming Edges pointing to Node})}{\max(1, N_{\text{cluster\_nodes}})}$$
*   **$A_s$ (Authority Score)**: Combines user verification, logarithmic follower count, and official status:
    $$A_s = \min\left(1.0, \ 0.35 \cdot \text{Verified} + 0.35 \cdot \frac{\ln(1 + \text{Followers})}{\ln(1 + 1{,}000{,}000)} + 0.20 \cdot \text{OfficialAnnouncement} + 0.05\right)$$

### Stage 4: Multi-Signal Presentation Ranking
Once the primary origin node of each cluster is identified, KSE calculates its **Presentation Score** ($P_s$) to rank the core disclosures shown on the UI:

$$P_s = \alpha \cdot \text{Originality} + \beta \cdot \text{Authority} + \gamma \cdot \text{Influence} + \delta \cdot \text{Evidence} + \epsilon \cdot \text{Freshness}$$

Where:
-   **Originality**: Measures seed priority and lack of duplication:
    $$\text{Originality} = \min\left(1.0, \ 0.45 \cdot T_p + 0.25 \cdot (1.0 - D_s) + 0.20 \cdot \delta_{\text{media\_hash}} + 0.10\right)$$
-   **Evidence**: Quantifies verified backing and external references:
    $$\text{Evidence} = \min\left(1.0, \ 0.40 \cdot \text{Verified} + 0.30 \cdot \delta_{\text{cluster\_size} > 3} + 0.30 \cdot \delta_{\text{external\_artifact}}\right)$$
-   **Freshness**: Derived from temporal prioritization relative to the entire dataset.

### Stage 5: Independent Verification Grounding
KSE submits the identified topic and core claims to the Gemini Search Grounding API (`googleSearch: {}`):
- Executes search queries to verify if claims are verified on platforms like GitHub or preprint hubs like arXiv.
- Automatically compiles a structured verification verdict summary and lists direct, clickable citations in the analytical dashboard.

---

## 4. API Specification Contracts

### 4.1. Run Full Provenance Analysis
*   **Endpoint**: `/api/kse/run`
*   **Method**: `POST`
*   **Payload**:
```json
{
  "topic": "TypeScript v5.5 Release",
  "provenanceWeights": {
    "w_time": 0.45,
    "w_auth": 0.25,
    "w_infl": 0.20,
    "w_deriv": 0.35
  },
  "presentationWeights": {
    "alpha": 0.35,
    "beta": 0.20,
    "gamma": 0.25,
    "delta": 0.15,
    "epsilon": 0.05,
    "zeta": 0.0
  }
}
```
*   **Response (`KSERunResult`)**:
```json
{
  "topic": "TypeScript v5.5 Release",
  "run_meta": {
    "collected_candidates": 18,
    "after_dedup": 16,
    "components": 3,
    "api_calls_used": 3
  },
  "raw_items": [],
  "authors": {},
  "edges": [],
  "originals": [],
  "summary": "Full topical summary generated by Gemini...",
  "weights": { ... },
  "is_fallback": false,
  "verification_grounding": {
    "verdict_summary": "Verified release...",
    "sources": [{ "uri": "https://github.com/...", "title": "TS 5.5 Spec" }]
  },
  "noise_candidates": []
}
```

### 4.2. Recalculate Provenance (Weights Recalculation)
Runs in $O(V + E)$ on the cached dataset to support instant slider updates without re-triggering expensive LLM generation.
*   **Endpoint**: `/api/kse/recalculate`
*   **Method**: `POST`
*   **Payload**: Identical schema to `/api/kse/run`.

---

## 5. Frontend Architecture & State Controls

### 5.1. Temporal Window Controls (Time Window Slider)
A slider bounds control dynamically filters results on the client side:
- **State**: `dateRange: [number, number]` tracks active milliseconds.
- **Filtering Logic**: React computes a `filteredResult` memo that filters active nodes, updates edge sets, and updates aggregate metrics:
```ts
const filteredRawItems = result.raw_items.filter(item => {
  const t = new Date(item.created_at).getTime();
  return t >= minTime && t <= maxTime;
});
```
- **Fallback Guard**: If the selected claim falls outside the slider window, KSE updates the active selection:
```ts
useEffect(() => {
  if (filteredResult && filteredResult.raw_items) {
    const hasSelected = filteredResult.raw_items.some(item => item.id === selectedNodeId);
    if (!hasSelected) {
      setSelectedNodeId(filteredResult.originals[0]?.content_id || null);
    }
  }
}, [filteredResult, selectedNodeId]);
```

### 5.2. Dynamic Cluster Sentiment Classification
An aggregate sentiment badge is rendered for each original source cluster. The sentiment is calculated on the server by evaluating the core claim and its downstream branches:
- **Formula**: Evaluates downstream replies and quotes using keywords like *amazing, huge, awesome, breakthrough* (+1), or *fake, scam, bad, disappointing* (-1).
- **Sentiment Indicators**:
  - **Positive**: High positive ratio, styled in emerald (e.g. `text-emerald-400 bg-emerald-950/30`).
  - **Negative**: High negative ratio, styled in rose (e.g. `text-rose-400 bg-rose-950/30`).
  - **Neutral**: Balance of reactions, styled in slate (e.g. `text-slate-400 bg-slate-900/30`).

### 5.3. Portability Export Engine
- **JSON Exporter**: Packages and downloads the entire active `filteredResult` payload as `kse-analysis-[topic].json`.
- **Text Report Exporter**: Generates a highly formatted, detailed textual dossier including tuning weights, verification grounding, citations, and ranked originals.

---

## 6. Failure Recovery & API Optimization

To ensure continuous operation under API rate limits (HTTP 429) or missing keys:
1. **Dynamic Model Fallback List**: Checks and cycles through multiple model endpoints to maximize availability:
   ```ts
   const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
   ```
2. **Exponential Backoff**: If rate-limited, KSE retries up to 3 times per model, doubling the wait time after each failure:
   $$\text{Delay}_n = \text{Delay}_0 \cdot 2^{n-1}$$
3. **Local High-Fidelity Dataset**: If all API limits are exhausted, KSE activates its local backup engine to populate a complete, realistic dataset for the selected topic.
