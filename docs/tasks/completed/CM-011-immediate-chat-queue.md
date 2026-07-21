# CM-011 — Immediate chat queue

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** optimistic messaging, concurrent sends, delivery indicators
- **Likely files:** `src/app/(main)/messages/page.tsx`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Guaranteed that every submitted chat message enters the visible conversation immediately and independently of other pending sends.

## Acceptance criteria

- [x] Enter and the send button insert a message bubble synchronously before network cancellation or response work.
- [x] The composer clears immediately after local insertion.
- [x] Multiple messages can be submitted while earlier messages are still sending.
- [x] Every pending bubble independently displays `Sending...` below it.
- [x] Each response updates only its matching temporary bubble, even after switching conversations.
- [x] Failed messages remain independently retryable.
- [x] Types, production build, documentation, and verification pass.

## Dependencies

Builds on CM-010 adaptive polling and optimistic delivery.

## Coordination notes

No active or blocked task files overlapped. Existing message workspace changes were preserved.

## Implementation summary

Moved optimistic cache insertion ahead of query cancellation, removed mutation-wide send blocking, and assigned every temporary message a unique browser-generated ID. Send inputs and mutation contexts now carry their conversation ID and exact cache key, so concurrent responses update the correct bubble even when the user changes conversations. Retry uses the same temporary ID and remains independent of other pending sends.

## Verification

- `npx tsc --noEmit` — passed.
- `npm run build` — passed.
- Static flow inspection confirmed synchronous cache insertion precedes the POST request, the composer clears during insertion, and neither Enter nor the send button checks mutation-wide pending state.
- Mutation success and failure callbacks use the conversation-scoped query key returned by each call's context.
- Live authenticated multi-send QA was not claimed because the available test browser had no signed-in local account.
- `npm run lint` — skipped because the repository has no ESLint configuration, as documented in `docs/CODING_STANDARDS.md`.

## Remaining work

None.
