# CM-014 - Global navigation redesign

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** global navigation, account menu, mobile navigation, role mode
- **Likely files:** `src/components/navbar.tsx`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Redesign the shared top navigation to match the marketplace visual system while preserving existing destinations, authentication, seller mode, admin access, and notification behavior.

## Acceptance criteria

- [x] Desktop navigation stays on one line and under 80px tall.
- [x] Current marketplace location is visually and accessibly identified.
- [x] Mobile provides primary navigation and account actions without crowding the header.
- [x] Seller mode and unread state use the single coral accent and neutral surfaces.
- [x] Account actions are grouped clearly and remain keyboard accessible.
- [x] Signed-in, signed-out, buyer-only, seller, and admin states remain supported.
- [x] Existing routes and notification query behavior remain unchanged.
- [x] Documentation and verification records are current.

## Dependencies

None.

## Coordination notes

No active or blocked task files overlap. Existing CM-013 work is user-owned and will be preserved.

## Implementation summary

Rebuilt the shared navigation as a 72px responsive marketplace header with active-route feedback, compact utility actions, a structured account menu, a complete mobile navigation panel, accessible expanded state and Escape handling, and a unified coral and neutral role-mode treatment. Existing destinations, role gates, auth actions, and notification query behavior are preserved.

## Verification

- `npx tsc --noEmit` - passed.
- `npm run build` - passed, including Next.js type validation.
- `git diff --check` - passed.
- Desktop browser QA at `/listings` - verified a single-line 72px header, active Listings state, stable signed-out actions, and page alignment.
- Mobile browser QA at 390x844 - verified the menu opens and closes, exposes Listings, Auctions, and Log in, and preserves active state without horizontal overflow.
- Automated tests - not available in this repository.
- ESLint - no ESLint configuration exists, so a standalone lint run is unavailable; the production build completed its configured validation.

## Remaining work

None.
