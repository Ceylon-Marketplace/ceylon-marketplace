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

### 2026-07-21 — Codex (GPT-5) — CM-007

**Outcome:** Redesigned `/auctions/[id]` into a responsive bidding workspace with a product gallery, sticky state-aware bidding panel, item description, masked bid activity, seller and schedule context, verified API-backed bidding guidance, and complete loading and unavailable states. The completed record is [`docs/tasks/completed/CM-007-auction-detail-redesign.md`](tasks/completed/CM-007-auction-detail-redesign.md).

**Important findings:** The target seed auction remains `SCHEDULED` even though its start time has passed. The detail page now follows the auction index convention and displays "Awaiting start" until lifecycle automation updates the record. Unsupported reserve and winner-contact claims were removed; the page only explains constraints enforced by the bid API. Type checking, production build, and populated desktop browser QA passed.

**Unfinished:** The existing auction lifecycle automation gap remains separate backend/product work. No redesign implementation remains.

### 2026-07-21 — Codex (GPT-5) — CM-008

**Outcome:** Redesigned `/listings` and `/listings/[id]` as a coordinated marketplace journey with clearer discovery controls, quieter product cards, a product-led gallery, state-aware buyer actions, factual seller context, and complete loading, empty, error, and mutation feedback. The completed record is [`docs/tasks/completed/CM-008-listings-experience-redesign.md`](tasks/completed/CM-008-listings-experience-redesign.md).

**Important findings:** The old contact action called a nonexistent `/api/conversations/listing/[id]` route; it now uses the implemented `POST /api/conversations` contract with `{ listingId }`. The old review controls were unreachable because they were nested under the active-listing action branch while also requiring a non-active status, and the detail API hides non-active listings from non-owners. That dead UI was removed rather than preserved as a false capability. Type checking, production build, populated desktop QA, and filter interaction passed.

**Unfinished:** No redesign work remains. Completed-transaction reviews need a separate, reachable transaction-history surface if the product wants buyers to submit reviews after a sale.

### 2026-07-21 — Codex (GPT-5) — CM-009

**Outcome:** Redesigned `/messages` into a responsive marketplace conversation workspace with a searchable inbox, listing and participant context, unread indicators, clearer message states, a reliable multiline composer, URL-synchronized selection, and mobile thread navigation. The completed record is [`docs/tasks/completed/CM-009-messages-workspace-redesign.md`](tasks/completed/CM-009-messages-workspace-redesign.md).

**Important findings:** The previous composer cleared its draft before the API confirmed delivery, so failed sends could lose the user's text. It now clears only after success and reports errors inline. Conversation changes previously did not update the URL; the selected `conversationId` is now preserved for refresh and sharing. Type checking and the production build passed, and signed-out QA confirmed the requested destination survives the login redirect.

**Unfinished:** No implementation work remains. The available test browser was signed out, so a populated authenticated screenshot was not claimed; a future signed-in session can provide final visual-density feedback on long threads.

### 2026-07-21 — Codex (GPT-5) — CM-010

**Outcome:** Improved the database-backed chat with adaptive polling and an optimistic send lifecycle. Active threads poll every three seconds, inboxes every 15 seconds, and both pause while the tab is hidden or after two minutes of inactivity. New messages appear immediately as "Sending," transition to the persisted sent/read flow, or remain retryable as "Not sent." The completed record is [`docs/tasks/completed/CM-010-adaptive-chat-delivery.md`](tasks/completed/CM-010-adaptive-chat-delivery.md).

**Important findings:** The prior mutation waited for the POST and subsequent refetch before a sent message could appear, which made delivery seem broken on slower database responses. The optimistic cache entry now provides immediate feedback without weakening the database/API as the source of truth. Type checking and production build passed.

**Unfinished:** No implementation work remains. True WebSocket delivery remains optional future architecture and still requires a separately approved decision.

### 2026-07-21 — Codex (GPT-5) — CM-011

**Outcome:** Made chat submission unconditionally immediate and independently queued. Every Enter or send-button action inserts its bubble synchronously, clears the composer, shows "Sending...", and allows the next message while prior requests are pending. Responses are scoped to the originating conversation and temporary bubble. The completed record is [`docs/tasks/completed/CM-011-immediate-chat-queue.md`](tasks/completed/CM-011-immediate-chat-queue.md).

**Important findings:** CM-010's first optimistic implementation awaited query cancellation before inserting the bubble and disabled sending while any mutation was pending. Slow cancellation could therefore delay visual insertion, and users could not queue messages. Both constraints are removed while preserving retry and server-backed sent/read states. Type checking and the production build passed.

**Unfinished:** None.

### 2026-07-21 — Codex (GPT-5) — CM-012

**Outcome:** Redesigned `/notifications` into a responsive marketplace activity center with total and unread summaries, accessible filters, destination-aware rows, optimistic read actions, and complete loading, error, and empty states. The completed record is [`docs/tasks/completed/CM-012-notifications-activity-center.md`](tasks/completed/CM-012-notifications-activity-center.md).

