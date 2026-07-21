# CM-001 — Improve multi-contributor workflow

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** contributor workflow, documentation
- **Likely files:** `AGENTS.md`, `docs/PROJECT.md`, `docs/AGENT_HANDOFF.md`, `docs/DECISIONS.md`, `docs/tasks/**`
- **Branch:** current working branch
- **PR:** Not opened

## Outcome

Replace the shared in-progress list with lightweight per-task files and establish a stable task ID that links tasks, branches, commits, pull requests, and handoffs.

## Acceptance criteria

- [x] Task directories and a reusable template exist.
- [x] `AGENTS.md` explains task lifecycle, collision checks, and traceability.
- [x] `docs/AGENT_HANDOFF.md` is limited to concise, durable session context.
- [x] The team documentation reflects the new coordination source of truth.
- [x] The workflow change is recorded as a proposed decision pending developer sign-off.

## Dependencies

None.

## Coordination notes

No overlapping active or blocked tasks were present. This task changed the contributor workflow itself.

## Implementation summary

Added `docs/tasks/` with in-progress, blocked, and completed lifecycle states plus a reusable task template. Updated the operating manual and project documentation to assign status to task files, exact diffs to Git and pull requests, current behavior to domain docs, rationale to decisions, and durable session context to concise handoffs. Recorded the convention in proposed ADR 0002, pending Naveen's review.

## Verification

- `npx tsc --noEmit` — passed.
- `npm run build` — passed.
- `npm run lint` — unavailable as an enforcement check because no ESLint configuration exists; the command opened Next.js's interactive setup prompt, matching `docs/CODING_STANDARDS.md`.
- Manual QA — reviewed task lifecycle paths, internal documentation links, ID examples, collision rules, and completion requirements for consistency; `git diff --check` passed.

## Remaining work

None. Workflow automation remains intentionally deferred until the team has used the convention and can identify useful enforcement rules.
