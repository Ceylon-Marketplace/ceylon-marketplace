# CM-024 — Improve listing detail load performance

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** listing detail rendering, public data loading, performance documentation
- **Likely files:** `src/app/(main)/listings/[id]/**`, `src/app/api/listings/[id]/route.ts`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DESIGN_SYSTEM.md`, `docs/AGENT_HANDOFF.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Public listing details render from server-provided data instead of waiting for a client-side API waterfall, while authenticated save state and existing buyer actions remain correct.

## Acceptance criteria

- [x] Active listing content is present in the initial server response.
- [x] Authenticated listing state continues to reconcile through the existing API query.
- [x] Non-active owner access and unavailable states retain their current behavior.
- [x] Relevant documentation is current.
- [x] Type checking, production build, and manual QA pass.

## Dependencies

Builds on the bounded public-cache approach from CM-022 and proposed ADR 0003.

## Coordination notes

No active or blocked tasks overlap.

## Implementation summary

Split the route into a server page and interactive client, then supplied active public listing data through a 30-second `unstable_cache` entry. Signed-out public renders avoid the follow-up API request during the freshness window; signed-in sessions still reconcile `isSaved`, and missing public data continues through the existing API so owners can access non-active listings. Both data paths now select only the detail fields and public seller data the UI consumes instead of loading full user/profile records. Architecture, API, and design-system documentation now describe the server-first detail path.

## Verification

- `npx tsc --noEmit` — passed.
- `npm run build` — passed after the final cache/query changes; all 41 static pages generated and `/listings/[id]` compiled successfully.
- `npm run lint` — skipped because the repository has no ESLint configuration and the command remains interactive.
- Local browser QA — the target listing rendered its title, image, price, seller, and actions with no browser warnings or errors. A warm repeat render completed in approximately 146 ms in development; this is directional cache verification, not a production benchmark.
- Live pre-change reproduction — the deployed target took approximately 6–7 seconds to reach network idle.
- `git diff --check` — passed.

## Remaining work

Deploy the change to Netlify and remeasure the live target after the deployment cache is warm.
