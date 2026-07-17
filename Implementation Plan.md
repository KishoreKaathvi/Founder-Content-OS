
# Implementation Plan: Founder Content OS

## Objective

Extend Signal Radar into Founder Content OS.

Signal Radar remains the X-only intelligence layer. It identifies high-signal, evidence-backed founder insights from ranked X originals.

Founder Content OS converts a selected insight into simple, Indian-fluent English content for:

- X
- LinkedIn
- Instagram posts, carousels, Reels
- WhatsApp status and broadcast drafts
- Facebook posts
- YouTube Shorts and long-form video briefs

No automatic publishing in V1. The product exports approved, platform-ready assets.

## Product Boundary

### In scope

- Reuse Signal Radar's existing ranked `OriginalSource` output as the insight source.
- Create a campaign brief from one selected X signal.
- Generate multi-platform content from the brief.
- Apply shared voice, evidence, platform-fit, and quality checks.
- Add a Content Studio to the current React portal.
- Preserve provenance links so generated content can be traced to its source signal.
- Keep language clear, non-technical, and naturally fluent for Indian English readers.
- Commit and push every completed implementation slice to `KishoreKaathvi/X-KES-App-July26`.

### Out of scope for V1

- Live Instagram, WhatsApp, Facebook, or YouTube signal ingestion.
- Automated publishing or account credential storage.
- Hindi, Hinglish, or regional-language generation.
- Multi-tenant authentication and billing.
- Claims that Signal Radar uses live X API collection when it is still simulated/fallback.

## Reference Systems

| System | Role |
|---|---|
| Signal Radar | X-only signal collection, provenance, ranking, evidence, verification |
| social-media-skills | Voice foundation, content matrix, channel formatting, scoring, analytics patterns |
| taste-skill | Product-interface quality: layout, typography, spacing, motion, anti-generic UI rules |

