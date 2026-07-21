# CM-010 — Adaptive chat delivery

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** messaging delivery, polling efficiency, optimistic UI, retry behavior
- **Likely files:** `src/app/(main)/messages/page.tsx`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Improved the current database-backed chat with activity-aware polling and immediate optimistic message delivery.

## Acceptance criteria

- [x] Active visible conversations refresh approximately every three seconds.
- [x] Inbox refresh remains less frequent and all chat polling pauses while the tab is hidden or the user is idle.
- [x] Returning to the tab or interacting again triggers a fresh request.
- [x] A submitted message appears immediately with a visible sending state.
- [x] Successful delivery replaces the temporary message with the server record and retains the existing read-state flow.
- [x] Failed delivery remains visible with a retry action and does not silently lose the message.
- [x] Existing authentication, database persistence, message ordering, and URL behavior remain intact.
- [x] Documentation and verification records are current.

## Dependencies

None.

## Coordination notes

No active or blocked task files overlapped. Existing CM-009 message workspace changes were preserved.

## Implementation summary

Added a two-minute client activity window driven by visibility, focus, keyboard, and pointer events. Active message threads now poll every three seconds, the inbox every 15 seconds, and both pause while hidden or idle. Resumed activity invalidates the relevant queries immediately.

Message submission now inserts a temporary local bubble before the request starts. Successful responses replace that bubble with the persisted message; failures leave it visible with an explicit retry control. Sent and read labels continue to follow server state after delivery.

## Verification

- `npx tsc --noEmit` — passed.
- `npm run build` — passed.
- Signed-out route protection remains verified from CM-009.
- Optimistic lifecycle and adaptive polling were verified structurally against TanStack Query mutation/query behavior and the existing message API contract.
- Live authenticated failure-state QA was not claimed because the available test browser had no signed-in local account and no production request was intentionally forced to fail.
- `npm run lint` — skipped because the repository has no ESLint configuration, as documented in `docs/CODING_STANDARDS.md`.

## Remaining work

None. WebSocket or managed Realtime delivery remains an optional future architectural change rather than a requirement for this improvement.