**Important findings:** The notification page and navbar used unrelated React Query keys, so reading notifications did not reliably refresh the global badge. Both now use the shared `['notifications']` prefix with separate page and summary subkeys, and read mutations invalidate the prefix after settling. Existing metadata can route message, auction, listing, and offer events to their relevant workspaces. Type checking and the production build passed; signed-out browser QA verified destination-preserving login redirection.

**Unfinished:** No redesign work remains. The page continues to request the latest 50 records, matching the existing notification limit; pagination can be considered separately if notification histories grow beyond that product requirement.

### 2026-07-21 — Codex (GPT-5) — CM-013

**Outcome:** Redesigned `/listings/create` as a responsive seller publishing workspace with decision-led form sections, explicit selling-format selection, a stronger photo uploader, a sticky readiness panel, and restrained protected, role, error, loading, and success states. The completed record is [`docs/tasks/completed/CM-013-create-listing-redesign.md`](tasks/completed/CM-013-create-listing-redesign.md).

**Important findings:** Auction creation previously presented two separate starting-price inputs even though the listing and auction requests need the same opening value. The new auction opening-bid input synchronizes both existing payload fields without changing either API contract. The route now preserves its destination through sign-in, and the success state no longer promises a specific moderation time or automatic auction lifecycle behavior that the repository cannot guarantee. Type checking and the production build passed.

**Unfinished:** None.

### 2026-07-21 — Codex (GPT-5) — CM-014

**Outcome:** Redesigned the shared top navigation as a 72px responsive marketplace header with active-route feedback, a complete mobile menu, clearer account grouping, a restrained seller CTA, and one coral accent across role and unread states. The completed record is [`docs/tasks/completed/CM-014-global-navigation-redesign.md`](tasks/completed/CM-014-global-navigation-redesign.md).

**Important findings:** The old mobile header hid Listings and Auctions entirely, and buyer/seller mode introduced unrelated blue and green palettes. The new mobile menu restores primary navigation, while the account menu groups marketplace, role, and account actions. Route changes and Escape now close open menus, and `aria-current` and expanded state expose navigation context. Type checking, the production build, desktop QA, and 390px mobile QA passed.

**Unfinished:** Authenticated role variants remain implemented from the existing store conditions, but the isolated visual QA browser was signed out. The active local application continued to exercise authenticated notification requests during implementation; no code work remains.

### 2026-07-21 — Codex (GPT-5) — CM-015

**Outcome:** Revamped `/profile/[id]` into a trust-focused marketplace identity page with factual role and verification context, a marketplace summary, active listings, transaction-linked reviews, complete empty and error states, and responsive profile facts. The completed record is [`docs/tasks/completed/CM-015-public-profile-revamp.md`](tasks/completed/CM-015-public-profile-revamp.md).

**Important findings:** The old profile Message action linked to `/messages?userId=...`, but messaging is listing-scoped and the workspace does not support that parameter. The dead action was removed and visitors are directed through active listings. `GET /api/reviews/[userId]` also calculated `avgRating` from only the current page; it now uses a database aggregate across all matching reviews without changing the response shape. Type checking, production build, target-profile desktop QA, and 390px mobile QA passed.

**Unfinished:** None.

### 2026-07-21 — Codex (GPT-5) — CM-016

**Outcome:** Aligned `/profile/edit` with the revamped public profile through grouped identity and privacy fields, a live public preview, dirty and invalid-avatar states, explicit profile return paths, and save-to-profile navigation. The completed record is [`docs/tasks/completed/CM-016-profile-edit-flow.md`](tasks/completed/CM-016-profile-edit-flow.md).

**Important findings:** The public user API included the full `Profile` relation, which returned the stored phone field even though the public page did not display it. `GET /api/users/[id]` now selects only first name, last name, avatar, bio, and location. The old edit flow also relied on browser history and stayed on the form after saving; Back, Cancel, and successful Save now return to the current user's public profile, with the auth store refreshed first. Type checking and the production build passed.

**Unfinished:** The isolated browser session was signed out, so authenticated form mutation was not submitted during automated QA. The active signed-in local application loaded the redesigned edit route successfully, and protected destination preservation was verified. No implementation work remains.

### 2026-07-21 — Codex (GPT-5) — CM-017

**Outcome:** Revamped `/listings/saved` into a responsive personal marketplace collection with a clear item count, canonical listing cards, persistent accessible removal controls, optimistic updates, rollback feedback, and complete protected, loading, empty, query-error, and mutation-error states. The completed record is [`docs/tasks/completed/CM-017-saved-listings-revamp.md`](tasks/completed/CM-017-saved-listings-revamp.md).

**Important findings:** The prior removal affordance depended on desktop hover, which made it undiscoverable on touch devices. Removal now sits below every card and updates the collection immediately, restoring the item if the request fails. The saved-listings API also no longer loads unused seller profile data. Type checking, the production build, and signed-out destination-preserving browser QA passed.

**Unfinished:** Authenticated removal was not submitted in the isolated browser session. No implementation work remains.

### 2026-07-21 — Codex (GPT-5) — CM-018

