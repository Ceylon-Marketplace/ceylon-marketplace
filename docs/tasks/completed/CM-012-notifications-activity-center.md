# CM-012 — Notifications activity center

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** notifications, activity navigation, read state, navbar badge
- **Likely files:** `src/app/(main)/notifications/page.tsx`, `src/components/navbar.tsx`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Redesign notifications as a responsive marketplace activity center with reliable read-state synchronization and useful destinations.

## Acceptance criteria

- [x] Page hierarchy clearly communicates total and unread activity.
- [x] All and unread filters are accessible and useful.
- [x] Notification rows distinguish unread state using the established coral accent without a rainbow palette.
- [x] Known notification metadata routes users to the relevant message, listing, auction, or offers page.
- [x] Individual and mark-all-read actions update the page and navbar badge consistently.
- [x] Loading, empty, filtered-empty, error, signed-out, and mutation states remain useful.
- [x] Existing notification API behavior remains intact.
- [x] Documentation and verification records are current.

## Dependencies

None.

## Coordination notes

No active or blocked task files overlap. Existing CM-011 message changes are user-owned and will be preserved.

## Implementation summary

Replaced the generic notification card with a responsive marketplace activity center containing a summary strip, accessible filters, destination-aware activity rows, and complete loading/error/empty states. Added optimistic individual and mark-all read behavior. Standardized the page and navbar React Query keys under a shared notifications prefix so mutations reconcile both surfaces.

## Verification

- `npx tsc --noEmit` — passed.
- `npm run build` — passed, including Next.js lint and type validation.
- Browser QA — verified `/notifications` preserves its destination while redirecting a signed-out session to `/login?next=%2Fnotifications`.
- Authenticated API activity was observed from the running local app for both the page (`limit=50`) and navbar summary (`limit=1`).

## Remaining work

None for this scope. The activity list continues to show the latest 50 notifications, matching the pre-existing request limit.
