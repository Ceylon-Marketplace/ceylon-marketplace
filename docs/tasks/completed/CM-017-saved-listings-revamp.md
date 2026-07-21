# CM-017 - Saved listings revamp

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** saved listings, buyer collection, optimistic remove, protected flow
- **Likely files:** `src/app/(main)/listings/saved/page.tsx`, `src/app/api/listings/saved/route.ts`, `docs/API.md`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Revamp Saved listings as a responsive personal marketplace collection with accessible removal and reliable protected, loading, empty, error, and mutation states.

## Acceptance criteria

- [x] Page hierarchy communicates the collection purpose and current count.
- [x] Saved products use the canonical marketplace card and responsive scanning grid.
- [x] Remove actions are visible and usable on touch, keyboard, and desktop devices.
- [x] Removal updates optimistically and restores the item with feedback on failure.
- [x] Loading, empty, query error, mutation error, signed-out, and populated states remain useful.
- [x] Signed-out redirection preserves `/listings/saved`.
- [x] Saved-listing responses do not include unused seller profile data.
- [x] Documentation and verification records are current.

## Dependencies

None.

## Coordination notes

No active or blocked task files overlap. Existing CM-016 profile work is user-owned and will be preserved.

## Implementation summary

Rebuilt the page as a marketplace collection with a clear purpose, saved count, canonical product cards, persistent accessible removal controls, and useful loading, empty, query-error, mutation-error, and signed-out states. Removal now updates the React Query cache immediately and restores the item with feedback if the API request fails. The saved-listings query no longer loads unused seller profile data.

## Verification

- `npx tsc --noEmit` - passed
- `git diff --check` - passed
- Protected-route browser QA - passed; signed-out navigation resolved to `/login?next=%2Flistings%2Fsaved`
- `npm run build` - passed

## Remaining work

None.
