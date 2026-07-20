# CODING_STANDARDS.md

This documents what's actually enforced today, not an aspirational style guide. Keep it in sync with reality — if you tighten (or loosen) any of this, update the doc in the same change.

## TypeScript

`tsconfig.json` has `"strict": true`. This is genuinely enforced — `npx tsc --noEmit` should pass before calling a task done. Beyond strict mode, the codebase is loose in practice:

- `any` is used freely, especially in API route handlers (e.g. `getAuthUser(req): any`, `where: any` query-builder objects in `listings/route.ts`). This isn't a rule to follow blindly going forward — it's what exists today. Prefer real types for new code where it's cheap to do so, but don't do a drive-by "fix all the `any`s" refactor as part of an unrelated task (see `AGENTS.md` — no scope creep).
- Path alias `@/*` → `./src/*` is configured; use it instead of relative `../../..` imports.

## Linting

**There is currently no ESLint config file** (`eslint.config.mjs` / `.eslintrc.json` — neither exists), despite `eslint` and `eslint-config-next` being installed as devDependencies. Running `npm run lint` (`next lint`) will prompt to generate a config interactively rather than actually lint anything today. `CLEANUP_REPORT.md` (2026-06-23) claims linting infrastructure is "ready for use" — it is installed, but not configured, so treat "lint passes" in the completion checklist as "lint passes once someone adds a config, or N/A until then." Don't claim lint passed if it didn't actually run against a real config.

## Formatting

No Prettier config or devDependency is present, but a past commit ("fix: add auth header to image upload and format code with Prettier") suggests Prettier was run ad hoc at some point without being formally adopted. There's no enforced formatter — match the surrounding file's style (double quotes, semicolons, trailing commas are the prevailing convention observed in `src/lib/*.ts` and route handlers).

## Patterns to follow (observed, not written down elsewhere)

- **API routes:** every handler wraps its body in `try { ... } catch (err) { return handleError(err); }` and throws `ApiError(message, status)` for expected failures (see `src/lib/auth.ts`). Follow this rather than inventing a new error-handling shape.
- **Auth checks:** call `requireAuth(req)` / `requireRole(user, ...roles)` at the top of a handler — there's no middleware doing this for you (see `docs/ARCHITECTURE.md`).
- **Concurrent writes:** wrap read-then-write sequences that must be race-safe in `prisma.$transaction` (see the bidding logic in `src/app/api/auctions/[id]/bid/route.ts`) rather than doing a separate read and write.
- **Forms:** hand-rolled with `useState`, not `react-hook-form` (it's installed but unused — see `docs/DESIGN_SYSTEM.md`).
- **Client data fetching:** TanStack Query (`useQuery`) for anything needing caching/refetch/polling; the shared `axios` instance in `src/lib/api.ts` for the underlying HTTP call.

## What "done" requires

See the completion checklist in `AGENTS.md`. In short: build passes, types pass, lint passes if a config exists (flag it in your handoff entry if not), manual QA done, docs updated, no dead code, no unnecessary new deps.
