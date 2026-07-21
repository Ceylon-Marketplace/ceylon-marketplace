# ARCHITECTURE.md

## Stack

| Layer | Technology | Version (from package.json) |
| --- | --- | --- |
| Framework | Next.js, App Router | 15.1.12 |
| UI | React | 19.0.0 |
| Language | TypeScript, strict mode | 5.7.3 |
| Styling | Tailwind CSS | 3.4.17 |
| ORM / DB | Prisma → PostgreSQL | Prisma 5.22.0 |
| Client state | Zustand (with `persist` middleware) | 5.0.2 |
| Server-state / data fetching (client) | TanStack Query | 5.62.9 |
| HTTP client | axios | 1.7.9 |
| Auth | Custom JWT (access + refresh), `jsonwebtoken` + `bcryptjs` | — |
| Object storage | Supabase Storage | `@supabase/supabase-js` 2.108.2 |
| Validation | Zod | 3.23.8 |

**Always verify version-specific behavior against the actual installed version before relying on training-data assumptions about Next.js/React APIs** — this is a fast-moving framework and the installed version may behave differently than what you remember. E.g. this codebase's route handlers already use the Next 15 convention of `params` as a `Promise` (`{ params }: { params: Promise<{ id: string }> }`) — don't "fix" this back to a synchronous object.

## Request flow

This is a single Next.js application — there is **no separate backend service**, despite `.env.example` defining `API_PORT`/`API_URL`/`CORS_ORIGIN` as if one existed (see `docs/SCOPE.md`).

- **Pages** live under `src/app/` using route groups: `(admin)`, `(auth)`, `(main)`. Several list pages (`listings`, `auctions`) do an initial server-side Prisma fetch in `page.tsx`, then hand off to a client component (`ListingsClient.tsx`, `AuctionsClient.tsx`) for interactive filtering/pagination via TanStack Query. This SSR-then-hydrate pattern was introduced in the `perf: improve load time` commit — follow it for other list-heavy pages rather than inventing a new data-fetching pattern.
- **API routes** live under `src/app/api/**/route.ts` (Next.js Route Handlers), ~38 endpoints. See `docs/API.md`.
- **Client → API calls** go through the shared axios instance in `src/lib/api.ts`, which attaches the JWT from `localStorage` and auto-retries once on a 401 by hitting `/api/auth/refresh`.

## Auth model

Custom JWT, not a third-party auth provider (no NextAuth/Clerk/Auth0/Supabase Auth in use — Supabase is used only for storage, see below).

- `src/lib/auth.ts` is the whole server-side auth surface: `signToken`/`signRefreshToken` (short-lived access token + longer-lived refresh token, durations from `JWT_EXPIRES_IN`/`JWT_REFRESH_EXPIRES_IN` env vars), `requireAuth(req)` (throws 401 `ApiError` if no valid Bearer token), `requireRole(user, ...roles)` (throws 403 if role not in the allowed list).
- There is **no `middleware.ts`** — auth is checked per-route inside each handler by calling `requireAuth`/`requireRole` at the top, not via a global Next.js middleware gate. If you add a new protected route, you must remember to call `requireAuth` yourself; nothing enforces it structurally.
- **Tokens are stored in `localStorage`** on the client (`src/lib/api.ts`, `src/store/auth.store.ts`), not in an httpOnly cookie. This is a known XSS-exposure tradeoff — flag it if you're touching auth and consider whether it's still the intended approach before extending it (this is exactly the kind of thing that should get a `docs/DECISIONS.md` entry if it's ever revisited).
- Client auth state (`src/store/auth.store.ts`) is a Zustand store persisted to `localStorage` under key `ceylon-auth`, but only `user` and `mode` are persisted (`partialize`) — the tokens themselves are read/written directly to `localStorage` by `src/lib/api.ts`, not through the store. Two separate places touch the same `localStorage` keys; be careful keeping them in sync if you change either.
- Roles (`UserRole` enum in schema): `USER`, `SELLER`, `BUSINESS_SELLER`, `SUPER_ADMIN`, `OPERATIONS_MANAGER`, `CONTENT_MODERATOR`, `FINANCE_MANAGER`, `SUPPORT_AGENT`. Admin routes typically call `requireRole` with a specific subset (e.g. listing moderation allows `SUPER_ADMIN`, `OPERATIONS_MANAGER`, `CONTENT_MODERATOR` but not `FINANCE_MANAGER`/`SUPPORT_AGENT`) — check the specific route rather than assuming all admin roles have the same access.

## "Real-time" auctions/messaging — how it actually works

The README describes WebSocket support for auctions and messaging. **There is no WebSocket code anywhere in this repo.** What actually exists:

- Auctions: `AuctionsClient.tsx` polls via TanStack Query with `refetchInterval: 15_000` (15s).
- Bidding correctness (not "real-time-ness") is handled server-side in `src/app/api/auctions/[id]/bid/route.ts`: a preliminary cheap check rejects self-bids, then the actual validation (auction is `LIVE`, not expired, bid ≥ current price + increment) and all writes (bid insert, auction update, anti-snipe extension) happen inside a single `prisma.$transaction` to avoid race conditions between concurrent bidders. This is the pattern to follow for any other flow needing race-safe read-then-write (e.g. offer accept/reject).
- Messaging: the active visible conversation polls every 3 seconds and the conversation inbox polls every 15 seconds. Both stop when the browser tab is hidden or the user has been idle for 2 minutes, then refresh immediately when activity resumes. Sending uses an optimistic client message that is replaced by the persisted API response or retained with a retry state on failure. This is responsive database-backed polling, not WebSocket push.

If real-time push becomes a real requirement, it needs to be designed and recorded in `docs/DECISIONS.md` — don't assume the README's description reflects a plan already in motion.

## Caching

"Caching" in this codebase means HTTP response caching, not an application cache layer:

- `src/app/api/listings/route.ts` sets `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` on the listings list response.
- Redis is provisioned in `docker-compose.yml`/env but **not imported anywhere in `src/`.** Don't assume a Redis client is available — it isn't wired up.

## Image/video storage

Supabase Storage (`src/lib/supabase.ts`, bucket name `"listings"`), accessed via the service-role key server-side only (`supabaseAdmin`). This replaced Vercel Blob Storage (migrated in commits around `feat: migrate image storage from Vercel Blob to Supabase Storage`, #12/#14) — if you see `BLOB_STORE_ID`/`BLOB_READ_WRITE_TOKEN` env vars, those are leftover from the old integration; don't wire new code to them.

## Directory structure

```text
src/
  app/
    (admin)/       Admin pages — role-gated in-page, not via middleware
    (auth)/        Login & registration
    (main)/        Buyer/seller-facing pages
    api/           Route Handlers — ~38 endpoints, see docs/API.md
  components/      Shared UI components (small set — see docs/DESIGN_SYSTEM.md)
  lib/             auth.ts, api.ts, prisma.ts, supabase.ts, utils.ts
  store/           Zustand stores (auth.store.ts)
prisma/
  schema.prisma    Single schema file, see docs/DATABASE.md
```

## Known architectural inconsistencies (flagged, not yet resolved)

- Deployment target ambiguity — see `docs/DEPLOYMENT.md`.
- `.env.example` implies a separate API server (a dedicated port + CORS origin) that doesn't exist in the current architecture.
- README claims WebSocket support that doesn't exist in code (see above).

If you resolve any of these, update this file and add a `docs/DECISIONS.md` entry rather than just fixing the symptom.
