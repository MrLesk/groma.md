---
id: TASK-612
title: Avoid stalled asynchronous scanner assertions
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 22:34'
updated_date: '2026-10-15 23:25'
labels: []
dependencies: []
references:
  - test-bun/nested-scanners.test.ts
  - plugins/scanners/typescript/src/source-analysis.ts
  - 'https://github.com/MrLesk/groma.md/actions/runs/38816211491'
modified_files:
  - plugins/scanners/typescript/src/source-analysis.ts
  - test-bun/nested-scanners.test.ts
  - .github/workflows/ci.yml
  - plugins/scanners/typescript/src/projects.ts
  - package.json
type: bug
ordinal: 681000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Current-main scanner qualification failed on Windows in the existing no-input/missing-base/invalid-option TypeScript configuration scenario after exactly 20 seconds. Sibling platform runs pass. Determine the blocked phase and address a confirmed cause before accepting the Windows result; do not raise timeouts, weaken assertions or retry failures to obtain green.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A bounded Windows diagnostic preserves the existing scenario and deadline and records the phase reached when it stalls.
- [ ] #2 A delivered correction is tied to the reproduced failure; the unchanged configuration behavior and full Windows, Linux and macOS checks pass before release.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Await the existing invalid-configuration scan with node:assert/strict rejects so its native compiler request batches run in the normal asynchronous event loop. Keep the complete selected-source/missing-base/no-input scenario, target error requirement, graph assertions, fixture isolation, concurrency and 20-second deadline. No scanner code or runner scheduling changes. Existing coverage owns the documented invalid-option rule: it must fail if invalid target options scan successfully or fail for the wrong reason; the reproduced gap is Bun 1.4.3 blocking its own promise matcher over the compiler request batcher. Rewrite that one assertion, without adding tests. Prove the correction with the controlled full Windows suite and 100 private repetitions, then normal Windows, Linux and macOS CI. Temporary probes and repetitions stay on the diagnostic branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The diagnostic retains the repository runner mode too: --parallel=2 controls isolation between files and --max-concurrency 1 controls tests within each file. Repetitions stop at the first failure and preserve the 20-second limit; this is diagnostic sampling, not a retry policy or acceptance run.

The first diagnostic passed 100 cases plus the original file; maximum observed case time was 3681.79 ms. Run 38818239615 also passed in the repository file-isolation mode. Original Windows timings: repository checks 22:21:01-22:25:20 UTC; C# worker tests finished 22:21:33 and standalone compilation 22:21:04. These do not support blaming concurrent compilation for the timeout at 22:25:20.

Full-context diagnostic run 38819360712 reproduced 20-second stalls, then reached its diagnostic-only 35-minute job limit. Timestamp probes place the delay inside configuration requests during the rejects matcher; valid scans and API cleanup stay fast. Upstream primary report: https://github.com/oven-sh/bun/issues/45020 (Bun 1.4.3, same installed revision c6da4a4d3). This is a diagnosis hypothesis until the controlled node:assert rejection check passes the same suite.

The local Bun 1.4.3 control uses the same setImmediate request-batching shape and a loopback socket. The Bun rejection matcher takes 13018 ms; node:assert/strict rejects takes 1.11 ms for the same rejection and message. /tmp/groma-bun-rejection-control.log. The production PR includes only the existing task record and two-line test change; source-analysis, projects, workflow and package probes remain private diagnostic history.

Focused original file passes: 27 tests, 154 assertions, no skips/failures (/tmp/groma-task612-focused.log). Assertion controls verify node:assert rejects fails for a successful scan and for the wrong error, and accepts the required target error. Own specification/quality review traces the same scanner promise to the same rejection requirement; only matcher waiting changes, with no fixture or product change. Full repository and cross-platform qualification are running.
<!-- SECTION:NOTES:END -->
