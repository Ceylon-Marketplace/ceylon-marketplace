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
