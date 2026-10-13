---
id: TASK-592.6
title: Scan COBOL with a short line before the program name
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:51'
updated_date: '2026-10-13 18:43'
labels: []
dependencies: []
references:
  - plugins/scanners/cobol/java/md/groma/cobol/Source.java
  - plugins/scanners/cobol/java/md/groma/cobol/Engine.java
documentation:
  - docs/scanners/cobol/index.md
modified_files:
  - test/fixtures/cobol-source/providers.cob
  - test-bun/cobol-scanner.test.ts
  - plugins/scanners/cobol/java/md/groma/cobol/Source.java
  - docs/scanners/cobol/index.md
parent_task_id: TASK-592
type: bug
ordinal: 663000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A reproduced COBOL source crashes the worker and fails the scan: a line that ends before column 8 (an empty line, or one holding only a sequence number) between `PROGRAM-ID.` and the program name makes `Source.programName` throw "Range [7, 6) out of bounds for length 6". Found by the scanner audit of 2026-10-11.

A second crash from the same audit, two `COPY` statements on one source line ("fromIndex(47) > toIndex(7)"), is thrown inside the unmodified third-party engine (Eclipse COBOL Language Support 2.5.1) and is not part of this task. The COBOL guide states it as a limit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A program whose name follows `PROGRAM-ID.` after a line shorter than 7 characters scans, and its operation id is the offset of the name.
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
1. Reproduce both crashes with full stack traces: a scratch probe class (not in the repository) runs the worker's Engine and Source over the audit probes cb4v3 (short line) and cb4v1 (two COPY on one line).

2. Item 1, short line before the program name. Owner: `Source.programName` in plugins/scanners/cobol/java/md/groma/cobol/Source.java, the one place that locates the PROGRAM-ID name in the original fixed-format lines. Rule: program text starts in column 8, so a physical line that ends before column 8 holds no part of the declaration and is skipped exactly like a comment line. One condition, stated in a comment next to it. No change to Main.java, the worker protocol, the id format or src/index.ts.

3. Item 2, two COPY on one line. The exception is thrown inside the third-party engine (Eclipse COBOL Language Support 2.5.1), with no frame of ours between `engine.analyze` and the throw. No code change: stop the item and report the stack trace, the engine defect and what a fix would take.

4. Test decision for item 1 (one test changed, none added):
   - Rule and authority: a program whose name follows `PROGRAM-ID.` after a line shorter than 7 characters is reported at the offset of its name. Authority: the failure reproduced in this task (acceptance criterion 1).
   - Wrong result caught: the scan rejects with `cobol: Range [7, N) out of bounds for length N` instead of returning the program; a wrong repair would report a different position or line.
   - Coverage gap: test/fixtures/cobol-source only separates a keyword from its name with a comment line (caller.cbl), never with a line that ends before column 8.
   - Smallest change: in the existing fixture providers.cob, put an empty line between `PROGRAM-ID.` and `SECOND.` (that file stays LF in the test; caller.cbl is rewritten with CRLF, where a sequence-number-only line is 7 characters and does not reproduce). In the existing test in test-bun/cobol-scanner.test.ts, the outline line of SECOND moves from 10 to 12 and one assertion checks that SECOND's operation position is the offset of `SECOND.` in the file. No new test function, so no second worker build.

5. Test decision for item 2: no test, because nothing is fixed.

6. Verify: `bun test --timeout 20000 test-bun/cobol-scanner.test.ts` failing before the Source change and passing after it, `bunx biome lint test-bun/cobol-scanner.test.ts`, `bun run typecheck`, then rebuild the local worker with `bun plugins/scanners/cobol/build.ts` and rerun the audit probes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Item 1 (short line before the program name): changed.
- Reproduced with audit probe cb4v3: `java.lang.StringIndexOutOfBoundsException: Range [7, 6) out of bounds for length 6` at `md.groma.cobol.Source.programName(Source.java:33)`. A middle line of the declaration range shorter than 7 characters gave `substring(7, length)`.
- Fix in `Source.programName`: a line that ends before column 8 holds no program text and is skipped by the same condition that skips comment lines (`physical.length() <= 7 || ...`). Nothing else changed in the worker.
- Regression: fixture test/fixtures/cobol-source/providers.cob now has an empty line between `PROGRAM-ID.` and `SECOND.`; the existing test expects SECOND's outline line 12 and its operation position at the offset of `SECOND.`. Before the Source change the test failed at the first scan with `cobol: Range [7, 0) out of bounds for length 0`; after it, 1 pass, 19 expect() calls.
- Probe cb4v3 after rebuilding the local worker (`bun plugins/scanners/cobol/build.ts`): `op "a.cbl:226" name="PROGB" pos=226`, and 226 is the offset of `PROGB` on line 10 of that file. Probes cb1, cb3, cb4v2, cb6, cb7 give the same operations as before; cb5 still stops with its documented PROGRAM-ID in COPY scope error.

