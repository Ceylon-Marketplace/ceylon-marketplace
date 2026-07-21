# CM-005 — Auctions page redesign

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** auction discovery UI, auction cards, responsive design, query states
- **Likely files:** `src/app/(main)/auctions/AuctionsClient.tsx`, `src/app/(main)/auctions/page.tsx`, `src/components/auction-card.tsx`, `docs/DESIGN_SYSTEM.md`, `docs/PRODUCT.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Redesigned the auctions index as a clear, energetic marketplace surface that distinguishes live and upcoming lots, foregrounds time and bid activity, and works across screen sizes.

## Acceptance criteria

- [x] Auction cards display images and bid totals from the actual list response shape.
- [x] Live and upcoming lots are easy to scan and filter.
- [x] Countdown rendering avoids server/client time mismatches.
- [x] Loading, error, empty, and pagination states are clear and accessible.
- [x] Existing 15-second polling and auction navigation remain intact.
- [x] Relevant documentation is current.
- [x] Required verification passes.

## Dependencies

None.

## Coordination notes

No active or blocked tasks overlapped. Existing uncommitted CM-002 through CM-004 work was preserved.

## Implementation summary

Introduced a responsive auction discovery layout with market summary metrics, accessible live/upcoming filters, a featured live lot, refreshed auction cards, shaped loading, error and empty states, and pagination. Aligned cards with the actual `_count.bids` and URL-only media response, serialized Prisma prices at the server boundary, and moved countdown calculations after hydration. Existing 15-second polling remains unchanged.

## Verification

- `npx tsc --noEmit` passed.
- `npm run build` passed; the pre-existing Next.js version report remains 15.1.11 while `package.json` specifies 15.1.12.
- ESLint was not run because the repository has no ESLint configuration.
- Desktop browser QA confirmed the populated upcoming state with two real listing images, prices, categories, locations, and zero-bid totals.
- The live filter was exercised and correctly produced the live-empty state with a return action.
- Countdown hydration settled from stable placeholder copy to "Awaiting start" for the two stale scheduled records.
- The initial LCP warnings were addressed by prioritizing only the first visible auction images; the warning log entries retained by the browser were timestamped before the fix.
- Automated mobile screenshot capture timed out while waiting on remote Supabase images. Responsive stacking and overflow behavior were reviewed in the breakpoint-specific implementation, but a completed mobile screenshot was not claimed.

## Remaining work

None for the redesign. Auction status automation is a separate product/backend task and is documented in `docs/PRODUCT.md`.
