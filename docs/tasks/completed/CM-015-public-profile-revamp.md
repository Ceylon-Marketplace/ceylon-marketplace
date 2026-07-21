# CM-015 - Public profile revamp

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** public profile, seller identity, reviews, active listings
- **Likely files:** `src/app/(main)/profile/[id]/page.tsx`, `src/app/api/reviews/[userId]/route.ts`, `docs/API.md`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Revamp public profiles as trust-focused marketplace identity pages using factual profile, verification, listing, storefront, and review data.

## Acceptance criteria

- [x] Profile hierarchy leads with identity, role, verification, location, and member context.
- [x] Listing, review, and rating summaries are based on real API data.
- [x] Available actions use implemented routes and do not expose a dead direct-message path.
- [x] Active listings and reviews remain useful in populated and empty states.
- [x] Own-profile, storefront, signed-out, unavailable, loading, and partial-query states are supported.
- [x] Mobile and desktop layouts match the established coral and neutral marketplace system.
- [x] Average rating reflects all reviews without changing the endpoint response shape.
- [x] Documentation and verification records are current.

## Dependencies

None.

## Coordination notes

No active or blocked task files overlap. Existing CM-014 navigation work is user-owned and will be preserved.

## Implementation summary

Rebuilt public profiles as trust-focused marketplace identity pages with a product-led header, factual verification and member context, a metric strip, canonical listing cards, structured review cards, explicit empty and partial-error states, and a compact profile-facts panel. Removed the unsupported direct-user message shortcut and corrected the review API average to aggregate all matching reviews while preserving its response shape.

## Verification

- `npx tsc --noEmit` - passed.
- `npm run build` - passed, including Next.js type validation.
- `git diff --check` - passed.
- Desktop browser QA at `/profile/cmqtkwe6c0000yqef9c3hu829` - verified Manoj Amarasekara's seller identity, email verification, member date, zero-activity summary, and composed listing/review empty states.
- Mobile browser QA at 390x844 - verified identity stacking, metric strip, responsive section copy, and no horizontal overflow.
- API browser QA - profile, listings, reviews, and notification requests returned successfully; no console warnings or errors were present.
- Automated tests - not available in this repository.
- ESLint - no ESLint configuration exists, so a standalone lint run is unavailable; the production build completed its configured validation.

## Remaining work

None.
