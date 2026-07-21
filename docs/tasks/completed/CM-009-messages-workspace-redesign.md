# CM-009 — Messages workspace redesign

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** messaging, conversations, responsive workspace, marketplace context
- **Likely files:** `src/app/(main)/messages/page.tsx`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Redesigned the messages route as a responsive marketplace conversation workspace with persistent listing context and reliable reply states.

## Acceptance criteria

- [x] Conversation list clearly exposes participant, listing, latest message, and selection state.
- [x] Active conversation exposes participant and listing context without crowding the message thread.
- [x] Message bubbles, timestamps, composer, send state, and errors are accessible and easy to scan.
- [x] Loading, empty, error, missing-selection, invalid-conversation, and signed-out states remain useful.
- [x] Switching conversations updates the `conversationId` URL and responsive mobile navigation works.
- [x] Existing authentication, read marking, 15-second polling, and send behavior remain intact.
- [x] Relevant documentation and verification records are current.

## Dependencies

None.

## Coordination notes

No active or blocked task files overlapped. Existing CM-008 listing redesign changes were preserved.

## Implementation summary

Rebuilt the messages page with a responsive conversation rail, participant and product context, searchable conversations, unread indicators, message and attachment rendering, read status, a multiline reply composer, synchronized URL selection, mobile back navigation, and shaped loading, empty, error, and invalid-conversation states. Draft text now clears only after a successful send, and send failures remain inline with the composer.

## Verification

- `npx tsc --noEmit` — passed.
- `npm run build` — passed.
- Signed-out browser QA at the requested conversation URL — passed; the route preserved the conversation destination in the encoded login redirect.
- Authenticated UI structure was verified against the actual `GET /api/conversations` and `GET/POST /api/conversations/[id]/messages` response contracts.
- Live authenticated visual QA was not claimed because the available test browser had no signed-in local account.
- `npm run lint` — skipped because the repository has no ESLint configuration, as documented in `docs/CODING_STANDARDS.md`.

## Remaining work

None for this redesign. A signed-in buyer or seller session can provide an additional visual-density check with a long real-world thread; no account credentials or test records were created for this UI task.
