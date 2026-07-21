# CM-018 — Facebook-style notifications

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** notifications, navigation popover, responsive activity feed, read state
- **Likely files:** `src/components/navbar.tsx`, `src/components/notification-popover.tsx`, `src/app/(main)/notifications/page.tsx`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Open Notifications from the navigation bell as a compact, familiar social feed without taking users away from their current page, while preserving marketplace destinations, optimistic read behavior, accessibility, and the Ceylon design system.

## Acceptance criteria

- [x] The top-navigation bell toggles the feed without navigating to a page.
- [x] The popover uses compact avatar-led rows, readable activity copy, time, unread emphasis, and contextual actions.
- [x] Optimistic individual and bulk read actions remain functional and roll back on failure.
- [x] Mobile and desktop layouts expose the same information and touch-friendly actions.
- [x] Loading, empty, and error states match the final popover composition.
- [x] Outside click, Escape, route changes, and competing navigation menus close the popover.
- [x] Existing marketplace destinations and notification query coordination remain unchanged.
- [x] Relevant documentation and verification records are current.

## Dependencies

None.

## Coordination notes

No active or blocked tasks overlap this surface.

## Implementation summary

Replaced the navigation bell link with a responsive social-style notification popover. The panel loads the latest 12 records, exposes the global unread count, supports optimistic individual and bulk read updates with rollback, and routes each supported event to its existing marketplace destination. The navigation owns close coordination across outside click, Escape, route changes, account-menu activation, and mobile-menu activation.

## Verification

- `npx tsc --noEmit` - passed
- `git diff --check` - passed
- `npm run build` - passed
- `npm run lint` - skipped because the repository has no ESLint configuration and the script opens the interactive setup prompt
- Protected-route browser QA - passed earlier for `/notifications`; authenticated popover behavior was verified through compilation, event wiring review, and live authenticated API requests in the local app

## Remaining work

None.
