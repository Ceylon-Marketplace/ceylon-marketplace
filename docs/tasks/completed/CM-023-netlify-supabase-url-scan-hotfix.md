# CM-023 — Netlify Supabase URL scan hotfix

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** deployment, secrets scanning
- **Likely files:** `netlify.toml`, `docs/DEPLOYMENT.md`, `docs/AGENT_HANDOFF.md`
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Netlify no longer rejects expected generated references to the non-sensitive Supabase project URL while continuing to scan the Supabase service-role credential and other secrets.

## Acceptance criteria

- [x] Netlify omits only known non-sensitive configuration keys from value scanning.
- [x] Secrets scanning remains enabled and the service-role key remains protected.
- [x] Deployment documentation explains the exception.
- [x] Configuration syntax and production build pass.

## Dependencies

Netlify deploy failure caused by `SUPABASE_URL` appearing in generated route blobs.

## Coordination notes

No active or blocked task overlap identified.

## Implementation summary

Added a repository-owned `SECRETS_SCAN_OMIT_KEYS` value for the known non-sensitive `SUPABASE_URL`, `S3_BUCKET`, and `CORS_ORIGIN` configuration keys. The exception is deliberately key-scoped; global scanning remains enabled and no credential keys are omitted.

## Verification

- `npx tsc --noEmit` — passed.
- `npm run build` — passed with all 41 pages generated.
- `git diff --check` — passed.
- Reviewed `src/lib/supabase.ts` — the URL is paired with the server-only service-role key; `SUPABASE_SERVICE_ROLE_KEY` is not exempted.
- Netlify deploy scan — requires the next remote deploy to verify the platform-specific scanner result.

## Remaining work

Trigger a new Netlify deploy and confirm the scanner accepts expected `SUPABASE_URL` references. No code work remains.
