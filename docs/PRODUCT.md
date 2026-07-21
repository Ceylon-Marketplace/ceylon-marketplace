# PRODUCT.md

This describes what the product does today, inferred from the codebase (routes, schema, business logic). No product brief or spec exists in the repo, so vision/positioning beyond this is TBD.

## Core user flows

### Buyer

- Browse/search listings (`/listings`), filter by category/attributes
- View a listing detail page, save it, message the seller, make an offer, or bid if it's an auction
- View auctions in a dedicated auctions feed (`/auctions`), place bids, get outbid notifications
- Manage saved listings, sent offers, conversations, notifications
- Leave a review for a seller after a transaction

### Seller

- Apply to become a seller (`become-seller` flow) — role upgrades from `USER` to `SELLER`/`BUSINESS_SELLER`
- Create/edit listings with images/videos, category-specific attributes, condition, price or auction/offer terms
- Manage own listings (`listings/mine`), respond to offers (accept/reject/withdraw), manage a storefront (public seller page at `/store/[slug]`)
- Subject to a subscription plan that caps how many active listings they can run

**Buyer/seller mode toggle** — a user can operate in "buyer mode" or "seller mode" (`useAuthStore.mode`); this is a UI-state toggle, not a separate account.

### Admin

Role-gated: `SUPER_ADMIN`, `OPERATIONS_MANAGER`, `CONTENT_MODERATOR`, `FINANCE_MANAGER`, `SUPPORT_AGENT`.

- Review and approve/reject pending listings, with a rejection reason
- Manage users (view, presumably suspend — see `docs/API.md` for what's actually implemented)
- View platform stats, audit logs
- Resolve reports (against users/listings/auctions/messages) and disputes (buyer vs. seller)
- Handle support tickets

## Business rules actually enforced in code

These are pulled from route handlers, not from aspiration — see `docs/API.md` for the endpoints that enforce them.

- **Auctions:** a seller cannot bid on their own auction; a bid must exceed current price + increment; bids inside the last 2 minutes extend the auction by 2 minutes (anti-sniping); all bid validation + writes happen inside one DB transaction to prevent race conditions.
- **Listings:** moderation workflow is `PENDING_REVIEW → ACTIVE` or `→ REJECTED` (schema also defines `DRAFT`, `SOLD`, `ARCHIVED` as listing states).
- **Messaging:** blocking a user is modeled explicitly (`Block` table); message history itself has no explicit "immutable" enforcement found in code beyond there being no edit/delete endpoint — treat the README's "immutable" claim as directionally true (no update path exists) rather than a verified invariant (e.g. no DB-level constraint prevents it).

## What's NOT implemented despite being implied elsewhere

- **Real-time delivery.** The README describes "WebSocket support" for auctions and messaging. There is no WebSocket server or client anywhere in the codebase. Auctions poll via TanStack Query (`refetchInterval: 15_000` in `AuctionsClient.tsx`). Messaging has no polling or push mechanism found. Treat "real-time" as "REST + short polling," not a live socket — and flag this doc/code mismatch to the team if you're about to build on top of an assumed WebSocket layer.
- **Payments.** Subscriptions have a plan/price/duration model in the schema, but no payment provider integration (Stripe, PayPal, etc.) was found. How a subscription actually gets paid for is TBD — needs input from Manoj/Naveen.

## TBD — needs product input

- Whether Sri Lanka/LKR (see `docs/PROJECT.md` — hardcoded in `formatPrice`) is a firm requirement worth enforcing elsewhere (e.g. phone number formats, location autocomplete) or just an assumption baked in once and never revisited
- Monetization beyond the subscription schema shape (take rate on sales? auction fees? currently none found in code)
- Whether "real-time" auctions/messaging via WebSockets is still a planned feature or was abandoned in favor of polling
- How auction lifecycle transitions are intended to run. Records can remain `SCHEDULED` after `startTime` has passed; no background scheduler or request-time status transition was found. The auctions UI labels these records as "Awaiting start" instead of incorrectly claiming they are live.