Taste Skill is used for the application UI, not as a substitute for editorial judgement. The Content Studio will add its own content-quality gate. [Taste Skill](https://github.com/Leonxlnx/taste-skill) · [Social Media Skills](https://github.com/charlie947/social-media-skills)

## Architecture

```text
KSERunResult
  -> selected OriginalSource
  -> FounderInsight
  -> CampaignBrief
  -> ContentCampaign
  -> ChannelAsset[]
  -> ContentQualityReview[]
  -> approved exports
```

### New domain contracts

```ts
type FounderInsight = {
  id: string
  sourceOriginalId: string
  topic: string
  claim: string
  whyItMatters: string
  evidenceLinks: { title: string; uri: string }[]
  sourceUrl?: string
  authority: number
  originality: number
  freshness: number
  audience: "INDIAN_ENGLISH"
}

type CampaignBrief = {
  id: string
  insightId: string
  objective: "AWARENESS" | "TRUST" | "LEADS"
  audience: string
  coreAngle: string
  proofPoints: string[]
  contentPillars: string[]
  callToAction: string
  voiceRules: string[]
}

type ChannelAsset = {
  id: string
  campaignId: string
  channel:
    | "X"
    | "LINKEDIN"
    | "INSTAGRAM_POST"
    | "INSTAGRAM_CAROUSEL"
    | "INSTAGRAM_REEL"
    | "WHATSAPP"
    | "FACEBOOK"
    | "YOUTUBE_SHORT"
    | "YOUTUBE_VIDEO"
  format: "TEXT" | "CAROUSEL" | "SCRIPT" | "CREATIVE_BRIEF"
  draft: string
  status: "DRAFT" | "REVIEWED" | "APPROVED" | "EXPORTED"
}

type ContentQualityReview = {
  assetId: string
  evidenceScore: number
  voiceScore: number
  platformFitScore: number
  clarityScore: number
  risks: string[]
  recommendation: "REVISE" | "APPROVE"
}
```

## Delivery Phases

### Phase 0: Repository and delivery setup

1. Restore this folder as a writable Git checkout connected to `origin`.
2. Verify GitHub authentication and push access.
3. Create `tasks/plan.md`, `tasks/todo.md`, `docs/architecture.md`, and an attribution notice for reused MIT material.
4. Add a test runner and test commands because the current project has type-checking but no test suite.

Acceptance:

- `git status` identifies the connected repository.
- A feature branch exists.
- `npm run lint`, tests, and `npm run build` are available.
- No API keys or credentials are committed.

### Phase 1: Insight boundary

1. Add `FounderInsight` and campaign contracts to `src/types.ts`.
2. Create a pure mapper from `OriginalSource` to `FounderInsight`.
3. Preserve source URL, verification citations, provenance score, and evidence.
4. Add unit tests for complete, missing-evidence, and fallback-data cases.

Acceptance:

- Any selected Signal Radar original can become a Founder Insight.
- A generated insight cannot lose its provenance or source links.
- Fallback/simulated origin is visibly labelled.

### Phase 2: Campaign generation API

1. Add `POST /api/content/campaigns`.
2. Validate insight, audience, objective, and optional founder context at the API boundary.
3. Generate a structured Campaign Brief with the existing Gemini integration and a safe local fallback.
4. Return consistent typed errors and never expose internal model errors.

Acceptance:

- A valid Founder Insight returns a Campaign Brief.
- Invalid input returns a structured validation error.
- Missing Gemini credentials still produce deterministic fallback output.

### Phase 3: Multi-platform asset generation

Implement one vertical slice at a time:

1. X and LinkedIn text assets.
2. Instagram post, carousel, and Reel brief.
3. WhatsApp and Facebook assets.
4. YouTube Short and long-form video brief.
5. Content exports as Markdown and JSON.

Every asset must:

- State the source claim conservatively.
- Preserve proof points.
- Use simple Indian-fluent English.
- Include a channel-appropriate CTA.
- Avoid technical jargon unless it is explained.
- Remain an editable draft, never an auto-post.

### Phase 4: Content quality gate

1. Add checks for evidence fidelity, clarity, voice consistency, platform fit, and unsupported claims.
2. Block approval when a draft overstates the source evidence.
3. Show specific revision guidance rather than a generic score.
4. Store the quality review alongside each asset.

Acceptance:

- Unsupported claims are flagged.
- Assets below the quality threshold cannot be exported as approved.
- The review clearly explains the required fix.

### Phase 5: Content Studio interface

1. Add `Content Studio` to the existing portal navigation.
2. Build the selected-signal to Campaign Brief flow.
3. Build the campaign workspace with channel cards, draft editor, source evidence, and review state.
4. Build export controls for approved assets.
5. Apply taste-skill principles: intentional hierarchy, dense but readable layout, restrained motion, no generic dashboard UI.

Acceptance:

- A user can select a Signal Radar original and create a campaign without leaving the portal.
- Every asset visibly links back to the founder insight and evidence.
- Desktop and mobile layouts work at 320px, 768px, 1024px, and 1440px.
- Keyboard navigation and WCAG AA contrast are maintained.

### Phase 6: Verification and launch readiness

1. Run unit, integration, type, and production-build checks.
2. Test the full path: signal -> insight -> brief -> assets -> review -> export.
3. Check fallback behavior without a Gemini key.
4. Audit content for evidence leakage and invented facts.
5. Document setup, limitations, and the deferred live-ingestion roadmap.
6. Commit each verified slice and push to GitHub.

## Checkpoints

### Checkpoint A: Foundation

- Contracts compile.
- Tests are running.
- Git remote and push are verified.

### Checkpoint B: First working campaign

- One X signal generates a LinkedIn and X campaign.
- Evidence and source links are retained.
- Quality review is visible.

### Checkpoint C: Full V1

- All target channels generate editable assets.
- Export works.
- Build, lint, and tests pass.
- Each completed slice has been committed and pushed.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Signal data is simulated/fallback | Label its origin clearly and avoid claiming live X collection |
| Generated copy invents facts | Require evidence-bound generation and a blocking review gate |
| Platform requirements change | Keep channel generation behind separate adapters |
| Social skills are generic | Use founder voice rules, source evidence, and Indian-English clarity rules |
| Taste skill is misused as editorial guidance | Restrict it to UI design and create a separate content-quality rubric |
| Git push failure | Verify remote, authentication, and status before every push |

## Deferred roadmap

1. Real X collection after a compliant data-access decision.
2. Founder voice onboarding and writing samples.
3. Hinglish and regional-language adapters.
4. Publishing integrations after explicit platform authorization.
5. Performance feedback from platform analytics.
6. Multi-tenant workspaces, authentication, and billing.
```