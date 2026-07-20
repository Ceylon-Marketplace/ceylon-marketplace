# ROADMAP.md

> **⚠️ Freshness warning:** unlike the other docs in this folder, a roadmap describes *intent*, not the current state of the code — it goes stale the moment priorities shift, and nothing forces it to be updated in step with a merge. Before trusting anything below as current priority, check its date against the latest `docs/AGENT_HANDOFF.md` entries and, ideally, confirm with Manoj/Naveen directly. If you update priorities, update the date at the top of this file.

**Last updated:** 2026-07-20 (initial creation — inferred from code, not from a product conversation)

## Inferred near-term candidates (not confirmed priorities)

These are gaps identified while writing this documentation set, not a committed plan:

1. **Resolve the deployment story.** The repo currently carries tracked config for Netlify (`netlify.toml`) and Cloudflare Workers/OpenNext (`wrangler.jsonc`) simultaneously, plus a gitignored local Vercel CLI link, with no GitHub Actions workflow currently present. See `docs/DEPLOYMENT.md`. This should probably be resolved before this goes further into "real" production use.
2. **Lint enforcement.** `eslint` and `eslint-config-next` are installed but there's no config file, so `npm run lint` isn't actually enforcing anything today. See `docs/CODING_STANDARDS.md`.
3. **Decide on Redis's fate.** It's provisioned in `docker-compose.yml` and env vars but unused in code — either build the feature that needs it (rate limiting? session cache? real job queue?) or remove the provisioning to stop implying it does something.
4. **Payments.** Subscriptions have no payment provider wired up.

## TBD — needs input from Manoj/Naveen

Everything else: target launch date, target market, feature priorities beyond what's already built, whether "real-time" (WebSocket) auctions/messaging is still wanted or should be formally dropped in favor of polling.
