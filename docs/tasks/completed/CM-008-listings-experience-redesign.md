# CM-008 — Listings experience redesign

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** listings discovery, listing detail, buyer actions, responsive commerce UI
- **Likely files:** `src/app/(main)/listings/ListingsClient.tsx`, `src/app/(main)/listings/[id]/page.tsx`, `src/components/listing-card.tsx`, `docs/DESIGN_SYSTEM.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Redesigned listing discovery and listing detail as one coherent marketplace journey aligned with the homepage and auction surfaces.

## Acceptance criteria

- [x] Listings discovery provides clear search, filtering, sorting, result count, pagination, and responsive product scanning.
- [x] Listing cards prioritize imagery, title, price, condition, location, and time without decorative overlays or emoji.
- [x] Listing detail prioritizes product media, price, factual metadata, seller context, and the appropriate contact, offer, auction, save, or edit action.
- [x] Loading, error, empty, sold, signed-out, seller-owned, offer, save, and missing-media states remain useful.
- [x] Contact seller uses the repository's actual `POST /api/conversations` contract.
- [x] Existing API-backed behavior is preserved and documentation is current.
- [x] Required verification passes.

## Dependencies

None.

## Coordination notes

No active or blocked task files overlapped. Existing CM-006 and CM-007 changes were preserved.

## Implementation summary

Rebuilt the listings client with typed data, deferred search input, category shortcuts, responsive filter controls, active chips, result feedback, shaped loading and recovery states, and simpler pagination. Replaced the shared listing card with a quieter product-led card. Rebuilt listing detail with a gallery, sticky action panel, state-aware contact, offer, auction, save and edit actions, inline mutation feedback, seller/store context, description, specifications, and complete loading and unavailable states.

The contact action now uses the actual `POST /api/conversations` body contract. Unreachable review UI was removed because non-active listings are hidden from non-owners by the current listing detail API.

## Verification

- `npx tsc --noEmit` — passed.
- `npm run build` — passed.
- Populated desktop browser QA at `/listings` and `/listings/cmrukqwkw000184sxxxwa9n77` — passed.
- Listings filter panel interaction — passed; detailed category, condition, type, price, and location controls became available.
- Browser semantic snapshots confirmed the discovery heading, search/sort controls, result card, detail breadcrumb, item information, buyer actions, seller context, and status labels.
- `npm run lint` — skipped because the repository has no ESLint configuration, as documented in `docs/CODING_STANDARDS.md`.

## Remaining work

None for this redesign. The local seed listing uses a screenshot-style image; the data-driven layout will improve automatically with cleaner product photography.
