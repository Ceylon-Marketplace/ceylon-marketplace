# AGENTS.md — Operating Manual

This file is the entry point for any AI coding agent (Claude, Codex, or otherwise) or human contributor working on Ceylon Marketplace. Read it before doing anything else.

## Purpose & philosophy

**The repo is the source of truth — not this conversation, not a Slack thread, not something someone said out loud last week.**

Ceylon Marketplace is built by two developers plus AI agents, working across sessions that share no memory with each other. An agent picking up work tomorrow knows only what's written in `docs/`. If a decision, constraint, or piece of context isn't written down there, it doesn't exist for the next session — human or agent.

Talking things through on Slack or in person is fine in the moment. But anything that should survive past today — an architectural choice, a business rule, a gotcha someone will hit again — gets written into `docs/` before the task is called done. A task that changed behavior, scope, an API, or the schema without updating the doc that describes it is not finished.

This project has already lived through what happens without this discipline: the deployment target has flipped between Vercel, Cloudflare Workers, and Netlify multiple times (see `docs/DEPLOYMENT.md`), and the repo currently carries tracked config for more than one of them simultaneously with no record of which one is actually live. That ambiguity is exactly the failure mode this file exists to prevent.

## Reading list (read in this order before non-trivial work)

1. [docs/PROJECT.md](docs/PROJECT.md) — what this is, who works on it, current stage
2. [docs/PRODUCT.md](docs/PRODUCT.md) — what the product does, for whom
3. [docs/SCOPE.md](docs/SCOPE.md) — what's in scope vs. explicitly out
4. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack, request flow, auth model
5. [docs/DATABASE.md](docs/DATABASE.md) — schema, relationships, indexes
6. [docs/API.md](docs/API.md) — endpoints, conventions, business rules
7. [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — Tailwind conventions, components
8. [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) — actual lint/TS rules
9. [docs/TESTING.md](docs/TESTING.md) — what QA coverage actually exists
10. [docs/DECISIONS.md](docs/DECISIONS.md) — architectural decision log (ADRs)
11. [docs/AGENT_HANDOFF.md](docs/AGENT_HANDOFF.md) — read **only the last 2–3 entries**

Not every task needs all ten. A one-line copy fix doesn't need the database doc. A schema change needs at least ARCHITECTURE, DATABASE, API, and DECISIONS (if it establishes a new pattern).

## The AGENT_HANDOFF.md protocol

`docs/AGENT_HANDOFF.md` is a running log of every non-trivial work session, in any order of human or agent.

- **Before starting:** read the latest entries (last 2–3 is usually enough; scroll back further if you need to trace when something was introduced).
- **After finishing:** append a new entry. Never edit or delete a prior entry.
- Each entry includes: date, author (see attribution convention below), task description, what was done and why, files changed, technical decisions made, known issues/stubs left behind, and a recommended next task.
- **This file is append-only.** If a merge conflict occurs on it, resolve it by keeping **both** entries in chronological order — never by dropping one side. A conflict here is not a real conflict; it's two people writing to the end of a log at once.

### Attribution convention

Sign entries with **first name for humans**, **name + model for agents**:

- `Manoj`
- `Naveen`
- `Claude (Sonnet 5)`
- `Codex (GPT-5)`

## Decision authority

Entries in `docs/DECISIONS.md` that carry real architectural weight — a new pattern other code is expected to follow, or a reversal of an earlier approach — **require sign-off from both Manoj and Naveen before landing.** Neither developer owns architecture calls unilaterally. If you're an agent and can only reach one of them, open the decision as a `Proposed` entry (see the template in DECISIONS.md) and say explicitly that it's pending the other developer's review — don't mark it `Accepted` and don't build irreversible follow-on work on top of it until it is.

Routine implementation choices (which library function to call, how to name a variable, following an existing pattern) don't need this — only decisions that other future work will treat as precedent.

## Work-in-progress coordination

There is no issue tracker wired into this workflow. To avoid two people (or a person and an agent) colliding on the same area on the same day, `docs/AGENT_HANDOFF.md` keeps a running **"Currently in progress"** section at the top of the file, above the log entries. Before starting non-trivial work:

1. Check that section for anything overlapping what you're about to touch.
2. Add a line for your own task before you start.
3. Remove your line when you append your completed handoff entry.

If the section is empty, you're clear to proceed. If it's stale (a line describing something clearly already shipped), it's fine to remove it — but say so in your handoff entry.

## Docs-as-part-of-implementation

A code change isn't done until the docs describing that behavior, scope, architecture, API surface, or schema are updated to match it. This isn't a follow-up task — it's part of the task.

If you find docs and code already disagreeing when you arrive (and you will — see the deployment example above, or the README's claim of WebSocket support for auctions/messaging where the actual implementation is REST + polling), **stop and flag it rather than silently picking a side.** Note the discrepancy in your handoff entry and, if you can resolve it, fix the doc (or the code) explicitly rather than leaving it ambiguous for the next session.

## Engineering principles

- **Simple over clever.** Prefer the boring solution that the next reader (possibly an agent with no memory of this session) can understand in one pass.
- **No dead code.** If it's not used, delete it — don't comment it out, don't leave it "for later."
- **No scope creep.** Do the task that was asked. Note ideas for more in `docs/ROADMAP.md` or the handoff entry, don't build them unasked.
- **No silent breaking changes.** If a change alters an API response shape, a business rule, or a schema in a way that affects other callers, say so explicitly in the PR/commit and in the relevant doc.
- **Follow existing patterns** unless you have a specific reason to deviate — and if you deviate, record the new pattern in `docs/DECISIONS.md` so it doesn't look like an accident to the next person.

## Framework-specific rules

**Do not assume framework behavior from training data.** This repo pins specific versions (Next.js 15.1.12, React 19, Prisma 5.22, Tailwind 3.4) — verify version-specific API behavior against what's actually installed (`package.json` / `package-lock.json`) before relying on it, especially for Next.js App Router conventions (route handler signatures, caching semantics, `params` as a `Promise` in route handlers — already true in this codebase, don't "fix" it back to the old sync signature).

## Completion checklist

Before calling any non-trivial task done:

- [ ] `npm run build` passes (runs `prisma generate` first)
- [ ] `npx tsc --noEmit` passes (strict mode is on — see CODING_STANDARDS.md)
- [ ] `npm run lint` passes, or you've noted in your handoff entry that no ESLint config currently exists (see CODING_STANDARDS.md) and lint was skipped
- [ ] Relevant manual QA done (there is no automated test suite — see TESTING.md)
- [ ] Docs updated to match the change (this is not optional, see above)
- [ ] No dead code left behind
- [ ] No unnecessary new dependencies added
- [ ] `docs/AGENT_HANDOFF.md` entry appended
- [ ] `docs/DECISIONS.md` entry added if the change was architecturally significant, with sign-off status noted
