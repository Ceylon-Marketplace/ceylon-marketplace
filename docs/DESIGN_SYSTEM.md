# DESIGN_SYSTEM.md

There's no formal design system doc or Figma reference in the repo — this describes the conventions actually followed in `src/components/` and `globals.css`. It's a small, lightly-componentized codebase (4 shared components); most UI is built inline per-page rather than through a shared library.

## Styling approach

Tailwind CSS utility classes, composed via the `cn()` helper (`src/lib/utils.ts`, `clsx` + `tailwind-merge`) so conditional/overriding classes merge correctly instead of colliding. Use `cn(...)` for any component that takes conditional class logic — don't string-concatenate class names.

## Color

One custom color scale, defined in `tailwind.config.ts`:

```text
brand: { 50, 100, 500, 600, 700 }   // #e84c3d family — red/coral
```

Everything else uses Tailwind's default gray scale (`gray-50`…`gray-900`) for text/borders/backgrounds. There is no dark mode implementation — no `dark:` variants found anywhere in the codebase. If dark mode is ever requested, it needs to be designed from scratch, not just switched on.

## Component classes (`globals.css`, `@layer components`)

Four reusable utility classes are defined and should be reached for before writing new one-off styles:

- `.btn-primary` — brand-colored filled button
- `.btn-secondary` — outlined/white button
- `.card` — `rounded-xl border border-gray-200 bg-white shadow-sm`
- `.input` — standard form input styling
- `.badge` — small pill label (combine with a color utility, e.g. `badge bg-brand-500 text-white`, as seen in `listing-card.tsx`)

## Shared components (`src/components/`)

Only four exist — everything else is built inline in page files:

- `listing-card.tsx` — the canonical example of composing `.card`, `.badge`, `cn()`, and the `brand` color scale together; use it as the reference pattern for new cards
- `auction-card.tsx`
- `image-uploader.tsx`
- `navbar.tsx` — client component (`"use client"`), reads auth state from `useAuthStore`, uses `lucide-react` icons

**Most pages do not extract components** — forms and page-specific UI (e.g. `listings/create/page.tsx`, `listings/[id]/edit/page.tsx`) are written directly in the page file rather than broken into subcomponents. This is the existing pattern; don't unilaterally start extracting shared components out of pages as a "cleanup" unless the task specifically calls for it — that's the kind of pattern change that belongs in `docs/DECISIONS.md` if it's actually being adopted going forward.

## Authentication screens

The login and registration routes use `src/components/auth/auth-shell.tsx` for a shared, responsive split layout. The form remains the primary surface; a generated marketplace product photograph supports the retail context on large screens and is hidden below the `lg` breakpoint. Auth screens use Manrope through `next/font` and the `font-auth` Tailwind family, retain the coral `brand` scale as their single interaction accent, and use a consistent rounded system: 12px controls, 16px selection cards, and a 24px media panel.

The registration page keeps buyer and seller selection as native radio inputs with visible label cards. Account fields use persistent labels, browser autofill attributes, inline error feedback, and a role-aware submit label. Avoid adding product promises to authentication screens unless the underlying capability is verified in `docs/PRODUCT.md`.

## Marketplace dashboard

The authenticated `/dashboard` is a role-aware marketplace home rather than an administrative analytics screen. Buyer and seller modes share the same visual grammar: a left-aligned welcome header, one coral primary action, a bordered metric strip, activity and quick-action panels, and contextual listing sections. Keep dashboard accents within the coral `brand` scale and neutral grays; unread dots are semantic state indicators, not decoration.

Dashboard data surfaces must include shaped skeletons while queries load, a useful empty state with one next action, and a populated state. Selection and navigation panels use 16px corners, while existing listing cards retain their canonical 12px radius. Buyer offer totals come from `GET /api/offers`; there is no `/api/offers/sent` route.

## Auctions index

The `/auctions` index uses a commerce-first discovery layout: a compact page header, live/upcoming summary strip, accessible status tabs, an optional featured live lot, and a responsive card grid. Coral is the only page accent; scheduled state uses neutral grays. Auction cards keep status labels out of the image, expose category, location, price, bid count, and countdown in the content area, and use a 16px corner radius.

List responses expose bid totals as `_count.bids` and media as URL-only objects. The server page serializes Prisma price decimals before passing them to the client. Countdown text initializes with stable server-safe copy and starts time calculations only after hydration. A scheduled lot whose start time has already passed displays "Awaiting start" because auction lifecycle automation does not currently exist; see `docs/PRODUCT.md`.

## Public homepage

The public `/` route is a dynamic, discovery-first marketplace entry point rather than a generic marketing landing page. Its hero pairs concise buyer/seller actions with listing imagery already present in the marketplace, followed by active categories, recent active listings, and currently live or scheduled auctions. If the database has no suitable listing imagery, the hero falls back to the local marketplace collection image used by the authentication screens. Keep the route dynamically rendered so inventory changes do not depend on a redeploy.

Homepage content must remain data-backed and honest: avoid inventory counts, trust promises, fee claims, or availability language that the application cannot verify. Empty listing and auction states should preserve the section structure and offer a single relevant next action. Prisma decimals and dates are serialized in the server page before auction data reaches client components.

The visual direction uses white and neutral surfaces with coral as the only interaction accent, large editorial type in the hero, 16–24px corner radii, and an asymmetric image composition on large screens that collapses into a stacked mobile layout. Product photography carries the visual interest; do not add decorative emoji, gradients, or overlay badges to the homepage.

## Icons

`lucide-react` throughout — no other icon set is used. Reach for an existing Lucide icon before adding a new icon dependency.

## Formatting helpers

`src/lib/utils.ts` centralizes locale-aware formatting — use these rather than reimplementing:

- `formatPrice()` — `Intl.NumberFormat("en-LK", { currency: "LKR" })` (see `docs/PROJECT.md` re: Sri Lanka/LKR)
- `timeAgo()`, `formatDate()`, `formatDateTime()`, `timeUntil()` — all via `date-fns`

## UI component libraries installed but unused

`@radix-ui/*` (avatar, dialog, dropdown-menu, select, separator, tabs, toast), `class-variance-authority`, `react-hook-form`, `@hookform/resolvers` are all in `package.json` but nothing in `src/` imports them (confirmed in `CLEANUP_REPORT.md` and by grep). Forms in this codebase are hand-rolled with `useState`, not `react-hook-form`. **Don't assume any Radix component or CVA-based variant system is wired up** — if you want to use one, you're introducing it fresh, which is worth a quick check with the team (are these leftover from an abandoned direction, or genuinely reserved for upcoming work?) before you build on top of them.
