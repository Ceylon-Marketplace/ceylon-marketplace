# CM-004 — Remove auth console warnings

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** root layout, authentication UI, browser diagnostics
- **Likely files:** `src/app/layout.tsx`, `src/components/auth/auth-shell.tsx`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Prevented extension-added body attributes from producing misleading hydration warnings and stopped preloading the responsive auth image when it is not immediately used.

## Acceptance criteria

- [x] Extension-added attributes on the root body do not produce a hydration warning.
- [x] The auth marketplace image is loaded responsively without an unused preload warning.
- [x] Type and production build verification pass.

## Dependencies

None.

## Coordination notes

No active or blocked task overlap.

## Implementation summary

Added `suppressHydrationWarning` to the root body boundary to tolerate browser-extension attributes such as `cz-shortcut-listen`, and removed `priority` from the responsive auth image so Next.js no longer preloads an image candidate that may be hidden or unused.

## Verification

- `npx tsc --noEmit` passed.
- `npm run build` passed.
- ESLint was not run because the repository has no ESLint configuration.

## Remaining work

None.