**Outcome:** Changed the top-navigation notification bell from a page link into a responsive Facebook-style popover with circular event identities, unread emphasis, relative time, bounded scrolling, and optimistic individual and bulk read actions. The completed record is [`docs/tasks/completed/CM-018-facebook-style-notifications.md`](tasks/completed/CM-018-facebook-style-notifications.md).

**Important findings:** The first redesign still treated notifications as a destination page, but the requested interaction was an in-context navigation popup. The new popover keeps users on their current page, closes on outside click, Escape, route changes, and competing menus, and opens existing message, auction, listing, and offer destinations from its rows. Failed read mutations restore the previous cache. Type checking and the production build passed; lint remains unconfigured and opens an interactive setup prompt.

**Unfinished:** None.

### 2026-07-21 — Codex (GPT-5) — CM-019

**Outcome:** Grouped repeated notification-popover activity by conversation, auction, listing, or offer metadata. Each group now shows its newest event plus `+N more`, stays unread while any member is unread, and opens the newest event destination. The completed record is [`docs/tasks/completed/CM-019-grouped-notification-popover.md`](tasks/completed/CM-019-grouped-notification-popover.md).

**Important findings:** Offer notifications include both `offerId` and `listingId`, so listing identity is intentionally evaluated first to consolidate activity for the same product. Group read updates use a new additive `{ ids }` notification PATCH payload and one scoped `updateMany` call, avoiding partial multi-request read state. Type checking, the production build, and live authenticated 50-record loading passed.

**Unfinished:** Group counts cover the latest 50 notification records loaded by the popover; no implementation work remains.

### 2026-07-21 — Codex (GPT-5) — CM-020

**Outcome:** Audited the authenticated page-render slowdown without changing behavior. The completed record is [`docs/tasks/completed/CM-020-page-render-performance-audit.md`](tasks/completed/CM-020-page-render-performance-audit.md).

**Important findings:** The notification popover eagerly loads 50 records on every authenticated main-page mount while closed and repeats the full request every 30 seconds. Each request performs three database queries, and live development timings were approximately 0.7 to 3.6 seconds. The record query orders by creation time, but Notification only has a `[userId, isRead]` index, not `[userId, createdAt DESC]`. The main layout is also force-dynamic, though the eager popover query is the clearest recent regression.

**Unfinished:** Recommended follow-up is a lightweight badge-count query, full-feed loading only while open, closed-state polling removal, and a composite notification index, followed by remeasurement.

### 2026-07-21 — Codex (GPT-5) — CM-021

**Outcome:** Extended the performance audit to Home and Listings without changing behavior. The completed record is [`docs/tasks/completed/CM-021-home-listings-navigation-audit.md`](tasks/completed/CM-021-home-listings-navigation-audit.md).

**Important findings:** Home and Listings are uncached server-rendered routes that each wait for three direct Prisma queries against the remote Supabase pooler. The data overlaps, especially active listings and categories, but is queried again on navigation. Browser measurements were approximately 15.45 seconds for first Home load, 4.30 seconds for warm Home, 1.68 seconds for warm Listings, and 3.17 seconds for the actual Home-to-Listings client transition. Development compilation explains part of the first load, but not the warm multi-second transition.

**Unfinished:** Recommended follow-up is bounded revalidation/shared caching for public data, route-level loading UI, notification lazy loading, then database and image profiling.

### 2026-07-21 — Codex (GPT-5) — CM-022

**Outcome:** Implemented the audited render-performance fixes: Home, Listings, and Auctions now use bounded first-party route caching; Listings has an immediate shaped loading state; and the notification bell keeps a lightweight unread summary while loading its 50-record grouped feed only when open. The completed record is [`docs/tasks/completed/CM-022-marketplace-render-performance.md`](tasks/completed/CM-022-marketplace-render-performance.md).

**Important findings:** The optimized build now emits all three public marketplace indexes as static routes, while authenticated data remains in protected API/TanStack Query flows. Redis is not needed for this stage. Proposed ADR 0003 records the pattern pending Naveen's review. Type checking, two production builds, populated Home/Listings browser QA, and console-error inspection passed; lint remains unconfigured and interactive.

**Unfinished:** Apply the new notification composite-index migration through the normal deployment migration process. Naveen should review proposed ADR 0003; no implementation work remains.

### 2026-07-21 — Codex (GPT-5) — CM-023

**Outcome:** Added a narrow Netlify secrets-scanner hotfix for the non-sensitive Supabase project URL and the two already-known non-sensitive configuration keys. Scanning remains enabled, and credential keys—including `SUPABASE_SERVICE_ROLE_KEY`—remain protected. The completed record is [`docs/tasks/completed/CM-023-netlify-supabase-url-scan-hotfix.md`](tasks/completed/CM-023-netlify-supabase-url-scan-hotfix.md).

**Important findings:** The scanner matched `SUPABASE_URL` inside generated Netlify route blobs, which is expected because the project URL is runtime configuration rather than an authentication secret. The exception is key-scoped instead of disabling scanning or excluding generated output paths. Type checking and the 41-page production build passed.

**Unfinished:** Trigger a new Netlify deploy to verify the remote scanner result; no implementation work remains.
