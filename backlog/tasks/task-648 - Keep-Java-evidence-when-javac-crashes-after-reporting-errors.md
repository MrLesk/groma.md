---
id: TASK-648
title: Keep Java evidence when javac crashes after reporting errors
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 14:47'
updated_date: '2026-11-03 14:55'
labels: []
dependencies: []
references:
  - plugins/scanners/java/java/md/groma/scanner/Main.java
documentation:
  - docs/scanners/java/index.md
modified_files:
  - test-bun/java-scanner.test.ts
  - plugins/scanners/java/java/md/groma/scanner/Main.java
  - docs/scanners/java/index.md
type: bug
ordinal: 706000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On a real Gradle multi-module repository (an Ataccama RDM module, 691 main sources) `groma scan` fails the whole Java scan with "JAVA_SCAN_FAILED: java.lang.IllegalStateException: java.lang.NullPointerException: Cannot invoke \"com.sun.tools.javac.code.Type.getTypeArguments()\" because \"<local8>\" is null", and every other project in the same worker run loses its evidence too. The crash is inside javac (`Types.sideCast` while checking a cast in `Attr`), reached because the scanner loads no dependencies and keeps attributing after unresolved names. Minimal pair: `interface I<T extends I> extends Unknown {}` and `abstract class B<T extends I> { void f() { Object o = (T) this; } }`. The javac command line crashes the same way, but it hides a crash once it has reported errors and prints only those errors; `-XDdev` shows the exception. Each file alone scans.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A project in which javac crashes while attributing one class after reporting errors still yields its observation, and a class javac attributes after the crashing one keeps its resolved calls.
- [x] #2 The observation carries a warning diagnostic that javac stopped attributing a class, with the crash message.
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
1. Reproduce with a worker built from the repository sources: the pair `I.java` (`interface I<T extends I> extends Unknown {}`) and `B.java` (`abstract class B<T extends I> { void f() { Object o = (T) this; } }`) fails with the `Types.sideCast` NullPointerException.
2. Fix in `analyze` of plugins/scanners/java/java/md/groma/scanner/Main.java, which calls `task.analyze()` once. javac removes each class from its queue before attributing it, so after a crash `task.analyze()` continues with the classes still queued. Retry while javac has reported errors, as javac itself treats a crash after errors as their consequence; record one warning per crash; rethrow a crash without reported errors. Bound retries by the number of top-level type declarations, since each retry passes at least the class that crashed. Per-class `analyze(classes)` was rejected: its filter drops the classes it deferred when a class crashes.
3. Docs: docs/scanners/java/index.md, the evidence section, states that a class javac crashes on keeps only the bindings attribution reached.
4. Verify: the new test fails before and passes after; bun test on test-bun/java-*.test.ts; bun run check; the original RDM module and the full MDM repository scan through the rebuilt package.

Test decision (one new test in test-bun/java-scanner.test.ts):
- Rule and authority: a javac crash after reported errors must not stop the Java scan; reproduced failure in this task, acceptance criteria 1 and 2.
- Wrong result it catches: the worker exits with the NullPointerException and the project yields no observation; or classes queued after the crashing one stay unattributed, so their private calls are unresolved; or the crash leaves no diagnostic.
- Coverage gap: no Java test makes javac crash. Smallest test: the minimal pair plus a later file with a private call, run through the worker as the modular-project test does, checking that the call resolves and a crash warning is reported.
- Criterion "a crash without reported errors still fails" is not tested: no known javac crash on valid source exists to reproduce it.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced: the new test failed on main with the `Types.sideCast` NullPointerException wrapped in IllegalStateException.

Finding: javac's `Trees.getElement` attributes a still-unattributed class on demand, so catching one crash without retrying already resolves calls in later classes. A second crashing class then crashes inside that on-demand attribution, during the scanner's own tree pass, and fails the project. The test therefore has two crashing classes: it fails on main and on a catch-without-retry variant, and passes with the retry. Identical crash warnings merge in the observation, so the test checks for one warning.

Changed: `attribute` in Main.java retries `task.analyze()` after a crash while javac has reported errors, records a `JAVA_ATTRIBUTION_CRASHED` warning with the crash message, rethrows a crash without reported errors, and bounds retries by the number of top-level type declarations. The Java guide describes the warning next to the other compiler diagnostics.

Verified: rdm-web-server/rdm-main (691 main sources) scans with the rebuilt worker (9146 operations, one crash warning). A package built from TASK-647 plus this change scans the whole MDM repository through `groma scan` in about 19 s. `bun run check`: Biome, scrollbar lint, typecheck and the Node suite pass; the Bun suite has 939 pass, 64 skip and 6 fail, all six Swift scanner tests failing with `no such module SwiftParser` because this machine has only the Command Line Tools. No `groma/` file changed.

Not tested: a crash without reported errors still fails the scan (acceptance not claimed for it); no known javac crash on valid source reproduces it.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
javac can crash in attribution after reporting errors (here `Types.sideCast` on a cast to a type variable bounded by an interface with an unresolved supertype); the javac command line hides such crashes, but the worker failed the whole Java scan. `Main.attribute` now retries `task.analyze()`, which resumes after the class that crashed, and reports a `JAVA_ATTRIBUTION_CRASHED` warning; a crash without reported errors still fails. Verified by a regression test with two crashing classes that fails on main and on a no-retry variant, by scanning the original 691-file module, and by a full scan of the MDM repository together with TASK-647. Not included: a release of the Java scanner package.
<!-- SECTION:FINAL_SUMMARY:END -->
