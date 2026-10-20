---
id: TASK-623
title: Stop the native process when the npm launcher is stopped
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-20T03:24:00Z'
updated_date: '2026-10-20T03:29:00Z'
labels: []
dependencies: []
references:
  - scripts/npm/cli.cjs
  - .github/workflows/release.yml
  - 'https://github.com/MrLesk/Backlog.md/pull/1127'
modified_files:
  - test/fixtures/npm-launcher/native.cjs
  - test/npm-launcher.test.ts
  - scripts/npm/cli.cjs
  - CONTRIBUTING.md
priority: high
type: bug
ordinal: 689000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Groma 0.7.1 npm installs use a Node launcher that starts the native executable as a child. On macOS, sending SIGTERM, SIGHUP or SIGQUIT only to the launcher PID exits Node while groma web keeps returning HTTP 200. The launcher must preserve the command lifecycle expected by a supervisor and a terminal; application resource cleanup remains owned by the native CLI. Backlog.md PR 1127 reports the same failure, but the solution must follow Gromas packaging, runtime and terminal behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On Unix, SIGTERM, SIGHUP and SIGQUIT addressed to the npm launcher reach its native child, and the launcher waits until that child exits.
- [x] #2 Terminal Ctrl+C reaches the native child once and the npm launcher waits for its cleanup instead of exiting early.
- [x] #3 The launcher preserves normal native exit codes and reports native signal termination with the corresponding Unix exit status.
- [ ] #4 Windows invocation and exit behavior remain unchanged; no Unix signal handlers are installed there.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep the npm wrapper responsible for selecting the platform executable and preserving its process lifetime; the native CLI owns resource cleanup. A process-replacement approach would remove the extra process, but Node execve is experimental, unavailable on the declared Node 20 minimum and unavailable on Windows. Keep the existing spawn model rather than changing the runtime or installer.
2. Add real child-process regression tests around a copied release launcher: direct launcher SIGTERM/SIGHUP/SIGQUIT must allow child cleanup and preserve its exit code; terminal-group SIGINT must arrive once; a child killed by a Unix signal must retain the matching status; normal exit remains portable. Existing Backlog lifecycle tests only stop Gromas Backlog subscription and do not exercise Gromas own launcher. Each new check addresses the reproduced orphan server or loss of native command exit semantics from the user-approved fix. Record failures on the unchanged launcher first.
3. Implement signal relay and listener cleanup at scripts/npm/cli.cjs. Forward supervisor termination signals and wait for the child; terminal Ctrl+C is already delivered to both foreground processes and must not be forwarded again. Preserve Windows behavior and normal exit codes; derive Unix signal statuses from OS constants.
4. Run focused tests, then repeat the real groma web reproduction with the changed wrapper and published native binary. Verify the port closes and the launcher waits for shutdown. Run bun run check, then perform the implementer specification and quality reviews. This is a bounded launcher fix, so no separate architecture review or new architecture concept is needed.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Regression proof: five tests failed on the unchanged launcher (SIGTERM/SIGHUP/SIGQUIT exited the launcher early, Ctrl+C exited it early, and native SIGKILL became exit 1). All six focused checks pass after the fix. The sixth check preserves normal exit 7 on every platform. Signal ownership and the PID-only SIGINT limit are documented in CONTRIBUTING.md.

Product-flow verification (macOS): the changed release launcher ran the published Groma 0.7.1 native binary in an empty temporary project. SIGTERM returned 0; SIGHUP returned 129; SIGQUIT returned 131; terminal-group SIGINT returned 0. Every case closed the HTTP port and left no native process. A temporary mutant that also forwards SIGINT failed the Ctrl+C regression with native exit 99, proving the single-delivery assertion is effective.
Repository check: bun run check passed (22 Node tests, 901 Bun tests, 62 optional-runtime skips; zero failures). Existing lint notices are outside this diff. No Groma architecture files changed.
Implementer specification review: AC1-3 pass with executable child-process tests and the real web command. AC4 retains the Windows branch unchanged; the cross-platform normal-exit regression will also run in Windows CI.
Implementer quality and simplicity review: platform resolution remains in runWrapper; relayTerminationSignals owns only the temporary Unix listeners; existing native CLI shutdown still owns resource release. Both child failure and child exit release the listeners. There is no new runtime dependency, installer path, process group, timeout, retry, application cleanup hook, or architecture concept. Tests own their child processes and temp directories, and run concurrently. The known PID-only SIGINT limit is explicit in the maintainer documentation. No authority-backed blocking code finding remains; three-platform CI is the remaining qualification.
<!-- SECTION:NOTES:END -->
