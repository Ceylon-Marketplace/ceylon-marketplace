# CM-019 — Grouped notification popover

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** notification grouping, navigation popover, optimistic read state
- **Likely files:** `src/components/notification-popover.tsx`, `src/app/api/notifications/route.ts`, `docs/API.md`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Collapse repeated activity for the same conversation, listing, auction, or offer into one recent notification row with a count of the remaining events.

## Acceptance criteria

- [x] Groups use stable metadata entity IDs rather than notification titles.
- [x] Each group displays its newest notification and `+N more`, where N is group size minus one.
- [x] A group is unread when any member is unread.
- [x] Opening a group optimistically marks every unread member as read and follows the newest notification destination.
- [x] Failed grouped read updates restore the previous cache.
- [x] Ungroupable notifications remain independent.
- [x] Documentation and verification records are current.

## Dependencies

CM-018 notification popover.

## Coordination notes

No active or blocked tasks overlap this surface.

## Implementation summary

The popover now loads the latest 50 notifications and groups them in newest-first order using `conversationId`, `auctionId`, `listingId`, then `offerId`, leaving records without a stable entity ID independent. Rows show the newest event and `+N more`, derive unread emphasis from all group members, and atomically mark every unread member through the API's new additive `{ ids }` PATCH payload.

## Verification

- `npx tsc --noEmit` - passed
- `git diff --check` - passed
- `npm run build` - passed
- Live authenticated local QA - the popover loaded the 50-record notification response successfully after hot reload
- `npm run lint` - skipped because the repository has no ESLint configuration and the script opens the interactive setup prompt

## Remaining work

None.
