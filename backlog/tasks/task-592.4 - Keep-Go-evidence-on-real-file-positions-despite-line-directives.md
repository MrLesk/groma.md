---
id: TASK-592.4
title: Keep Go evidence on real file positions despite //line directives
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:51'
updated_date: '2026-10-13 18:43'
labels: []
dependencies: []
references:
  - plugins/scanners/go/worker/evidence.go
documentation:
  - docs/scanners/go/index.md
modified_files:
  - test-bun/go-scanner.test.ts
  - plugins/scanners/go/worker/evidence.go
  - plugins/scanners/go/worker/project.go
  - plugins/scanners/go/worker/outline.go
  - docs/scanners/go/index.md
parent_task_id: TASK-592
type: bug
ordinal: 661000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Go `//line` directives rename positions for compiler messages. The Go worker reads operation line ranges and its call-lookup key through positions that follow those directives (`evidence.go`), so a directive changes evidence about the real file. Reproduced: a hand-written file with `func Weird() int {` / `//line other.go:1` / `return 1` / `}` yields start line 5 and end line 2, and the scan fails with "operation.endLine must be at or after startLine", which stops the Go scan of the whole repository. Reproduced: two files that each carry `//line gen.go:1` before a function at the same byte offset make every call to the first function resolve to the second. Files marked "Code generated ... DO NOT EDIT." carry no line range and are unaffected.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The reproduced function scans with the line range it has in its real file.
- [x] #2 Calls resolve to the function they name when two files share a `//line` file name.
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
1. Reproduce with the worker built from HEAD (done): //line inside a function gives range 5..2 and the scan throws; two files with //line gen.go:1 make calls to A resolve to B; the same adjusted positions also reach invocation.line, the GO_MISSING_EXTERNAL_PACKAGES diagnostic (file other.go, line 1) and the outline's symbol lines.
2. evidence.go: add one helper, sourcePosition(fileSet, pos), that returns Go's unadjusted position (PositionFor(pos, false)) and states the rule. Read every position through it: source.offset, a new source.line used for operation startLine/endLine and invocation line, and functionKey (the call-lookup key, also used by endpoints.go and mounts.go through the same function, so those files need no edit).
3. project.go: locate the type-error summary through sourcePosition, so the diagnostic names a scanned file and its real line.
4. outline.go: read symbol lines through sourcePosition, so a Code link opens the real line.
5. docs/scanners/go/index.md: one sentence in Source and evidence saying positions and lines are those of the file as written and //line directives are ignored.
6. Not changed: syntax-error text of a failed scan comes from go/parser and keeps Go's own wording and positions; it is a failure message, not evidence or a key.
7. Tests (test-bun/go-scanner.test.ts, one new concurrent test with its own temp module, no fixture change because the shared go-module fixture has exact file lists in other tests):
   - Rule: evidence positions describe the file as written. Authority: the two reproduced failures in this task; the outline and diagnostic are the same rule on the worker's other two position readers, reproduced in step 1.
   - Wrong results caught: a function holding a //line directive throws GO_SOURCE_INVALID or reports a range other than its real lines; calls to two functions behind the same //line file name both resolve to the second; a call line, the type-error diagnostic and an outline line follow the directive.
   - Gap: no existing test or fixture contains a //line directive.
8. Verify: build the worker into scratch, rerun the audit probes go3, go5 and go4b, then GROMA_TEST_GO=$(command -v go) bun test --timeout 20000 test-bun/go-scanner.test.ts.

9. Cold review, accepted point: the sourcePosition comment says every position is read there, but the text of a syntax error is written by go/parser and still follows the directive. Add one clause naming that exception. No behavior change, no test change.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. Rule owner: sourcePosition in plugins/scanners/go/worker/evidence.go returns Go's unadjusted position; source.offset, the new source.line (operation startLine/endLine, invocation line) and functionKey (call, route-handler and mount lookup) read through it, as do the type-error summary in project.go and the outline's symbol lines in outline.go. No FileSet.Position call remains in the worker (grep 'Position(' shows only sourcePosition uses). endpoints.go and mounts.go needed no edit: they key through functionKey. Guide: one sentence in Source and evidence.
Test: one new concurrent test in test-bun/go-scanner.test.ts ('Go reports positions in the file as written, whatever //line directives say'). Seen failing before the fix, one assertion at a time while the fix was applied in steps: scan threw GO_SOURCE_INVALID (endLine before startLine); then First() resolved to other.go; then call line 1 instead of 5; then the diagnostic named grammar.y line 1; then the outline line was 1 instead of 4.
Verification: worker built from the working tree into scratch (go build with the flags of build.ts, go 1.27.1); audit probes: go5 Weird lines 5..8 (was 5..2 and a thrown scan), go3 calls resolve to A and B (were both B), go4b all five modules scan (was GO_SOURCE_INVALID for the whole repository). GROMA_TEST_GO=$(command -v go) bun test --timeout 20000 test-bun/go-scanner.test.ts: 12 pass. gofmt -l lists only project.go, which is not gofmt-formatted at HEAD either; go vet clean.
Not changed: the text of a syntax error that fails a scan comes from go/parser and keeps Go's adjusted position; it is a failure message, not evidence or a key.

Cold review: accepted as ready with one comment clause. Applied: the sourcePosition comment now names the one exception, the text of a syntax error, which go/parser writes with the directive's position. No behavior or test change. Re-verified after the review round: the TASK-592.4 state alone (HEAD plus scratch task-592.4.patch) builds and vets, keeps functionKey reading the real position, and gives go3 calls to A and B and go5 Weird 5..8; TASK-592.5 on top deletes functionKey. Full Go test file 13 pass.

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines. Go suite with the toolchain: `GROMA_TEST_GO=$(command -v go) bun test --timeout 20000 test-bun/go-scanner.test.ts`, 13 pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Go `//line` directives rename positions for compiler messages; evidence describes the file as written. Every position the worker reports or keys on is now read through `sourcePosition` in `evidence.go`: operation line ranges, invocation lines, the missing-package diagnostic and outline symbol lines. A function with a directive in its body scans with its real line range, and calls resolve to the function they name when two files share a directive file name. Verified by a test whose five assertions each failed for their own reason, the audit probes, byte-identical output on the repository fixtures, and a cold review. The one position that still follows a directive is the text of a go/parser syntax error, which is a failure message, not evidence.
<!-- SECTION:FINAL_SUMMARY:END -->
