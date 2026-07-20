# DEPLOYMENT.md

## Current state: Netlify is the live target — but dead config from prior targets is still tracked

**Confirmed 2026-07-20:** a real Netlify build log (secrets-scanner failure, unrelated to deployment choice — see below) shows Netlify actively building this repo, so **Netlify is the live deployment target.** That resolves what was previously an open question here. What's still unresolved is cleanup: `wrangler.jsonc` (Cloudflare/OpenNext) is tracked config left over from an abandoned migration and should probably be deleted now that Netlify is confirmed, but that hasn't been done yet — don't delete it unilaterally without a `docs/DECISIONS.md` entry, since removing tracked deploy config is the kind of change worth a quick sanity check with Manoj/Naveen first.

This is still a good example of the problem `AGENTS.md` exists to prevent: the deployment target changed multiple times over the project's history with no doc recording the current state, and it took an actual failed build to establish ground truth rather than the repo answering the question on its own.

### What's tracked in git right now (as of this writing, `master` @ `06514eb`)

| File | Implies | Status |
| --- | --- | --- |
| `netlify.toml` | Netlify, `npm run build` → publish `.next`, Node 20, `@netlify/plugin-nextjs` | Tracked, present |
| `wrangler.jsonc` | Cloudflare Workers via OpenNext (`.open-next/worker.js`) | Tracked, present |
| `.vercel/project.json` | A local Vercel CLI project link (project + org ID) | **Not tracked** — gitignored, local-machine-only artifact from someone running `vercel link` |
| `.github/workflows/` | — | **Absent.** A Vercel deployment GitHub Actions workflow (`deploy.yml`) was added, then modified, then deleted as part of PR #12 — there is currently no CI/CD pipeline of any kind. |

### The history that produced this

From git log, in order:

1. Vercel Blob Storage integration added; app deployed via Vercel (`.vercel` link exists locally).
2. A Cloudflare Workers/OpenNext migration was attempted (`open-next.config.ts`, Cloudflare-specific `next.config.ts` import).
3. That migration was reverted — `CLEANUP_REPORT.md` (2026-06-23) documents removing the broken `@opennextjs/cloudflare` import and deleting `open-next.config.ts` because the package was never installed and it broke the build.
4. **However, `wrangler.jsonc` itself was never removed** and is still tracked in the repo today — it's a leftover artifact of step 2 that step 3's cleanup missed, or a sign the Cloudflare direction is still intended and just not finished. This has not been resolved either way.
5. A GitHub Actions workflow for Vercel deployment was added, then fixed (a hanging-in-CI bug), then deleted entirely as part of the Supabase Storage migration PR (#12).
6. Netlify config (`netlify.toml`) was added separately.

**Net result:** Netlify is confirmed live (see above), but `wrangler.jsonc` remains as dead config from the abandoned Cloudflare attempt. Whoever cleans this up should delete it and record the decision in `docs/DECISIONS.md` so the next session doesn't have to rediscover this history.

### Netlify secrets scanning — a recurring false-positive trap

Netlify's build-time secrets scanner does a literal string match: it takes the value of every configured build environment variable and flags any file in the repo/build output containing that exact string, with no regard for whether the value is actually sensitive. `API_PORT` (value `3001` in this project) has already tripped this once by appearing in prose in `docs/ARCHITECTURE.md` and `docs/SCOPE.md` describing the env var — fixed by not quoting the literal value in docs. `S3_BUCKET` and `CORS_ORIGIN` are already excluded via `SECRETS_SCAN_OMIT_KEYS` (visible in Netlify build logs) for the same reason — they're config, not secrets, but their values are common/short enough to collide with unrelated text.

**If a build fails with a "secrets scanning found secrets" error:** check whether the flagged value is an actual secret (rotate it and never let it land in git) or a non-sensitive config value that happens to match incidental text (fix the incidental text, or add the key to `SECRETS_SCAN_OMIT_KEYS`). Don't add something to the omit list just to unblock a build without checking which case you're in.

## Environment variables

`.env.example` is the closest thing to a canonical list, but it's stale in places — it implies a separate API server (`API_PORT`, `API_URL`, `CORS_ORIGIN`) that doesn't exist in the current single-Next.js-app architecture (see `docs/ARCHITECTURE.md`).

Variables actually read by the code (`grep`-verified against `src/`):

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `prisma/schema.prisma` | Pooled connection |
| `DIRECT_URL` | `prisma/schema.prisma` | Direct connection, for migrations |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | `src/lib/auth.ts` | Access token signing |
| `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` | `src/lib/auth.ts` | Refresh token signing |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase.ts` | Storage — **service-role key, server-only, never expose to the client** |

Present in `.env.local` but not read anywhere in `src/` (confirmed by grep) — legacy or reserved for infra not yet wired up:

- `REDIS_URL` — Redis is provisioned in `docker-compose.yml` but no code imports a Redis client (see `docs/ARCHITECTURE.md`)
- `BLOB_STORE_ID`, `BLOB_READ_WRITE_TOKEN` — leftover from the Vercel Blob → Supabase Storage migration
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_OIDC_TOKEN` — leftover from the (now-deleted) Vercel GitHub Actions workflow
- `API_PORT`, `API_URL`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` — imply a separate backend/WebSocket server that doesn't exist in the current architecture
- `S3_*` — imply S3-compatible object storage; superseded by Supabase Storage

**Don't delete any of these unilaterally** — some may be genuinely reserved for near-term work rather than pure cruft. Flag it and confirm before removing, per the docs-as-part-of-implementation rule in `AGENTS.md`.

## Secrets handling

- `.env`, `.env.local`, and `.vercel` are all gitignored (verified in `.gitignore`) — never commit real secrets in any of these.
- `.env.example` is (correctly) the only env file tracked in git, and should stay placeholder-only.
- The Supabase service-role key (`SUPABASE_SERVICE_ROLE_KEY`) bypasses row-level security — it must only ever be used server-side (`src/lib/supabase.ts` already does this correctly by not exporting it to any client component). Don't introduce a code path that sends this key to the browser.

## Local development infrastructure

`docker-compose.yml` provides Postgres 16 (host port **5433**, not 5432) and Redis 7 (port 6379, currently unused by app code — see above). `docker-compose up -d` before `npm run db:migrate`.

## TBD — needs input from Manoj/Naveen

- Whether `wrangler.jsonc` should be removed now that Netlify is confirmed live, or the Cloudflare migration is still intended
- Whether the unused env vars listed above represent near-term plans or should be cleaned out of `.env.example`
