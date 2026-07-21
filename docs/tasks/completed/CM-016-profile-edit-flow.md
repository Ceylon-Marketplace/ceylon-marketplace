# CM-016 - Profile edit flow

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** profile editing, public profile privacy, identity preview, protected flow
- **Likely files:** `src/app/(main)/profile/edit/page.tsx`, `src/app/api/users/[id]/route.ts`, `docs/API.md`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Make profile editing a visual and behavioral continuation of the revamped public profile, with a live identity preview, clear field privacy, reliable save feedback, and return to the updated profile.

## Acceptance criteria

- [x] Edit page hierarchy and styling match the public profile and global marketplace system.
- [x] Avatar, name, role, location, and bio update a clear live preview.
- [x] Public and private field expectations are communicated accurately.
- [x] Save preserves the existing update request and returns to the updated public profile after refresh.
- [x] Cancel and back actions return to the current user's public profile explicitly.
- [x] Loading, signed-out, invalid-avatar, dirty, saving, and error states remain useful.
- [x] Public profile API no longer returns the stored phone field.
- [x] Documentation and verification records are current.

## Dependencies

Builds on CM-015 public profile revamp.

## Coordination notes

No active or blocked task files overlap. Existing CM-015 work is user-owned and will be preserved.

## Implementation summary

Rebuilt profile editing as a responsive identity workspace with grouped public and private fields, an accurate live profile preview, invalid-avatar feedback, dirty-state actions, shaped loading, destination-preserving authentication, and explicit return to the refreshed public profile after save. Restricted public profile serialization to safe profile fields so stored phone data is no longer returned publicly.

## Verification

- `npx tsc --noEmit` - passed.
- `npm run build` - passed, including Next.js type validation.
- `git diff --check` - passed.
- Protected-route browser QA - verified `/profile/edit` redirects to `/login?next=%2Fprofile%2Fedit` for a signed-out session.
- Running app QA - the authenticated local session loaded `/profile/edit`, public profile requests, and notification summary requests successfully during implementation.
- Public response review - `GET /api/users/[id]` now uses an explicit profile field selection that excludes phone.
- Automated tests - not available in this repository.
- ESLint - no ESLint configuration exists, so a standalone lint run is unavailable; the production build completed its configured validation.

## Remaining work

None.
