---
id: TASK-592
title: Fix the scan failures and wrong evidence found by the scanner audit
status: Done
assignee: []
created_date: '2026-10-11 16:51'
updated_date: '2026-10-13 18:43'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/127'
type: bug
ordinal: 657000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue 127 showed that one Java source line can stop a whole project from scanning. On 2026-10-11 four read-only audits ran every official scanner on probe projects, public corpora and fuzzed files, about a million operation nodes, looking for the same class of defect. No other scanner can emit a duplicate operation id. The audits did find the defects tracked by the subtasks: sources that the language toolchain accepts but that fail the scan, and evidence that is wrong without any error. Each subtask carries its own reproduction.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each subtask is Done, or closed with the recorded reason why no change is right.
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
1. Audit every official scanner for sources that fail a scan or yield wrong evidence, proving each finding with a real scan of a probe project.
2. Track each reproduced defect as one subtask with its reproduction and acceptance criteria.
3. Fix each subtask in its own scanner with a regression test that fails before the fix.
4. Give each fix a cold review by a reader without the history, and apply what would mislead a maintainer.
5. Verify the combined tree with the repository check and the toolchain-gated suites.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Subtasks 592.1 to 592.6 and 592.8 to 592.13 are Done; each records its reproduction, review and verification. 592.13 was added during the work: fixing 592.1 exposed a second way for the Java worker to emit one operation id twice.

Subtask 592.7 (keep both symbols when a TypeScript name is a value and a type) was closed without a code change by the owner decision of 2026-10-13. Reason: nothing reads a file symbol kind today, and reporting both kinds makes core write that file Code link without its symbol on a fresh scan, because core names a symbol only when the file has exactly one symbol entry. A proper fix needs core to count distinct names, which would also change Code links for Scala class and companion files.

Two audit findings needed no task: the Angular shared templateUrl result is correct evidence, and two contrived Scala file name collisions fail loudly and would need an id format or protocol change. Two COPY statements on one COBOL line fail inside the unmodified third-party engine; the COBOL guide states the limit.

Verification of the combined tree: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail); with their toolchains, Go 13 pass, Rust 23 pass, C# 9 Bun tests and 31 xunit tests pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
An audit of every official scanner, started by GitHub issue 127, found twelve reproduced defects where one source construct failed a whole language scan or produced wrong evidence without an error. All twelve are fixed in their scanners (Java twice, NASM, Angular, Go twice, COBOL, JavaScript, Scala, Rust, Python with PHP, C#), each with a regression test and a cold maintainability review. One finding, TypeScript value and type symbols, was closed without change because the lost information has no reader and the fix would change Code links. Follow-ups named in the subtasks are not tracked as tasks: the C# endpoint handler lookup, the shared build entry reader path spelling, two Go mount cases, the NASM guide counts for Cityssembly, and releases of the scanner packages.
<!-- SECTION:FINAL_SUMMARY:END -->
