# Task workflow

Task files provide lightweight ownership and status tracking for developers and agents working concurrently. They are coordination records, not substitutes for Git, pull requests, domain documentation, or architectural decisions.

## Directories

- `in-progress/` contains actively owned work.
- `blocked/` contains paused work with a specific unresolved blocker.
- `completed/` contains finished tasks with acceptance and verification recorded.

Create a task from [`TASK_TEMPLATE.md`](TASK_TEMPLATE.md) before implementation begins. Use the next unused `CM-###` ID unless an ID has already been assigned. An ID remains reserved after it is created and must never be reused.

Move task files between status directories with `git mv` so history follows the task. The file name and ID do not change when its status changes.

## Starting work

1. Read all task files in `in-progress/` and `blocked/`.
2. Check `Areas`, `Likely files`, dependencies, and coordination notes for overlap.
3. Coordinate before proceeding when another task changes the same schema, migration, API contract, generated artifact, or behavior.
4. Create the new task in `in-progress/` and fill in every metadata field.

Two tasks may touch the same area when their outcomes are compatible and the owners document how they will integrate. Shared files alone do not imply a collision.

## Updating status

- Keep `Remaining work` current enough that another contributor can resume the task.
- For blocked work, describe the exact blocker, who or what can resolve it, and the last safe completed state before moving the file to `blocked/`.
- Before completion, check every acceptance criterion and record the commands and manual QA performed under `Verification`.
- Move the file to `completed/`, then append a concise entry to `docs/AGENT_HANDOFF.md`.

## Traceability

Use the task ID in the task filename, branch, commits, pull request title, and handoff entry. Recommended forms:

```text
Task:   docs/tasks/in-progress/CM-042-seller-verification.md
Branch: feature/CM-042-seller-verification
Commit: CM-042: add seller verification endpoint
PR:     [CM-042] Add seller verification
Handoff: 2026-07-21 — Codex (GPT-5) — CM-042
```

The task file owns status and delivery context. Git and the pull request own the exact code history. Current behavior belongs in the relevant domain docs, while architectural rationale belongs in `docs/DECISIONS.md`.
