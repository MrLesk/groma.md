---
id: TASK-623
title: Stop the native process when the npm launcher is stopped
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-20T03:24:00Z'
updated_date: '2026-10-20T03:39:00Z'
labels: []
dependencies: []
references:
  - src/cli.ts
modified_files:
  - test/fixtures/npm-launcher/native.cjs
  - test/npm-launcher.test.ts
  - scripts/npm/cli.cjs
  - CONTRIBUTING.md
  - src/cli-lifecycle.ts
  - src/cli.ts
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
- [x] #5 A termination sent to the whole Unix process group must not interrupt native asynchronous cleanup through duplicate launcher forwarding.
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

5. Address the newly reproduced process-group TERM regression. Native stopOnSignal is the shutdown owner. Before changing repeated-termination policy, compare keeping its TERM handler during an idempotent close against replacing the Unix launcher process at the cost of a newer Node requirement. Add delayed group-termination regression coverage, rerun focused and full checks after the approved change, and qualify all three CI platforms before release.

Native cleanup regression coverage: the supported rule is completion of the user-approved long-running command shutdown (AC5). The concrete failure is launcher + native group TERM killing native cleanup before its promise resolves. Existing launcher fixtures exercise signal forwarding but not the actual native shutdown owner. Extract stopOnSignal into a small CLI lifecycle module so the same owner used by web and scan watch can run in a real child fixture; extend the existing launcher test with delayed group TERM and native cleanup-count evidence. Keep SIGTERM handled until close completes, guard close against repeat calls, and preserve second-Ctrl+C interruption. This also means a repeated TERM waits for pending cleanup; no timeout or new runtime requirement is introduced.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Regression proof: five tests failed on the unchanged launcher (SIGTERM/SIGHUP/SIGQUIT exited the launcher early, Ctrl+C exited it early, and native SIGKILL became exit 1). All six focused checks pass after the fix. The sixth check preserves normal exit 7 on every platform. Signal ownership and the PID-only SIGINT limit are documented in CONTRIBUTING.md.

Product-flow verification (macOS): the changed release launcher ran the published Groma 0.7.1 native binary in an empty temporary project. SIGTERM returned 0; SIGHUP returned 129; SIGQUIT returned 131; terminal-group SIGINT returned 0. Every case closed the HTTP port and left no native process. A temporary mutant that also forwards SIGINT failed the Ctrl+C regression with native exit 99, proving the single-delivery assertion is effective.
Repository check: bun run check passed (22 Node tests, 901 Bun tests, 62 optional-runtime skips; zero failures). Existing lint notices are outside this diff. No Groma architecture files changed.
Implementer specification review: AC1-3 pass with executable child-process tests and the real web command. AC4 retains the Windows branch unchanged; the cross-platform normal-exit regression will also run in Windows CI.
Implementer quality and simplicity review: platform resolution remains in runWrapper; relayTerminationSignals owns only the temporary Unix listeners; existing native CLI shutdown still owns resource release. Both child failure and child exit release the listeners. There is no new runtime dependency, installer path, process group, timeout, retry, application cleanup hook, or architecture concept. Tests own their child processes and temp directories, and run concurrently. The known PID-only SIGINT limit is explicit in the maintainer documentation. No authority-backed blocking code finding remains; three-platform CI is the remaining qualification.

Release hold: a new cross-project regression report was reproduced using the exact stopOnSignal function from src/cli.ts under Bun, with a delayed close operation. Baseline main: PID-only TERM leaves the native process; group TERM finishes native cleanup. Current PR: PID-only TERM finishes cleanup; group TERM exits143 before cleanup completes. Evidence: /tmp/groma-623-group-proof-8hysidk7/results.json. Native stopOnSignal removes its SIGINT and SIGTERM handlers before awaiting viewer or scan cleanup. A second TERM becomes an immediate default termination. The earlier idle web-port smoke was insufficient to detect incomplete cleanup. Added AC5 for this newly reproduced regression; merge/release are held until a root-level solution is qualified.

The actual-owner regression now fails before the native fix (group TERM exits 143 instead of 23) and passes after it. All eight focused launcher checks pass, including delayed group TERM and group Ctrl+C under Bun. stopOnSignal now lives in src/cli-lifecycle.ts; web and scan watch both use this owner. Its guard starts close once; the TERM handler remains installed until exit, while SIGINT is removed on first shutdown to preserve second-Ctrl+C interruption. A repeated TERM now waits for pending cleanup. No timeout or runtime change was added. The helper remains code within the existing Command interface responsibility, not a new C4 element; ordinary Markdown source links still describe that component and Groma retains source ownership under its existing groma mapping. Routine code work does not require a full scan/curation cycle, and no groma files changed.

Rebuilt-native product verification on macOS: npm PID TERM/HUP/QUIT, npm group TERM/INT and standalone group TERM all closed the HTTP port, left no native process, and returned their expected exit status. Evidence: /var/folders/fd/cgvn5zh52tb_sbt7hp_vtbmm0000gn/T/groma-623-final-smoke-_w0kb52b/results.json. The initial PR commit passed Linux/macOS/Windows CI and Codex reported no findings; the native correction will receive its own three-platform qualification.
<!-- SECTION:NOTES:END -->
