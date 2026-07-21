# CM-013 - Create listing redesign

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** seller listing creation, image upload, form UX
- **Likely files:** `src/app/(main)/listings/create/page.tsx`, `src/components/image-uploader.tsx`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Redesign listing creation as a clear, responsive seller publishing workspace while preserving the existing listing, draft, image upload, category attribute, and auction API contracts.

## Acceptance criteria

- [x] The form has a clear hierarchy for item details, selling format, photos, category details, and auction configuration.
- [x] Selling format choices explain their effect and reveal only relevant controls.
- [x] A desktop summary keeps completion state and publishing actions visible without obstructing mobile use.
- [x] Draft and submit actions retain existing behavior and communicate pending and error states.
- [x] Seller-mode, buyer-role, success, upload, and protected-route states remain useful.
- [x] Visible copy avoids ambiguous duplicated auction pricing language.
- [x] Existing API request shapes remain unchanged.
- [x] Documentation and verification records are current.

## Dependencies

None.

## Coordination notes

No active or blocked task files overlap. Existing uncommitted redesign work is user-owned and will be preserved.

## Implementation summary

Recomposed listing creation into a responsive seller publishing workspace with decision-led sections, selling-format radio cards, a single auction opening-bid control, improved photo targets, a sticky readiness and publishing panel, shaped hydration feedback, and a restrained success state. Draft, review, category attribute, image upload, listing, and auction request contracts are preserved.

## Verification

- `npx tsc --noEmit` - passed.
- `npm run build` - passed, including Next.js type validation.
- `git diff --check` - passed.
- Browser QA - verified signed-out redirection preserves `/listings/create` through `/login?next=%2Flistings%2Fcreate`.
- Running app QA - authenticated `/listings/create`, category loading, and navbar summary requests returned successfully in the active local session.
- Automated tests - not available in this repository.
- ESLint - no ESLint configuration exists, so a standalone lint run is not available; the production build completed its configured validation.

## Remaining work

None.
