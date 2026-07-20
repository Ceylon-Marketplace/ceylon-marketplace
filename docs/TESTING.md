# TESTING.md

## What exists today

**No automated test suite.** There is no test runner configured (no Jest/Vitest/Playwright/Cypress in `package.json`), no `__tests__` directories, and no files matching `*.test.*` or `*.spec.*` anywhere in `src/`. `package.json` has no `test` script. This is confirmed by direct search, not inferred — don't assume hidden coverage exists somewhere.

`CLEANUP_REPORT.md` (2026-06-23) reports "Build Status: PASSING" and "Type Check: PASSING" as its verification — that's the extent of automated verification this project has ever had: a successful `next build` (which includes `tsc` via Next's build step) and manual feature walkthroughs, not tests.

## What "QA" means in this project right now

Manual verification against the running dev server (`npm run dev`), or a production build (`npm run build && npm start`). There's no documented QA checklist or test plan beyond what's implied by the feature list in `README.md`.

## What this means for agents and contributors

- The completion checklist in `AGENTS.md` says "relevant manual QA done" rather than "tests pass" — because there are no tests to run. Actually exercise the feature you changed in a running app before calling a task done; don't rely on the build/type-check succeeding as a proxy for correctness, especially for anything involving the auction bidding transaction, auth token refresh flow, or moderation actions (these have real race-condition/security surface — see `docs/ARCHITECTURE.md`).
- If you add the first tests to this project, that's architecturally significant — record the choice of framework and testing approach in `docs/DECISIONS.md`, and update this file to describe what actually exists afterward (don't leave this doc saying "no tests" once there are some).

## TBD — needs input from Manoj/Naveen

- Whether adding automated tests (and which framework) is a near-term priority or explicitly deferred
- Whether there's an expectation of testing the auction/bidding transaction logic specifically before this goes further into real production use, given it's the most concurrency-sensitive code path in the app
