# CM-021 — Home to Listings navigation audit

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** homepage, listings discovery, server rendering, database latency
- **Likely files:** Read-only audit
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Measure and explain the broader delay when navigating from Home to Listings rather than attributing all latency to the notification popover.

## Acceptance criteria

- [x] Home and Listings server data paths are traced.
- [x] Full and client-side navigation timing is measured.
- [x] Development-only compilation cost is separated from warm navigation cost.
- [x] A scoped optimization order is recorded without changing behavior during a diagnostic request.

## Dependencies

CM-020 performance audit.

## Coordination notes

No active or blocked tasks overlap this read-only audit.

## Implementation summary

No implementation changes were authorized. Home and the main route group both declare `force-dynamic`. Home waits for three direct Prisma queries for listings, categories, and auctions. Listings then waits for three new direct queries for listings, total count, and categories, despite overlapping substantially with Home data. These queries use the remote Supabase pooler in Singapore, and no route-level revalidation or shared data cache is applied.

In the local development browser, first Home navigation took about 15.45 seconds, warm Home about 4.30 seconds, warm Listings about 1.68 seconds, and the actual Home-to-Listings client transition about 3.17 seconds. The first-load figure includes Next.js development compilation, but the multi-second warm client transition confirms a real uncached server/data bottleneck.

Recommended order: replace unconditional dynamic rendering for public marketplace data with bounded revalidation; share or cache category and active-listing reads; add a route `loading.tsx` so navigation responds immediately; lazy-load notification detail only when opened; then profile database query time and image delivery separately.

## Verification

- Source audit of Home, Listings server page, Listings client, main layout, API client, Prisma client, and database location
- In-app browser timing across cold, warm, and client-side transitions
- Production comparison was not run because the active development server had removed the previous production build artifact

## Remaining work

Implement caching, streaming/loading UI, and notification lazy loading in a separately authorized change, then remeasure in both development and production modes.
