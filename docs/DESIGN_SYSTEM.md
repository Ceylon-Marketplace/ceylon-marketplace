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

## Global navigation

The shared top navigation is a 72px sticky white header with a subtle border and backdrop blur. Desktop keeps the Ceylon mark, Listings and Auctions, contextual seller action, messaging, offers, notifications, and account control on one line. Current routes use a neutral filled state for primary links and coral for utility destinations; unread counts use the same coral accent.

Below the `md` breakpoint, primary and account navigation moves into an explicit menu while notifications remain directly accessible for signed-in users. The mobile menu must include Listings and Auctions for every visitor, then add role-aware destinations without crowding the top row. Menu and account controls expose expanded state, support Escape, close after route changes, and use 12px controls with 16px menu containers.

The account menu groups marketplace destinations, seller mode, account settings, and sign-out rather than presenting one undifferentiated list. Buyer and seller mode share neutral surfaces, with coral reserved for the active sell state and selling CTA. Do not reintroduce blue and green mode palettes. Existing route labels, admin access, buyer upgrade, notification polling, and role conditions remain stable.

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

## Auction detail

The `/auctions/[id]` route is a responsive bidding workspace. On large screens it pairs a restrained product gallery with a sticky 400px bidding column; on smaller screens the content stacks without changing the decision hierarchy. The first viewport should expose the item, auction status, current or starting price, countdown state, increment, and available bid action. Coral is reserved for live state and primary bidding feedback; scheduled, ended, and cancelled states remain neutral.

The bidding form must communicate the calculated minimum, preserve signed-out redirection, disable submission while auth hydration or mutation is pending, and show contextual success or error feedback. Live auctions continue polling every three seconds. Scheduled records whose start time is already past display "Awaiting start" rather than a misleading ended countdown until lifecycle automation updates the database.

Below the primary decision area, show factual item details, masked recent bid activity, seller identity, schedule, and only rules enforced by the current API: minimum increment, no seller self-bidding, and the two-minute anti-snipe extension. Use Lucide fallbacks for missing media rather than emoji. Loading and unavailable states should retain the page's final shape and provide a clear recovery route.

## Listings discovery and detail

The `/listings` route is a product-scanning surface with an editorial page heading, horizontally scrollable top-level category shortcuts, one prominent search field, collapsible detailed filters, sorting, active filter chips, result feedback, and simple previous/next pagination. Listing cards use 16px corners and keep metadata out of the image: category and condition lead the content, followed by title, price, listing type, location, and relative time. Do not use emoji, colored photo overlays, featured rings, or view/save counters on discovery cards.

The `/listings/[id]` route shares the auction detail composition: a restrained product gallery and item information on the left, with a sticky 400px decision column on large screens. Price, condition, availability, and the correct buyer action belong in the first viewport. The action adapts to fixed-price, offer, auction, unavailable, signed-out, and seller-owned states. Seller identity and storefront context remain separate from the primary price panel.

Active listing detail content is server-provided as initial TanStack Query data and reused for 30 seconds through bounded route revalidation. The client query still reconciles authenticated `isSaved` state and preserves API-only owner access to non-active listings, but public visitors must not wait for that follow-up request before seeing the product.

Missing media uses a Lucide fallback. Loading states mirror the final two-column shape, and unavailable states include retry and browse actions. Contact seller must call `POST /api/conversations` with `{ listingId }`; there is no `/api/conversations/listing/[id]` route. Offer, save, and contact mutations use inline status feedback rather than browser alerts. Only active listings are public, so completed-transaction review UI does not belong on this route under the current API contract.

The authenticated `/listings/saved` route is a personal buyer collection. It leads with the collection purpose and item count, then reuses the canonical `ListingCard` in a responsive one-, two-, or three-column scanning grid. The remove action belongs below every card so it remains visible to touch, keyboard, and desktop users; do not hide it in a hover-only image overlay.

Removal is optimistic. The item leaves the collection immediately, then returns with inline feedback if the request fails. Loading, empty, query error, mutation error, signed-out, and populated states must remain useful, and signed-out redirects preserve `/listings/saved`. `GET /api/listings/saved` should return the listing media and category needed by the card without loading unused seller profile data.

## Create listing workspace

The authenticated seller `/listings/create` route is a publishing workspace rather than a single generic form card. Desktop pairs a linear form with a sticky 320px readiness and action panel; mobile collapses to one column. The form is grouped by seller decisions: item identity, selling format and price, photos, category-specific details, then auction configuration when applicable. Sections use spacing and single dividers instead of stacking equal elevated cards.

Selling formats are explicit radio cards using the existing fixed-price, offer, and auction values. Fixed-price and offer listings expose the listing price directly. Auction listings expose one opening-bid control, which also supplies the listing price required by the existing API payload, avoiding duplicate pricing inputs. Auction reserve, increment, and schedule remain unchanged.

The readiness panel communicates five essential states and keeps draft and review submission available on desktop. It is guidance rather than a new validation contract; the existing submit handler and API remain authoritative. Coral is the only accent, 12px controls pair with 16px sections and panels, and photos use the shared image uploader with larger targets and persistent mobile remove controls. Hydration uses a shaped skeleton, signed-out redirects preserve `/listings/create`, and seller-role, buyer-mode, error, success, draft, upload, and submission states remain explicit.

