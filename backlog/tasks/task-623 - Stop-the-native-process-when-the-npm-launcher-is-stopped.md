---
id: TASK-623
title: Stop the native process when the npm launcher is stopped
status: Done
assignee:
  - '@codex'
created_date: '2026-10-20T03:24:00Z'
updated_date: '2026-10-20T03:49:00Z'
labels: []
dependencies: []
references:
  - scripts/npm/cli.cjs
  - .github/workflows/release.yml
  - 'https://github.com/MrLesk/Backlog.md/pull/1127'
  - src/cli.ts
modified_files:
  - test/fixtures/npm-launcher/native.cjs
  - test/npm-launcher.test.ts
  - scripts/npm/cli.cjs
  - CONTRIBUTING.md
  - src/cli-lifecycle.ts
  - src/cli.ts
  - groma/systems/groma-md/containers/cli/components/cli-lifecycle.md
  - groma/systems/groma-md/containers/cli/components/src-cli.md
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
- [x] #4 Windows invocation and exit behavior remain unchanged; no Unix signal handlers are installed there.
- [x] #5 A termination sent to the whole Unix process group must not interrupt native asynchronous cleanup through duplicate launcher forwarding.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep platform selection and native process startup in the npm wrapper, and resource cleanup in the native CLI. The standalone binary remains independent of npm, Node and an external Bun runtime.
2. Relay Unix launcher PID TERM/HUP/QUIT and wait for native exit; preserve the native exit code or Unix signal status. Do not relay terminal Ctrl+C a second time. Keep Windows launcher behavior unchanged.
3. Share native web and scan-watch shutdown through cli-lifecycle.ts. Start close once, retain TERM handling while close is pending, and preserve second-Ctrl+C interruption. Do not add a timeout, dependency or newer Node requirement.
4. Exercise real child-process behavior. The user-approved orphan-process fix requires tests for direct launcher termination, terminal Ctrl+C and native exit results; existing Backlog subscription tests do not cover Gromas own launcher. The reproduced group-TERM regression requires actual Bun shutdown-owner coverage with delayed cleanup; otherwise the concrete incorrect result is exit143 before close completes. Confirm these regressions fail before their fixes and pass after them.
5. Document ownership and the PID-only SIGINT limit. Scan the new lifecycle source and fold it into the existing Command interface through the Groma CLI; verify a rescan preserves that source owner without a new architecture component. Record only task-owned architecture changes.
6. Run focused checks, the rebuilt native web smoke, bun run check, and Windows/Linux/macOS CI. Perform implementer specification and quality reviews, then limited re-review of the native group-signal and map-ownership findings before release.
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

Final local repository check passed after the native correction: 24 Node tests and 901 Bun tests, 62 optional-runtime skips, zero failures. Standalone build succeeded, and the built binary reports its version with PATH=/nonexistent, confirming it does not require npm, Node or an external Bun executable to start. Implementer specification review: AC1-3 and AC5 have executable forwarding/exit/actual-owner evidence; AC4 is structurally unchanged and was already exercised by the initial Windows CI, with final-head CI now running. Implementer quality review: the launcher owns child lifetime and native cli-lifecycle owns asynchronous close; the sole new production module is 13 lines and is directly shared by both long-running CLI entry points. Cleanup runs once, duplicate TERM cannot terminate it early, and Ctrl+C retains its existing second-interrupt behavior. Tests assert child exit plus a post-cleanup artifact rather than source text or prose. No map, model, installer, dependency, timeout or compatibility behavior was added. Re-review of the reproduced group-signal defect and affected flows found no remaining blocking issue.

Codex identified a valid AGENTS.md ownership gap: the new lifecycle module was missing from the stored Command interface. Ran groma scan, combined cli-lifecycle into src-cli with the Groma CLI, and recorded both the temporary component path and final owner path immediately. A second scan preserves src/cli-lifecycle.ts under src-cli; it creates no separate lifecycle component. The task change is only the three source-reference lines in the existing owner, with no new architecture concept, component, relationship or prose. The scan also produced 26 untracked records for pre-existing scanner implementation files; those are outside this hotfix and will not be staged. Missing local C#/Go/Java/Rust worker packages retained their saved scanner evidence. This supersedes the earlier no-groma-changes note. A compiled native owner probe also confirms a second Ctrl+C still exits directly by SIGINT and through npm with status130; evidence: /var/folders/fd/cgvn5zh52tb_sbt7hp_vtbmm0000gn/T/groma-623-interrupt-proof-9ygwpnhj/results.json. Limited re-review confirms the new source reference belongs to the existing Command interface under C4, remains within groma.code metadata in the OKF profile, and survives the supported rescan flow.

Final code de843e96 passed all three CI jobs in run39365462006: Windows, Linux and macOS. Architecture workflow39365460007 also passed. Codex code/security review completed; its single architecture-ownership finding was fixed through scan/combine and verified by rescan. No production code changed after the green cross-platform run; the final commit records completion and adds the three source-ownership lines. Own limited specification/quality re-review finds no unresolved authority-backed blocker.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The npm launcher now relays Unix termination signals, waits for native shutdown and preserves its exit status. Native web and scan-watch cleanup starts once and survives duplicate TERM delivery; terminal Ctrl+C retains its existing second-interrupt behavior. The lifecycle source belongs to the existing Command interface. All eight focused launcher checks, the full repository check (24 Node and901 Bun tests;62 optional-runtime skips), compiled-native product checks and Windows/Linux/macOS CI pass. The compiled binary starts without external runtimes on PATH. Only launcher-PID SIGINT remains unforwarded because terminal Ctrl+C already reaches both foreground processes; repeated TERM waits for cleanup, with no new timeout. The hotfix is ready for release after the final task/map-record commit checks.
<!-- SECTION:FINAL_SUMMARY:END -->
