# PROJECT.md

## What this is

Ceylon Marketplace is a subscription-driven online marketplace with listings, offers, and real-time-feeling auctions. Sellers list items (fixed price, auction, or offer-based), buyers browse/search/save/message/bid, and a subscription plan gates how many listings a seller can run. There's an admin/moderation layer (listing approval, user management, disputes, reports, support tickets) with several distinct admin roles.

## Who it's for

Buyers and sellers in a Sri Lanka-focused classifieds/marketplace model — `src/lib/utils.ts` hardcodes price formatting to `Intl.NumberFormat("en-LK", { currency: "LKR" })`, confirming the market even though the DB schema itself stores `price` as a currency-less `Decimal` (no `currency` column) and there's no geo-restriction enforced in any route. TBD — needs input from Manoj/Naveen: is LKR/Sri Lanka a hard requirement (worth enforcing/documenting formally) or just the default assumption baked in by whoever wrote `formatPrice`?

## Current stage

**Prototype / pre-launch.** Evidence for this:

- No CI pipeline currently exists (`.github/workflows` is empty/absent on `master`; a Vercel Actions workflow was added and later removed — see `docs/DEPLOYMENT.md`).
- No automated test suite (see `docs/TESTING.md`).
- No ESLint config file despite `eslint` being installed (see `docs/CODING_STANDARDS.md`).
- The deployment target has changed repeatedly in git history (Vercel → Cloudflare Workers → reverted → Netlify) and the repo currently has tracked config for more than one target with no documented record of which is actually serving production traffic.
- Recent work (perf commit, Supabase Storage migration) reads as pre-launch hardening rather than incident response, suggesting there isn't yet a live user base generating production data.

TBD — needs input from Manoj/Naveen: confirm whether this is live anywhere for real users, or still pre-launch.

## The team

Two developers, everything shared — **no fixed ownership split** between backend/infra and frontend. Either developer works anywhere in the codebase. This means:

- Don't assume a change to `src/app/api/**` or `prisma/schema.prisma` is "someone else's area" — check `docs/AGENT_HANDOFF.md`'s in-progress section (see `AGENTS.md`) instead of assuming based on file location.
- Because there's no ownership split to fall back on, `docs/AGENT_HANDOFF.md` and `docs/DECISIONS.md` carry more weight than they would on a team with clearer lanes — they're the only mechanism for "who knows about this part of the code."

| Name | GitHub | Role |
| --- | --- | --- |
| Manoj Amarasekara | (repo owner / `manojamarasekera@gmail.com`) | Developer — full stack, no fixed area |
| Naveen Wanigasekara | `naveen-wanigasekara` | Developer — full stack, no fixed area |

Plus AI coding agents (Claude, Codex, etc.) working across disconnected sessions per `AGENTS.md`.

## Stack at a glance

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Prisma 5 + PostgreSQL · Tailwind CSS 3 · Zustand · TanStack Query · Supabase Storage · JWT auth (custom, not a third-party auth provider).

See `docs/ARCHITECTURE.md` for the full picture.
