# DECISIONS.md

Architectural Decision Record (ADR) log. This captures decisions with real weight — a new pattern other code is expected to follow, or a reversal of an earlier approach — not routine implementation choices.

## Sign-off rule

Per `AGENTS.md`: any entry here that's architecturally significant requires sign-off from **both Manoj and Naveen** before it's marked `Accepted`. Neither developer owns architecture calls unilaterally. If only one of them is reachable when a decision needs to be recorded, add it with status `Proposed` and say explicitly that it's pending the other's review — don't mark it `Accepted` on one signature, and don't build follow-on work that assumes it's final until it is.

## Template

Copy this for a new entry:

```markdown
### NNNN: <short title>

- **Date:** YYYY-MM-DD
- **Author:** <first name, or Agent Name (Model)>
- **Status:** Proposed | Accepted | Rejected | Superseded by NNNN
- **Signed off by:** <names, or "pending — needs Manoj/Naveen">

**Context.** What problem or situation prompted this.

**Decision.** What was actually decided.

**Consequences.** What this changes going forward, what it rules out, what other code/docs need to follow this pattern now.
```

## Log

### 0001: Adopt repo-as-source-of-truth documentation system

- **Date:** 2026-07-20
- **Author:** Claude (Sonnet 5)
- **Status:** Proposed
- **Signed off by:** Manoj (commissioned this setup and answered the process questions below); pending — needs Naveen's review

**Context.** This project is worked on by two developers plus AI coding agents across sessions with no shared memory. Prior to this, there was no standard place for architectural context, decisions, or handoff notes to live — evidenced concretely by the deployment target having changed several times (Vercel → Cloudflare → reverted → Netlify) with tracked config for more than one target left in the repo simultaneously and no record of which is live (see `docs/DEPLOYMENT.md`).

Manoj answered the following setup questions for this system (Naveen should review and confirm or amend):

- **Attribution:** first name for humans, `Name (Model)` for agents, e.g. `Manoj`, `Naveen`, `Claude (Sonnet 5)`, `Codex (GPT-5)`.
- **Decision authority:** both developers must sign off on architecturally significant decisions (this rule).
- **WIP coordination:** a running "Currently in progress" section at the top of `docs/AGENT_HANDOFF.md`, no separate issue tracker.
- **Area ownership:** none — everything is shared between the two developers.

**Decision.** Adopt `AGENTS.md` + `docs/` as the mandatory source of truth for architecture, product context, and decisions, with `docs/AGENT_HANDOFF.md` as an append-only session log. Full protocol is in `AGENTS.md`.

**Consequences.** Every non-trivial task from here forward is expected to read the relevant docs before starting and update them (plus append a handoff entry) before being called done. This is a process change affecting both developers equally, which is why it's logged here rather than just being an unrecorded convention — and why it needs Naveen's explicit sign-off rather than standing on Manoj's alone.

### 0002: Track work with individual task files and stable IDs

- **Date:** 2026-07-21
- **Author:** Codex (GPT-5)
- **Status:** Proposed
- **Signed off by:** Manoj (requested the workflow improvement); pending — needs Naveen's review

**Context.** The shared "Currently in progress" section in `docs/AGENT_HANDOFF.md` mixed mutable task state into an append-only session log. As concurrent developer and agent work grows, that creates a common edit hotspot, weak ownership visibility, and no stable identifier connecting a request to its branch, commits, pull request, handoff, and completion evidence.

**Decision.** Give every non-trivial task a stable, never-reused `CM-###` ID and an individual file under `docs/tasks/`. Directory location records whether the task is in progress, blocked, or completed. Task metadata records ownership, affected areas, likely files, dependencies, acceptance criteria, and verification. The same ID is used in branches, commits, pull requests, and handoffs. `docs/AGENT_HANDOFF.md` remains append-only but no longer owns active status; it contains only concise cross-session context and links to task records.

**Consequences.** Contributors must check active and blocked task files for semantic or file overlap before beginning non-trivial work, create their own task file before implementation, and move it through the documented lifecycle. This adds a small amount of per-task administration while reducing edits to one shared coordination section and making work traceable across artifacts. No automated workflow validator or external issue tracker is introduced in this iteration; those can be considered after the team has used the convention and identified which failures are worth enforcing.

### 0003: Cache public marketplace reads with Next.js and Netlify primitives

- **Date:** 2026-07-21
- **Author:** Codex (GPT-5)
- **Status:** Proposed
- **Signed off by:** Manoj (requested the performance fix and approved the approach); pending — needs Naveen's review

**Context.** Home and Listings each performed three direct Prisma queries against the remote Supabase database on every navigation. Warm browser measurements were approximately 4.30 seconds for Home, 1.68 seconds for Listings, and 3.17 seconds for the Home-to-Listings client transition. The shared main layout also forced every route to render dynamically. Redis is provisioned locally but is not wired into the application, while the live Netlify adapter already supports Next.js route/data caching and incremental static regeneration.

**Decision.** Use bounded Next.js route revalidation for public, non-personalized marketplace reads: 30 seconds for Home and Listings and 15 seconds for Auctions. Keep authenticated and user-specific data outside the shared cache and load it through protected API routes plus TanStack Query. Use the same first-party platform primitives before introducing Redis; add an external cache only when a measured workload needs capabilities the built-in cache does not provide.

**Consequences.** Initial public results can be up to one revalidation window behind a write, but repeated navigations and concurrent visitors avoid repeating the same remote database work. Auction clients continue their existing live polling after hydration. The approach adds no dependency or separately operated service and remains easy to reverse. If the marketplace later requires immediate post-write visibility, targeted path/tag invalidation should be added to those mutations. Because this is a project-wide caching precedent, it remains proposed until Naveen reviews it.
