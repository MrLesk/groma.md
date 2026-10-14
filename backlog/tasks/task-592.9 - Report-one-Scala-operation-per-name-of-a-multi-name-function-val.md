---
id: TASK-592.9
title: Report one Scala operation per name of a multi-name function val
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:52'
updated_date: '2026-10-13 18:43'
labels: []
dependencies: []
references:
  - >-
    plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Operations.scala
documentation:
  - docs/scanners/scala/index.md
modified_files:
  - test/fixtures/scala-parse/Operations.scala
  - test-bun/scala-scanner.test.ts
  - >-
    plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Operations.scala
  - docs/scanners/scala/index.md
parent_task_id: TASK-592
type: bug
ordinal: 666000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`val a, b = (x: Int) => x` defines two function values. The Scala worker names the operation of a function-valued `val` from its first pattern only (`valName` in `Operations.scala` uses `collectFirst`), so `a` gets an operation and `b` gets none, and calls to `b` have no target. This is the mirror image of the Java defect in issue 127.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each name of a function-valued `val` is an operation with its own id.
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
Research (worker built from the current source with the plugin's own build script, unmodified):
- `val a, b = (x: Int) => helper(x)` in `object Shop` yields one operation `Shop.a` and none for `Shop.b`. The file symbols and the outline already report one function per name (`Symbols.scala` and `Outline.scala` collect every `Pat.Var`); only `Operations.valName` takes the first pattern.
- A pattern definition such as `val (c, d) = (f, g)` yields no operation, symbol or outline row: its right side is a tuple, not a function literal, so `Stats.functionValueRhs` is false. That is the existing abstention for a value that is not a function literal. It is not the same defect and stays.
- The Scala worker resolves no call: every invocation is emitted with `targets: []` and `unresolved: true` (`Scan.scala`), the guide states it ("Calls remain unresolved because syntax alone cannot prove their runtime targets") and the existing test asserts it for every invocation. A call `b(2)` is an unresolved invocation with member `b` before and after, exactly like `a(1)`. The second half of acceptance criterion 1 ("a call to either name resolves to it") therefore has no mechanism in this scanner. Adding call resolution is a new concept and is not done here. Reported to the orchestrator.

Approach:
1. `Operations.scala`: the function-valued `val` case adds one operation for every name the `val` binds. `valName` (first pattern, `Option`) becomes `valNames` (every pattern, `List`) with a comment that states the rule and its reason. All names keep the definition's start position; a comment on `addOperation` states that the name is what keeps such ids distinct.
2. `docs/scanners/scala/index.md`: one sentence, a `val` that binds several names to a function literal is one operation for each name, all at the position of that definition.
No other worker file changes: `Symbols.scala` and `Outline.scala` already report one entry per name.

Test decision (one test changed, none added):
- Rule and authority: each name bound by a function-valued `val` is an operation. Authority: the failure reproduced in this task.
- Wrong result it catches: the operation list of the fixture file lacks the second name because only the first pattern is named.
- Coverage gap and smallest test: `test/fixtures/scala-parse/Operations.scala` has only the single-name `val fn`; `verifyInventory` in `test-bun/scala-scanner.test.ts` already asserts that file's complete operation names. Make that `val` bind two names and add the second name to the expected list. Distinct ids need no assertion of their own: the scan goes through `parseScanObservation`, which rejects a duplicate operation id.
- No call assertion: a call to the second name is reported the same way before and after the change, so such an assertion could not fail on the defect.

Verification: rebuild the worker from source, compare scan and outline output of the probes before and after, run `bun test --timeout 20000 test-bun/scala-scanner.test.ts`, `bunx biome lint test-bun/scala-scanner.test.ts`, `bun run typecheck`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced on a worker built from the unmodified source (`buildWorker` from `plugins/scanners/scala/build.ts`, system Java 25): `val a, b = (x: Int) => helper(x)` in `object Shop` gave one operation `Vals.scala#Shop.a@30` and none for `b`; the same for `private val g, h: Int => Int = _ + 1` and a top-level `val top, level = ...`.

Change: `Operations.valNames` returns every name of the `val` (was `valName`, first pattern only). With the rebuilt worker the same probe gives `Vals.scala#Shop.a@30` and `Vals.scala#Shop.b@30` (also `g`/`h`, `top`/`level`): distinct ids, shared definition position, accepted by `parseScanObservation`. Compared with the unmodified worker over the probes and the `scala-parse` and `scala-outline` fixtures: file symbols equal, outline output byte-identical, no operation or invocation removed, added operations are exactly the second names, added invocations are the calls inside their bodies (each name is its own function value with the same body).

Pattern definitions: `val (c, d) = (f, g)` produces no operation, symbol or outline row before and after (right side is a tuple, not a function literal). Unchanged on purpose.

Calls: unchanged. `Shop.run` calling `a(1) + b(2)` reports unresolved invocations with members `a` and `b` and empty targets, before and after, as the guide documents for every Scala call. The "call resolves" half of acceptance criterion 1 is not implemented; see the plan.

Correction history: the first version moved the name collection into a shared `Stats.functionValueNames` and made `Symbols.scala` and `Outline.scala` use it. That was a consolidation the rule does not need (both already report one entry per name and their output did not change), so `Stats.scala`, `Symbols.scala` and `Outline.scala` are back to their committed text and the worker change is `Operations.scala` only.

Test: `Worker.fn` in `test/fixtures/scala-parse/Operations.scala` now binds `fn, twin`; `verifyInventory` expects `Worker.twin`. Seen failing on the unmodified worker source (expected list had `Worker.twin`, received list did not), passing after the change.

Verification on the final source:
- `bun test --timeout 20000 test-bun/scala-scanner.test.ts`: 1 pass, 0 fail, 34 expect() calls (the test builds the package from the current worker source itself, so no local `dist/` is involved).
- `bunx biome lint test-bun/scala-scanner.test.ts`: no findings.
- `bun run typecheck`: exit 0.

Criterion corrected by the orchestrating session: the original text also required that a call to either name resolves to it. The Scala scanner resolves no call by documented design (every invocation is unresolved because syntax alone cannot prove a runtime target), so that half asked for behavior outside this scanner and was removed.

Cold junior-maintainer review: no blocking findings. Three accepted clarifications were applied by the orchestrating session. (1) `valNames` in `Operations.scala` no longer has a `case term: Term.Name` branch: a node dump with the worker parser shows plain, uppercase and backquoted names all arrive as `Pat.Var`, and `Symbols.scala` and `Outline.scala` match only `Pat.Var`, so the extra branch suggested a name form the other two readers would miss. (2) The comment about names sharing a definition start moved from the `addOperation` doc to the line that builds the id, because it explains the id, not the function. (3) The guide sentence also says the calls in the right side are reported for each name. Verified after these edits: `bun test --timeout 20000 test-bun/scala-scanner.test.ts` builds the worker from source and passes (1 test, 34 expects). The review also ran the core consequence: the calls of a shared right side get one claim key and stay unresolved, so no claim, conflict or relationship changes.

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`valNames` in `Operations.scala` returns every name a function-valued `val` binds, so `val a, b = x => x` is one operation for each name; the names share the definition start and the name in the id keeps them distinct. The calls of the shared right side are reported for each name. Verified by the fixture and test (the second name was missing before), probes for objects, classes, traits, top level, type ascriptions and modifiers, and a cold review that also ran the consequence in core: those calls stay unresolved and produce no claim, conflict or relationship. The two contrived id collisions from the audit (a file name containing `#` with a backticked method name, a line break in a file name) were assessed and left: both fail loudly and would need an id format or protocol change.
<!-- SECTION:FINAL_SUMMARY:END -->
