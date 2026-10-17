---
id: TASK-621
title: Wait for the detached update worker before deleting its test fixture
status: Done
assignee:
  - '@codex'
created_date: '2026-10-17 18:17'
updated_date: '2026-10-17 18:23'
labels: []
dependencies: []
references:
  - test-bun/scanner-update.test.ts
  - src/scanner/background-updates.ts
  - 'https://github.com/MrLesk/groma.md/actions/runs/39032379645'
modified_files:
  - test-bun/scanner-update.test.ts
type: bug
ordinal: 687000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-merge Windows CI39032379645 fails with EBUSY in scanner-update.test.ts fixture deletion. The one-shot CLI test waits for its foreground child but releases the detached updater and immediately removes its working directory, so Windows can still have the directory in use. Release publication is held until this test lifecycle race is fixed and three-platform CI is green.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The one-shot CLI test still proves the foreground scan exits successfully while its registry request is held and only the installed scanner has run.
- [x] #2 The test waits for its detached updater to exit before deleting its fixture, without changing product behavior, weakening assertions, adding deletion retries or increasing timeouts.
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
1. Preserve all existing one-shot CLI assertions. The user requires nonblocking offline-safe scanner updates; Windows CI reproduces EBUSY in teardown because existing coverage owns only the foreground child lifecycle. Extend that same test to observe the real detached worker PID through a child-scoped Bun preload and wait for its actual exit before removal. This adds no product API, option, scanner behavior or architecture concept. 2. Check official Bun1.4.3 process/preload documentation and validate the installed1.4.3 runtime; package.json pins1.4.3. Use the existing test deadline and per-test temp files, not global hooks, sleeps to change assertions, removal retries, or new runner options. 3. Run focused update coverage and the full repository check, then implementer specification and quality review. Open one task-scoped PR and require Windows/Linux/macOS CI plus architecture before merge; retarget the approved release draft afterward. Preserve the separate pending TASK610 record changes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Official Bun docs (bun.com/docs/runtime/child-process and bun.com/docs/runtime/bunfig) describe detached/unref/exited and runtime preload; installed Bun1.4.3 matches package.json1.4.3. A local runtime probe verifies fixture-local bunfig preload. The unchanged CLI test records its real refresh worker PID through that per-fixture preload, releases the held registry as unavailable after asserting foreground exit, and waits for process termination before deleting the working directory. No product file, assertion, timeout or removal retry changes.

Implementer specification review: the original foreground exit0 and installed-only scan assertions remain unchanged and run while the registry gate is held (AC1). Teardown releases the failed registry request, waits for the observed real worker PID to disappear, then removes its fixture; this closes the reproduced Windows EBUSY lifecycle race without product changes, removal retries or timeout changes (AC2). Official Bun1.4.3 runtime/preload and Node process.kill(pid,0) documentation were checked, and the fixture-local preload plus worker-exit wait execute successfully with installed1.4.3. Quality review traces fixture ownership from per-test files and port through actual CLI/worker processes to registry release, exit and deletion; no global hook, shared state or runtime API was added. The test file is404lines and changed functions produce no complexity warning. Focused checks pass16tests147assertions. Full bun run check passes16Node898Bun62optional skips0fail3703Bunassertions (/tmp/groma-task621-check.log). git diff --check and groma status pass; no architecture change. Exact-head Windows/Linux/macOS CI is the merge gate. Separate TASK610 record changes are preserved and excluded from this task commit.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The one-shot CLI test now observes its detached updater through a per-fixture runtime preload and waits for actual process exit before deleting the working directory. This addresses the Windows EBUSY cleanup failure while preserving foreground-exit and installed-scanner assertions and the existing timeout. Focused and full local checks pass; three-platform CI remains required before merge. Product code and scanner packages are unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
