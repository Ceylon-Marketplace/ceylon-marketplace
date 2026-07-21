# CM-022 — Improve marketplace render performance

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** public marketplace rendering, notifications, database indexes, performance documentation
- **Likely files:** `src/app/page.tsx`, `src/app/(main)/layout.tsx`, `src/app/(main)/listings/**`, `src/app/(main)/auctions/page.tsx`, `src/components/notification-popover.tsx`, `src/app/api/notifications/route.ts`, `prisma/schema.prisma`, `prisma/migrations/**`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE.md`, `docs/DECISIONS.md`, `docs/AGENT_HANDOFF.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Home-to-listings navigation paints promptly, public marketplace data avoids repeated remote database work within a short freshness window, and the closed notification popup no longer downloads the full notification feed.

## Acceptance criteria

- [x] Home, Listings, and Auctions use bounded revalidation without caching authenticated or user-specific data.
- [x] Listings displays a route-shaped loading state during uncached navigation.
- [x] The notification bell fetches a lightweight unread summary while closed and loads grouped notification records only while open.
- [x] Notification list ordering has a matching composite database index migration.
- [x] Relevant architecture, API, database, and decision documentation is current.
- [x] Type checking, production build, and relevant manual QA pass.

## Dependencies

CM-020 and CM-021 performance audit findings. ADR 0003 remains proposed pending Naveen's review; the implementation is reversible and bounded.

## Coordination notes

No active or blocked tasks overlap. Existing uncommitted CM-020 and CM-021 documentation belongs to the preceding audit work and will be preserved.

## Implementation summary

Removed the shared forced-dynamic setting and added bounded route revalidation for public Home, Listings, and Auctions reads. Added a Listings loading shell, split notification unread summaries from the lazy popup feed, and added the notification ordering index migration. The first-party cache precedent is recorded as proposed ADR 0003 pending Naveen's review.

## Verification

- `npm run db:generate` — passed.
- `npx tsc --noEmit` — passed.
- `npm run build` — passed twice; Home, Listings, and Auctions were emitted as static routes.
- `npm run lint` — skipped because the repository still has no ESLint configuration and the command opens the interactive setup prompt.
- Production browser QA — Home and Listings rendered with the expected populated state; Home-to-Listings navigation reached the correct route; no browser warnings or errors were recorded.
- Dev browser QA — Listings loading boundary and populated destination rendered correctly. Browser automation timing includes a repeatable fixed wait, so it was not used as a trustworthy post-change millisecond benchmark.
- `git diff --check` — passed.

## Remaining work

Apply `prisma/migrations/20260721183000_add_notification_created_at_index/migration.sql` through the normal deployment migration process. Naveen should review proposed ADR 0003 before it is accepted as a permanent project-wide precedent.
