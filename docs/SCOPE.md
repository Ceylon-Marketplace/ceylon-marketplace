# SCOPE.md

No formal scope document exists yet — this is inferred from what's built vs. what's provisioned-but-unused. Treat this as a starting point to correct, not a settled spec.

## In scope (built and working)

- Fixed-price listings, auctions, and offer-based listings
- Listing moderation (pending review → approve/reject)
- Category tree with per-category custom attributes
- Subscription plans gating listing count
- Messaging between buyer and seller per listing, with blocking
- Bidding with anti-sniping extension
- Reviews, reports, disputes, support tickets (data model + basic CRUD)
- Seller storefronts (public page by slug)
- Admin roles with role-gated endpoints
- Image/video upload via Supabase Storage

## Provisioned but not currently in use — don't assume these work

- **Redis.** Present in `docker-compose.yml` and `.env.example` (`REDIS_URL`), but nothing in `src/` imports a Redis client. "Caching" in the codebase (e.g. `perf: improve load time` commit) means HTTP `Cache-Control` headers, not a Redis-backed cache. If you're about to build a feature that assumes a shared cache or session store, it doesn't exist yet.
- **A separate API server.** `.env.example` defines `API_PORT`, `API_URL`, `CORS_ORIGIN` implying a standalone backend on port 3001, but all API logic lives in Next.js Route Handlers under `src/app/api/`, served from the same Next.js process as the frontend. Treat those env vars as legacy/aspirational unless someone confirms otherwise.
- **WebSockets.** See `docs/PRODUCT.md` — README claims it, code doesn't have it.

## Explicitly out of scope (nothing in code suggests otherwise)

- Payment processing / checkout
- Multi-currency support (price is a plain `Decimal`, no currency field)
- Internationalization (no i18n library or locale routing found)
- Automated testing infrastructure (see `docs/TESTING.md`)
- Mobile apps (this is a Next.js web app only)

## TBD — needs input from Manoj/Naveen

- Whether Redis and the separate-API-server env vars represent near-term roadmap items or dead config that should be removed
- Payment provider choice, if/when subscriptions need to actually charge someone
