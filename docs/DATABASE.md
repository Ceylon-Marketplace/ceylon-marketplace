# DATABASE.md

PostgreSQL via Prisma ORM. Single schema file: `prisma/schema.prisma`. This doc summarizes the model — treat the schema file itself as the ground truth if the two ever disagree, and fix this doc rather than trusting it blindly.

## Connection

- `DATABASE_URL` — pooled connection string (used at runtime)
- `DIRECT_URL` — direct (non-pooled) connection, used by Prisma for migrations
- Local dev uses `docker-compose.yml` → Postgres 16-alpine on host port **5433** (not the default 5432 — check this if a local connection mysteriously fails)
- `src/lib/prisma.ts` follows the standard Next.js dev-mode singleton pattern (`globalForPrisma`) to avoid exhausting connections under hot-reload

## Core entities

**User** — central identity record. Role (`UserRole` enum) and `verificationLevel` live directly on the user, not in a separate permissions table. Has one `Profile` (1:1, separate table for name/bio/avatar/phone/location), optionally one `Subscription`, optionally one `Storefront`.

**Listing** — the core sellable unit. `listingType` (`FIXED_PRICE` | `AUCTION` | `OFFER`) determines which related flow applies (an `Auction` record only exists for auction-type listings — `Auction.listingId` is `@unique`, i.e. 1:1 optional, not every listing has one). `status` (`ListingStatus`) drives the moderation workflow: `DRAFT → PENDING_REVIEW → ACTIVE / REJECTED`, plus `SOLD`/`ARCHIVED` as terminal-ish states. Category-specific structured data goes through `CategoryAttribute` + `ListingAttributeValue` (an EAV pattern) rather than per-category tables — if you add a new category-specific field, prefer adding a `CategoryAttribute` over adding a schema column, to stay consistent.

**Auction / Bid** — `Auction.currentPrice` is denormalized (updated on every accepted bid, not derived from `Bid` at read time) for fast reads on listing/auction cards. `Bid` rows are the append-only history. See `docs/ARCHITECTURE.md` for the transaction pattern that keeps these consistent under concurrent bidding.

**Conversation / Message** — one `Conversation` per (listing, buyer) pair (`@@unique([listingId, buyerId])`), so a buyer can't accidentally spawn duplicate threads with the same seller about the same listing. `Message.isRead` is a simple boolean, no per-recipient read-receipt table.

**Offer** — buyer proposes a price on a non-auction listing; `status` (`PENDING`/`ACCEPTED`/`REJECTED`/`WITHDRAWN`) tracks lifecycle; `expiresAt` is optional (nullable), so expiry enforcement (if any) needs to be checked at the API layer, not assumed from the schema alone.

**Subscription / SubscriptionPlan** — a plan defines `maxListings`, `durationDays`, `featuredSlots`, `price`. A `Subscription` is 1:1 with `User` (`@unique` on `userId`) — a user can only have one active subscription record at a time, tracked via `status` (`ACTIVE`/`EXPIRED`/`CANCELLED`/`GRACE_PERIOD`) rather than a history table. There's no payment/invoice model — see `docs/SCOPE.md`.

**Moderation/trust & safety cluster** — `Report` (user/listing/auction/message reports), `Dispute` (buyer vs. seller, listing-scoped), `Ticket` (general support), `Block` (user-to-user blocking, composite PK), `AuditLog` (admin action trail — `adminId`, `action` string, `targetType`/`targetId`, freeform `details` JSON). These all reference `User` for reporter/resolver/assignee, but there's no dedicated "admin" table — any user with an admin-tier role can be referenced.

**Review** — one review per (reviewer, listing) pair (`@@unique([reviewerId, listingId])`), tied to a specific listing rather than a general seller review — a buyer reviews a specific transaction, not "the seller" in the abstract.

## Indexes (added in the `perf: improve load time` commit, #13)

These reflect actual query patterns identified in that work — if you add a new filtered/sorted query against `Listing`, `Auction`, `Conversation`, or `Message`, check whether it's covered by an existing index before assuming a full scan is fine:

- `Listing`: `(status, isFeatured, createdAt desc)`, `(status, categoryId)`, `(status, price)`, `(sellerId)`
- `ListingMedia`: `(listingId)`
- `Auction`: `(status, endTime)`
- `Conversation`: `(buyerId)`, `(sellerId)` — plus the unique `(listingId, buyerId)`
- `Message`: `(conversationId, createdAt)`
- `Notification`: `(userId, isRead)`, `(userId, createdAt desc)`; the latter supports the newest-first notification popup query

## Migrations

`prisma/migrations/` holds the migration history; run via `npm run db:migrate` (dev) or `npm run db:push` (schema sync without a migration file — avoid this outside of local prototyping since it doesn't produce a reviewable migration). `npm run db:generate` regenerates the Prisma client and must run before `next build` (it's chained into the `build` script already, see `package.json`).

## TBD — needs input from Manoj/Naveen

- Whether `db:push` has been used against any shared/staging database (it can drift schema out of sync with migration history if so)
- Retention/soft-delete policy — nothing in the schema does soft deletes; deletions appear to be hard deletes via `onDelete: Cascade` in several relations. Confirm this is intentional before adding a "trash"/undo feature.
