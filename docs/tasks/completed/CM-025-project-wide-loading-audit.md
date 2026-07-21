# CM-025 — Project-wide loading performance audit

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** rendering, data fetching, database access, polling, images, JavaScript delivery
- **Likely files:** Read-only source audit plus `docs/tasks/**` and `docs/AGENT_HANDOFF.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Identify the highest-impact ways to reduce loading time throughout the application and provide an evidence-based implementation order.

## Acceptance criteria

- [x] Server-rendering and API waterfalls are mapped across routes.
- [x] Database query shape, pagination, and index risks are checked.
- [x] Client polling, duplicate fetching, bundle, and image-delivery costs are checked.
- [x] Recommendations are ranked by user impact, confidence, and effort.
- [x] Findings are recorded for future sessions.

## Dependencies

Builds on CM-020, CM-021, CM-022, and CM-024.

## Coordination notes

No active or blocked tasks overlap.

## Implementation summary

No implementation changes were authorized. The audit found five main project-wide costs:

1. Public auction detail, profile, and storefront routes remain client-only and begin their database/API work after JavaScript hydration. Profile is the clearest waterfall, issuing three independent requests after mount.
2. Dashboard queries download complete saved-listing, offer, seller-listing, and notification collections to display counts and only a few preview rows. Navbar notification polling can run alongside a separate dashboard/feed notification query.
3. Seller listings, saved listings, offers, and conversation inbox endpoints are unbounded. Their common newest-first patterns lack matching composite indexes, as do several review, bid, report, and audit-log reads.
4. Marketplace keyword/location filters use case-insensitive substring matching, which ordinary B-tree indexes cannot accelerate. Search will degrade as listing volume grows without PostgreSQL trigram or a dedicated search approach.
5. Dependency state is inconsistent: `package.json`/lock request Next 15.2.9, while the installed runtime is Next 15.1.11 and is reported invalid by `npm ls`; installed React is 19.2.7 through caret ranges. Local performance/build verification therefore does not currently match a clean Netlify install.

Recommended rollout:

- **Phase 0 — realize existing work:** deploy CM-022/CM-024, apply the notification index migration, warm the routes, and capture Netlify function plus database timings. Confirm Netlify functions and Supabase are regionally close before adding another cache layer.
- **Phase 1 — remove first-render waterfalls:** apply the CM-024 server-first initial-data pattern to auction detail, profile, and storefront; add route-shaped loading boundaries. Combine the public profile's profile/review/listing reads into one cached server composition where appropriate.
- **Phase 2 — shrink authenticated requests:** add purpose-built dashboard summary/preview responses, reuse notification summary cache, and paginate seller listings, saved listings, offers, and conversations. Return explicit field selections instead of full related records.
- **Phase 3 — support query shapes:** add measured composite indexes such as seller listing `(sellerId, createdAt)`, saved `(userId, createdAt)`, offers by buyer/listing and creation time, conversations by participant and update time, bids by auction and creation time, and reviews by reviewee and creation time. Add `pg_trgm` indexes only after confirming substring search remains the product requirement.
- **Phase 4 — delivery polish:** compress/resize uploads, add missing `sizes` to storefront images, replace the raw profile avatar `<img>` with the optimized image path where safe, and condition polling on visible/live state. Use bundle analysis before splitting large client pages; the current roughly 160–174 kB first-load totals are secondary to remote data latency.
- **Phase 5 — reproducibility:** reconcile package and lock versions, perform a clean install, update version documentation, and use production-mode measurements as the performance baseline.

## Verification

- Source audit of all page/client query sites, API Prisma reads, polling intervals, image usage, pagination, and Prisma indexes.
- Reviewed completed CM-020, CM-021, CM-022, and CM-024 evidence and final build route sizes.
- `npm ls next react react-dom @netlify/plugin-nextjs --depth=0` — exposed the installed/package Next.js mismatch; command returned `ELSPROBLEMS` because Next 15.1.11 does not satisfy the declared 15.2.9.
- No build or browser run was required because this task was a read-only audit and existing live/local timing evidence was reused.

## Remaining work

Implement the rollout as separately scoped tasks, beginning with deployment measurement and the public auction/profile/storefront server-first conversions.
