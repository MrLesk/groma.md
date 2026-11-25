---
id: TASK-647
title: Scan a Java method that javac leaves unattributed
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 14:32'
updated_date: '2026-11-03 14:36'
labels: []
dependencies: []
references:
  - plugins/scanners/java/java/md/groma/scanner/Declarations.java
documentation:
  - docs/scanners/java/index.md
modified_files:
  - test-bun/java-scanner.test.ts
  - plugins/scanners/java/java/md/groma/scanner/Declarations.java
  - docs/scanners/java/index.md
type: bug
ordinal: 706000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On a real Gradle multi-module repository (an Ataccama MDM module, 697 main sources) `groma scan` fails the whole Java scan with "JAVA_SOURCE_INVALID: No observation was produced. ... JAVA_SCAN_FAILED: java.lang.IllegalStateException: Unbound executable declaration", and every other project in the same worker run loses its evidence too. The scanner loads no project dependencies, so a superclass from a sibling module is unresolved. When such a class passes a conditional expression holding an anonymous class to `super(...)`, as in `class X extends Unknown { X(Object d) { super(d == null ? null : new K() { public void m() {} }); } }`, javac error recovery never attributes that anonymous class body, so `Trees.getElement` returns null for its methods and `Declarations.visitMethod` throws. javac accepts the same source once the superclass resolves. The same anonymous class passed directly, inside an ordinary method call, in a field initializer, or with a resolved superclass is attributed and scans.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A source whose unresolved superclass receives a conditional expression containing an anonymous class in `super(...)` scans, and the project keeps its evidence.
- [x] #2 A call inside the unattributed anonymous method is attributed to that method's operation, not to the enclosing constructor.
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
1. Reproduce with a worker built from the repository sources: `class X extends Unknown` whose constructor calls `super(d == null ? null : new K() { public void m() { work(); } })` fails with "Unbound executable declaration".
2. Fix in `visitMethod` of plugins/scanners/java/java/md/groma/scanner/Declarations.java, the only place that requires a method element. A method whose element javac did not bind is still an authored operation: record it under its declared name, without tokens (Tokens needs attributed trees, and an anonymous callback carries none anyway), and skip `operationFor` and entry-point detection, which both need the element. `Uses` already attributes calls by tree identity through `operationAt`, so calls in that body belong to the method.
3. Docs: docs/scanners/java/index.md says every method with a body carries tokens; add that a method javac leaves unattributed carries none.
4. Verify: the new test fails before and passes after; bun test on test-bun/java-*.test.ts; bun run check; the original MDM module scans through the rebuilt worker.

Test decision (one new test in test-bun/java-scanner.test.ts):
- Rule and authority: a source javac attributes with recovery must not stop the Java scan; reproduced failure in this task.
- Wrong result it catches: the worker exits with "Unbound executable declaration" and the project yields no observation; or the call inside the anonymous method is attributed to the constructor.
- Coverage gap: no Java test has an unresolved superclass or an anonymous class in a constructor prologue. Smallest test: write that source over the temporary java-maven fixture, as neighbouring tests do, and check that the call inside the anonymous method has that method as caller.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced: the new test failed before the fix with `JAVA_SCAN_FAILED: java.lang.IllegalStateException: Unbound executable declaration`. Probes narrowed the trigger to an unresolved superclass whose `super(...)` receives a conditional expression containing an anonymous class (resolved or not); the same anonymous class passed directly, in an ordinary method argument, in a field initializer, or with a resolved superclass is attributed.

Changed: `visitMethod` in Declarations.java records a method with no element as an operation named by its declaration, without tokens, and skips `operationFor` and entry-point detection, which need the element. Java guide states that such a method carries no tokens.

Verified: the new test passes on JDK 25. The worker built from this branch scans the original module (mdm-web-server/mda-gwt, 697 main sources, 7702 operations) on JDK 25 and on the packaged JDK 27 runtime; the old worker failed on it. `bun run check`: Biome, scrollbar lint, typecheck and the Node suite pass; the Bun suite has 939 pass, 64 skip and 6 fail, all six Swift scanner tests failing with `no such module SwiftParser` because this machine has only the Command Line Tools, not Xcode. No `groma/` file changed.

Found, not changed (outside this task): in the same repository a pair of files makes javac itself crash inside `task.analyze()` with `NullPointerException` in `Types.sideCast`: `interface I<T extends I> extends Unknown {}` plus `abstract class B<T extends I> { void f() { Object o = (T) this; } }`. The javac CLI with the same sources reports only the missing symbol, so this is a crash on the API path in javac error recovery and still fails the whole Java scan.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
javac error recovery can leave an anonymous class body unattributed: an unresolved superclass whose `super(...)` receives a conditional containing an anonymous class. `Declarations.visitMethod` threw "Unbound executable declaration" for its methods and the whole Java scan failed. Such a method is now an operation under its declared name without tokens, so calls in its body keep it as caller. Verified by a regression test that fails on the old worker, and by scanning the original 697-file module on JDK 25 and the packaged JDK 27 runtime. Not included: a release of the Java scanner package, and the separate javac `Types.sideCast` crash recorded in the notes.
<!-- SECTION:FINAL_SUMMARY:END -->
