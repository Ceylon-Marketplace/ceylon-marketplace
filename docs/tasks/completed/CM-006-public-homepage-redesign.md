# CM-006 — Public homepage redesign

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** public homepage, marketplace discovery, server-rendered content, responsive design
- **Likely files:** `src/app/page.tsx`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Redesigned the public homepage as a responsive, product-led marketplace entry point that helps visitors discover listings and auctions or begin selling.

## Acceptance criteria

- [x] The hero communicates the marketplace value with real product imagery and clear buyer/seller actions.
- [x] Active categories, recent listings, and available auctions are rendered from current repository data.
- [x] Empty data states remain visually complete without unsupported product claims.
- [x] Existing public route navigation and authentication-aware navbar behavior remain intact.
- [x] The page follows the established coral marketplace design language and accessibility conventions.
- [x] Relevant documentation is current.
- [x] Required verification passes.

## Dependencies

None.

## Coordination notes

No active or blocked tasks overlapped. Existing CM-005 auction redesign work was preserved and its shared `AuctionCard` was reused.

## Implementation summary

Replaced the generic marketing hero and static feature cards with an asymmetric marketplace hero, active category links, recent active listing cards, available auction cards, honest empty states, and a focused seller call to action. Homepage queries are dynamically server rendered so inventory stays current, and serialize Prisma values before passing auction records into the client card component.

## Verification

- `npx tsc --noEmit` — passed.
- `npm run build` — passed.
- Desktop browser QA at `/` — passed with populated database content; navigation, hero imagery, listings, auctions, seller CTA, and footer rendered correctly.
- Browser semantic snapshot confirmed the expected heading hierarchy and link destinations.
- Responsive behavior was reviewed structurally through the Tailwind breakpoints; no mobile screenshot is claimed because external Supabase image loading can stall full-page capture in the available browser.
- `npm run lint` — skipped because the repository has no ESLint configuration, as documented in `docs/CODING_STANDARDS.md`.

## Remaining work

None. The seed database currently includes a screenshot-style product image, so the hero can look unusual in local development; it will automatically use higher-quality marketplace imagery when those listings are available.