## Public profile

The `/profile/[id]` route is a public marketplace identity surface. It leads with the member's real avatar or initials, role, verification level, location when available, membership date, bio, and implemented actions. A bordered metric strip summarizes active listings, received reviews, and the all-review average. Coral is reserved for verification, rating, and marketplace actions; other profile information stays neutral.

Below the identity header, active listings and transaction-linked reviews share a main column while a compact sticky profile-facts panel provides context on desktop. Both content sections remain visible when empty so visitors can distinguish zero activity from missing UI. Listings use the canonical `ListingCard`; reviews use two-column 16px cards with factual reviewer, time, rating, comment, and linked-listing data.

Direct messaging is listing-scoped in the current API, so public profiles must not link to `/messages?userId=...`. Visitors contact a member through an active listing, while storefront owners receive a storefront action and profile owners receive Edit profile. Loading, unavailable, partial-query error, empty, own-profile, storefront, desktop, and mobile states must remain useful. `GET /api/reviews/[userId]` supplies `avgRating` across all received reviews rather than only the current page.

The authenticated `/profile/edit` route is the private continuation of that identity surface. It uses the same page heading, 16px section rhythm, identity language, and coral accent, with form groups for public identity, public about details, and private contact information. Desktop pairs the form with a sticky 320px live preview; mobile stacks the preview and actions after the fields.

The preview reflects avatar URL, initials fallback, name, role, verification, location, and bio as the user types. Invalid avatar URLs produce inline feedback and block saving. Save is disabled until a field changes, refreshes the auth store after the existing profile PATCH, and returns to `/profile/[currentUserId]`; Back and Cancel use that same explicit route rather than browser history. Signed-out redirects preserve `/profile/edit`.

Phone is a private profile field. It may be edited through `PATCH /api/users/me/profile`, but `GET /api/users/[id]` must select only first name, last name, avatar, bio, and location from `Profile`. Do not expose phone or email through public-profile responses or copy.

## Messages workspace

The authenticated `/messages` route is a dense marketplace workspace rather than a generic chat panel. Desktop uses a 340px conversation rail beside the active thread; mobile shows either the rail or the selected thread with an explicit back action. The workspace fills the available viewport below the main navigation and uses 16px outer corners, 12px product thumbnails and controls, and coral only for unread state, the sender's message bubbles, and the send action.

Conversation rows expose the other participant, listing thumbnail and title, latest message, relative time, and unread state. Selecting a row keeps `conversationId` synchronized in the URL. The active thread header identifies the participant, and a separate compact listing strip links back to the product and shows its current price and status.

While the tab is visible and the user remains active, the selected message thread polls every 3 seconds and the conversation list every 15 seconds. Both pause when the tab is hidden or after 2 minutes without interaction, then refresh when activity resumes. Own messages use coral bubbles and incoming messages use bordered white bubbles; both keep readable timestamps, and read state appears only when the API reports it.

Sending is optimistic: Enter or the send button synchronously inserts a new bubble and clears the composer before cancellation or network work begins. Every temporary bubble has its own conversation-scoped ID and displays `Sending...`; successful responses replace only their matching bubble, while failures remain visible as `Not sent` with an independent retry action. Do not block the composer while another message is pending, because users can queue multiple sends. The composer uses a bounded textarea, Enter to send, Shift+Enter for a new line, a disabled empty state, and inline send errors. Conversation-list, thread, empty, invalid-selection, error, and authentication-loading states must all retain useful structure.

## Notifications feed

Notifications open from the authenticated top-navigation bell as a compact social-style popover instead of navigating away from the current task. Desktop anchors a 410px panel below the bell; mobile uses the available viewport width below the 72px navigation. The panel has a short header, unread total, optimistic mark-all action, and a bounded scrolling feed. Circular neutral marketplace identities carry smaller event-type badges, while bold activity-led copy, relative time, event label, and a familiar unread dot create the row hierarchy. Coral is the only accent and identifies unread status and active controls; event types do not introduce separate palettes.

Repeated activity is grouped by stable metadata identity across the latest 50 notifications. Conversations group by `conversationId`, auctions by `auctionId`, product activity by `listingId`, and remaining offer activity by `offerId`; records without one of these identifiers remain independent. Each group shows its newest notification plus `+N more`, where N is the number of other records in that group. A group remains visually unread while any member is unread.

Rows remain touch-friendly and provide a useful destination whenever metadata permits it: messages open their conversation, auction events open the auction, listing events open the listing, and offer events open the offers workspace. Selecting a row marks it read, closes the popover, and opens its destination when one exists. The panel closes on outside click, Escape, route change, account-menu activation, or mobile-menu activation. Loading skeletons mirror the circular-row composition, while unavailable and no-activity states provide clear feedback or recovery.

Read actions are optimistic so the popover responds immediately. Opening a group atomically marks every unread member through the notification API's `{ ids }` payload; failed individual or bulk updates restore the previous cache. Notification queries share the `['notifications']` React Query prefix: the popover uses a `popover` subkey and invalidates the prefix after mutations so other notification consumers reconcile with the API.

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
