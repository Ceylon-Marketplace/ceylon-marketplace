# AGENT_HANDOFF.md

**This file is append-only.** Read the protocol in `AGENTS.md` before using it: read the latest 2–3 entries before starting non-trivial work, append (never edit or overwrite) a concise entry when you finish, and if a merge conflict ever occurs here, resolve it by keeping **both** entries in chronological order — never by dropping one side.

Active ownership and task status live in `docs/tasks/`, not in this log. Handoffs should point to task files and preserve only important findings or unfinished context that is not obvious from Git and the current domain documentation.

## Log

### 2026-07-20 — Claude (Sonnet 5)

**Task:** Set up the "repo as source of truth" documentation process for this project (`AGENTS.md` + `docs/`), commissioned by Manoj, adapting a pattern he uses on another project for this two-person-plus-agents team.

**What was done and why:** Before writing anything, asked Manoj (per the task's explicit instruction to gate on answers first) four process questions — attribution convention, decision authority, WIP coordination, area ownership — and identified Naveen Wanigasekara as the second developer via `git log`/GitHub handle since he wasn't named up front. Then explored the actual codebase (stack, schema, API routes, deployment config, git history) rather than writing from assumptions, and created:

- `AGENTS.md` — operating manual: philosophy, reading order, handoff protocol, decision authority rule, WIP coordination, docs-as-part-of-implementation rule, engineering principles, completion checklist.
- `docs/PROJECT.md`, `PRODUCT.md`, `SCOPE.md`, `ROADMAP.md` — what this is, current stage (prototype/pre-launch), the two-developer team with no ownership split, inferred product scope.
- `docs/ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `DESIGN_SYSTEM.md` — stack, auth model, request flow, full endpoint inventory (verified against actual exported route handlers, not the README), schema, Tailwind/component conventions.
- `docs/CODING_STANDARDS.md`, `TESTING.md` — actual current lint/TS state (strict TS, no ESLint config despite the package being installed) and actual QA coverage (none automated — no test framework, no test files).
- `docs/DEPLOYMENT.md` — documented the deployment ambiguity found in git history (Vercel → Cloudflare Workers/OpenNext → reverted → Netlify, with `netlify.toml` and `wrangler.jsonc` both currently tracked and no GitHub Actions workflow present) as an open question rather than guessing which target is live.
- `docs/DECISIONS.md` — seeded with the sign-off rule and a `Proposed` entry (0001) recording the setup of this system itself, pending Naveen's review since only Manoj was reachable to answer the setup questions.
- This file, seeded with the "Currently in progress" section and this entry.

**Files changed:** All new files — `AGENTS.md` (root) and `docs/PROJECT.md`, `PRODUCT.md`, `SCOPE.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `DESIGN_SYSTEM.md`, `CODING_STANDARDS.md`, `TESTING.md`, `DEPLOYMENT.md`, `DECISIONS.md`, `AGENT_HANDOFF.md`. No application code was touched.

**Technical decisions:** See `docs/DECISIONS.md` 0001. Notably, chose to document doc/code mismatches found along the way (README's WebSocket claims vs. actual polling implementation; unenforced business rules like subscription-gated listing creation and video count limits; the multi-target deployment config) as explicit flagged discrepancies rather than silently resolving them one way, per the task's own instructions and the philosophy this system is meant to encode.

**Known issues/stubs left behind:**

- DECISIONS.md entry 0001 needs Naveen's sign-off to move from `Proposed` to `Accepted`.
- Several TBD markers throughout `docs/` need product/business input from Manoj and/or Naveen — see the summary given to Manoj at the end of this session for the full list.
- The deployment ambiguity in `docs/DEPLOYMENT.md` is documented but not resolved — no config was deleted, no target was chosen.

**Recommended next task:** Get Naveen's review on `docs/DECISIONS.md` 0001 (the process itself) and resolve the deployment target ambiguity in `docs/DEPLOYMENT.md` — that's the highest-leverage unresolved item since it blocks confidently shipping to production.

### 2026-07-21 — Codex (GPT-5) — CM-001

**Outcome:** Replaced the shared in-progress list with per-task files and stable `CM-###` traceability across tasks, branches, commits, pull requests, and handoffs. The completed record is [`docs/tasks/completed/CM-001-improve-multi-contributor-workflow.md`](tasks/completed/CM-001-improve-multi-contributor-workflow.md); the team-wide convention is proposed in `docs/DECISIONS.md` 0002 pending Naveen's review.

**Important findings:** The production build passes but reports Next.js 15.1.11, while `package.json` and `AGENTS.md` identify 15.1.12. This pre-existing lockfile/package documentation discrepancy was not changed as part of the workflow task. Lint remains unavailable because no ESLint configuration exists.

**Unfinished:** No implementation work remains. Naveen should review proposed ADRs 0001 and 0002; workflow automation is deliberately deferred until practical usage shows which rules are worth enforcing.

### 2026-07-21 — Codex (GPT-5) — CM-002

**Outcome:** Redesigned the registration experience into a responsive, marketplace-focused split layout with concise buyer/seller selection, accessible account fields, role-aware submission copy, and a generated product collection visual. The completed record is [`docs/tasks/completed/CM-002-marketplace-registration-redesign.md`](tasks/completed/CM-002-marketplace-registration-redesign.md).

**Important findings:** The previous auth concept included unverified “escrow-backed payments” and “verified sellers” claims plus an auction-ticket treatment that did not match the product's general marketplace role; those claims were removed rather than promoted. Type checking, production build, and desktop/mobile browser QA passed. The production build still reports the pre-existing Next.js 15.1.11 mismatch documented in CM-001.

**Unfinished:** No implementation work remains. The generated marketplace image is intentionally local at `public/images/auth/marketplace-collection.jpg`; future visual changes should preserve the current accessible form semantics and avoid adding claims not supported by `docs/PRODUCT.md`.

### 2026-07-21 — Codex (GPT-5) — CM-003

**Outcome:** Redesigned `/dashboard` into distinct buyer and seller marketplace workspaces with linked summaries, quick actions, recent activity, responsive listing sections, and explicit skeleton and empty states. The completed record is [`docs/tasks/completed/CM-003-marketplace-dashboard-redesign.md`](tasks/completed/CM-003-marketplace-dashboard-redesign.md).

**Important findings:** The old buyer dashboard requested `/offers/sent`, but that route does not exist; the canonical offers page and API use `GET /offers`, so the dashboard now follows that contract. Type checking and the production build passed. Browser QA verified the unauthenticated redirect without errors, but the available browser had no signed-in local account, so no populated live walkthrough was claimed.

**Unfinished:** No implementation work remains. A future manual session with a populated buyer and seller account can provide final content-density feedback using real marketplace data; no test records were created solely for this visual task.

### 2026-07-21 — Codex (GPT-5) — CM-004

**Outcome:** Removed the two auth-page console warnings reported after CM-002. The completed record is [`docs/tasks/completed/CM-004-auth-console-warnings.md`](tasks/completed/CM-004-auth-console-warnings.md).

**Important findings:** The hydration diff showed `cz-shortcut-listen="true"` injected on `<body>`, which comes from a browser extension rather than application rendering. The root body now tolerates extension-added attributes. The auth photo no longer uses `priority`, preventing Next.js from preloading a large responsive candidate that can remain unused. Type checking and the production build passed.

**Unfinished:** None.

### 2026-07-21 — Codex (GPT-5) — CM-005

**Outcome:** Redesigned `/auctions` with live/upcoming summaries and filters, a live spotlight, responsive auction cards, complete query states, pagination, and preserved 15-second polling. The completed record is [`docs/tasks/completed/CM-005-auctions-page-redesign.md`](tasks/completed/CM-005-auctions-page-redesign.md).

**Important findings:** The list card contract was wrong in two places: the query returns `_count.bids` rather than `bidCount`, and URL-only media rather than typed media, so valid images and bid totals could be lost. Server price decimals are now serialized before entering the client. The database also contains scheduled auctions whose start times have passed, and no lifecycle scheduler was found; this existing product gap is now recorded in `docs/PRODUCT.md` while the UI displays "Awaiting start."

**Unfinished:** The auction lifecycle automation question remains open as separate backend/product work. The index redesign itself is complete; type checking, production build, populated desktop QA, and filter interaction passed. Mobile screenshot capture timed out on remote Supabase images, so mobile was verified structurally rather than claimed as a completed visual capture.

### 2026-07-21 — Codex (GPT-5) — CM-006

**Outcome:** Redesigned the public `/` homepage into a discovery-first marketplace experience with a data-backed image hero, buyer and seller actions, active categories, recent listings, available auctions, honest empty states, and a focused seller CTA. The completed record is [`docs/tasks/completed/CM-006-public-homepage-redesign.md`](tasks/completed/CM-006-public-homepage-redesign.md).

**Important findings:** The existing homepage promoted unsupported inventory and fee claims; the redesign uses only capabilities and content verified by current repository data. The local seed data includes a screenshot-style listing image, so the homepage correctly displays it as the newest available product image. Type checking, production build, and populated desktop browser QA passed.

**Unfinished:** No implementation work remains. Future content seeding should prefer clean product photographs so the data-driven hero presents the marketplace at its best.