Item 2 (two COPY on one source line): not changed, stopped.
- The exception is thrown inside the third-party engine, Eclipse COBOL Language Support 2.5.1 (dist/engine.jar): `java.lang.IllegalArgumentException: fromIndex(47) > toIndex(7)` at `java.util.ArrayList.subList` <- `org.eclipse.lsp.cobol.common.mapping.ExtendedTextLine.clear(ExtendedTextLine.java:162)` <- `ExtendedText.clear(ExtendedText.java:264)` <- `ExtendedText.insert(ExtendedText.java:151)` <- `ExtendedDocument.insertCopybook(ExtendedDocument.java:123)` <- `CopybookPreprocessorService.addCopybook(CopybookPreprocessorService.java:133)` <- `GrammarPreprocessorListenerImpl.exitCopyStatement` <- ... <- `CobolLanguageEngineFacade.analyze`. No frame of Source, Engine or Main lies between `engine.analyze` and the throw; our copybook resolver is not on the stack.
- Cause, read from the upstream source at tag 2.5.1: expanding the first COPY splits its line at the statement start (`ExtendedText.addLineBreak`) and inserts the copybook below the head of the line. `ExtendedDocument.updateLineDueToChanges` then finds the new line of a later statement through the first character of its original line, which stayed on the 7-character head, so the second COPY keeps its old column on a line that is now 7 characters long. Any second COPY that starts on the same physical line as a resolved first COPY fails this way, in scan and in outline mode; a data entry followed by one COPY on a line works.
- 2.5.1 is the newest upstream release and the upstream `development` branch has the same `updateLineDueToChanges`, so no version bump fixes it.
- What a fix would take, each outside this task's limits: (a) an upstream fix of that method and a new engine release, then a version and checksum change in build.ts; (b) shipping a patched copy of the engine's `ExtendedDocument` class, which ends the documented "unmodified engine" packaging and needs an EPL modification notice; (c) rewriting each source so every COPY starts on its own line before the engine sees it, which needs a fixed-format statement splitter (comments, literals, pseudo-text, continuation lines, columns 73 to 80) and a map from rewritten lines and offsets back to the original in Source. None is a few clearly correct lines in the existing owner. Acceptance criterion 2 stays unmet.

Checks: `bun test --timeout 20000 test-bun/cobol-scanner.test.ts` 1 pass; `bunx biome lint test-bun/cobol-scanner.test.ts` clean; `bun run typecheck` clean. `bun run check` not run (the orchestrator runs it once for all lanes).

Scope decision by the orchestrating session: the second reproduced crash (two COPY statements on one source line, "fromIndex(47) > toIndex(7)") is thrown inside the unmodified third-party engine (Eclipse COBOL Language Support 2.5.1, `ExtendedDocument`), with no frame of this scanner between `engine.analyze` and the throw, and the upstream development branch has the same code. A fix needs an upstream release, a patched engine copy, or a source rewriter with offset mapping, none of which is a small correct change here. It was removed from this task (title and criterion 2), and `docs/scanners/cobol/index.md` now states the limit. It awaits a product decision.

Cold junior-maintainer review: no blocking findings. Applied by the orchestrating session: the test comment now states the rule (a line that ends before column 8) instead of "an empty line", because a guard that only skipped blank lines would pass the fixture and still crash on a line holding a 6-character sequence number (the reviewer ran that mutation); the guard reads `physical.length() < 8` to match the comment about column 8, with the same behavior; the guide sentence names the error shape `fromIndex(N) > toIndex(M)` so a bug report can be matched to it; the Description was corrected to the one crash this task fixes. Where earlier notes say acceptance criterion 2 stays unmet, that criterion was removed with the scope decision above. Verified after these edits: `bun test --timeout 20000 test-bun/cobol-scanner.test.ts` passes (1 test, 19 expects).

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`Source.programName` skips a line that ends before column 8 the way it skips a comment line, so a program whose name follows `PROGRAM-ID.` after an empty or sequence-number-only line scans and its position is the offset of the name. Verified by the extended fixture and test (the scan threw before), and by a cold review that ran 104 variations of line lengths, comments and line endings with no regression. Not fixed here: two `COPY` statements on one source line fail inside the unmodified third-party engine (Eclipse COBOL Language Support 2.5.1, also on its development branch); the guide states the limit and it awaits a product decision. Seen and not touched: a name split across a continuation line is reported wrongly, as before.
<!-- SECTION:FINAL_SUMMARY:END -->
