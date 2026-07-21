# CM-020 — Page render performance audit

- **Status:** Completed
- **Owner:** Manoj
- **Agent:** Codex (GPT-5)
- **Started:** 2026-07-21
- **Completed:** 2026-07-21
- **Areas:** page rendering, navigation, notification polling, database indexes
- **Likely files:** Read-only audit
- **Branch:** feature/ui-ux-revamp
- **PR:** Not opened

## Outcome

Identify why authenticated marketplace pages feel slower after the notification-popover work and provide an evidence-based optimization order without changing behavior during a diagnostic request.

## Acceptance criteria

- [x] Initial navigation work and recurring requests are traced.
- [x] Slow request evidence is compared with implementation details.
- [x] Database index support for the notification query is checked.
- [x] A scoped optimization order is recorded.

## Dependencies

CM-018 and CM-019 notification popover work.

## Coordination notes

No active or blocked tasks overlap this read-only audit.

## Implementation summary

No implementation changes were authorized. The audit found that `NotificationPopover` mounts with every authenticated main route and immediately loads 50 notification records even while closed, then repeats that fetch every 30 seconds. Each request runs a newest-first record query plus total and unread counts. The live development log showed these calls taking approximately 0.7 to 3.6 seconds. The Notification model has `[userId, isRead]` but lacks the `[userId, createdAt DESC]` index used by the record query. The entire main route group is also `force-dynamic`, but the newly introduced eager notification work is the clearest regression.

Recommended order: keep a lightweight unread-count query for the bell; enable the 50-record query only when the popover opens; pause full-feed polling while closed; add a composite `[userId, createdAt DESC]` index; then remeasure before considering route-level rendering changes.

## Verification

- Source audit of navbar, popover, providers, main layout, notification API, and Prisma schema
- Live local request timings reviewed from the Next.js development log
- No code verification required because this was a read-only diagnosis

## Remaining work

Implement the recommended optimization in a separately authorized change.
