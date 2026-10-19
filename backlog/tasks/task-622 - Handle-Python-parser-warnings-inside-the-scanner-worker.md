---
id: TASK-622
title: Handle Python parser warnings inside the scanner worker
status: Done
assignee:
  - '@codex'
created_date: '2026-10-19T15:01:00Z'
updated_date: '2026-10-19T15:13:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/145'
  - plugins/scanners/python/worker/runtime.ts
  - test-bun/python-scanner.test.ts
modified_files:
  - test-bun/python-scanner.test.ts
  - plugins/scanners/python/worker/runtime.ts
  - plugins/scanners/python/package.json
type: bug
ordinal: 688000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Python compile-time warnings write through Pyodide’s default Node writer. Worker stdout/stderr streams have no numeric fd, so scanning valid source can print Error thrown in write and lose the warning. Issue145 provides a valid-source reproduction. Route interpreter output through a worker-safe writer while keeping scan and outline results unchanged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scanning valid Python source that emits a SyntaxWarning completes without the Pyodide writer error and still reports its declarations.
- [x] #2 Reading Code outlines for the same source succeeds and preserves the warning on stderr without adding interpreter output to stdout.
- [x] #3 The packaged scanner continues to work without installed Python tooling or executing project code.
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
Reproduce issue145 with the current packaged scanner. Existing Python tests verify parser evidence and outlines but do not capture worker output, so extend the existing test file with one child-process scan/outline scenario that detects the fd error and checks result integrity. Prove the regression assertion fails before the fix. Give loadPyodide explicit stdout/stderr writers owned by worker/runtime.ts and keep output synchronous on stderr. Verify the focused Python suite and full repository check, review the small change locally, then commit and open a scoped PR for the hotfix release.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Regression proof before the fix: the packaged scanner returned valid scan JSON but stderr contained only Error thrown in write, so the SyntaxWarning assertion failed. The same child-process scenario covers scan and outline separately and hides installed tools by clearing PATH.

The regression uses the invalid-escape docstring from issue145 so both ast.parse (outlines) and compile (scans) emit SyntaxWarning. The initial identity-comparison trigger emitted only during compile; requiring an outline warning for that different trigger was an incorrect test expectation, not a worker failure.

The warning regression now passes for scan and outline independently: valid JSON results retain the sample declaration, SyntaxWarning reaches stderr, no Pyodide writer error appears, and PATH is empty so no installed Python tooling can be used. The module raises if executed, proving scanning does not execute it. Complete bun run check passed: Node suite and901 Bun tests,62 optional skips,0 failures. git diff --check passed; no groma/ files changed. Implementer simplicity/specification/quality review passed: runtime.ts owns the interpreter output policy; explicit synchronous fd2 writers avoid worker stream fds and finish before worker termination. No helper, dependency, public protocol, configuration or architecture change is needed. The new regression tests the reported output failure and both supported worker modes without freezing warning prose. The package patch version is0.2.3.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Python compile-time warnings now use explicit synchronous stderr writers inside the Pyodide worker, preserving scan and outline JSON and removing the fd-undefined writer error. A regression covers both modes with no installed tools and project-execution protection. The complete repository check passes. Prepares @groma/scanner-python0.2.3 for the hotfix release.
<!-- SECTION:FINAL_SUMMARY:END -->
