---
id: TASK-681
title: Release each TypeScript program when its analysis ends
status: Done
assignee:
  - '@claude'
created_date: '2026-11-23T21:26:00Z'
updated_date: '2026-11-23T21:49:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/typescript/src/source-analysis.ts
modified_files:
  - plugins/scanners/typescript/src/source-analysis.ts
  - test-bun/typescript-workspace.test.ts
priority: high
type: bug
ordinal: 717000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A repository of several TypeScript projects needs the memory of all of them together while it is scanned. The TypeScript scanner creates one compiler program per project and keeps every program, with the source trees fetched for it, until the whole scan ends. On a tree of 4,096 TypeScript files in ten projects the scanner process and the compiler process together reached 4.3 GB; with each program released after its analysis the same scan needed 1.0 GB, in the same time and with the same records. The owner's requirement is that a scan must not run out of memory.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The TypeScript scanner releases each compiler program when that project's analysis ends, before the next project's program is created.
- [x] #2 Scanning the same sources produces the same observations and stored architecture as before.
- [x] #3 Peak memory of the scanner process and the compiler process is measured before and after on a tree of several projects.
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
analyzeProject in plugins/scanners/typescript/src/source-analysis.ts owns the program's life: it creates the program, reads the project's evidence inside a try block and releases the program in the finally block. The evidence is plain data, so nothing uses the program afterwards.

Test. Supported rule and authority: the owner asked that a scan cannot run out of memory and approved releasing each program. Wrong result the test detects: a program still alive when the next project's program is created, which makes memory grow with the number of projects again. Gap: no existing test observes a program's life. Smallest test: one scan of two projects in test-bun/typescript-workspace.test.ts that counts the programs alive at once.

Measure a tree of ten projects before and after on throwaway copies, compare the records written, run the repository check and the readability review. The scanner package version stays 0.2.6, which is not published yet.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification, 2026-11-23. The tree for the measurements is a copy of main at 287740c6 plus ten copies of src under scale/, each with its own tsconfig: 4,085 TypeScript files in 27 configured projects, scanned with the TypeScript scanner alone. Peak memory footprint per process, read from the kernel's lifetime maximum, four runs each: on main the compiler process reached 2.0 to 2.3 GB and the scanner process 0.7 to 2.3 GB, 3.0 to 4.4 GB together; with the change the compiler reached 0.6 to 0.7 GB and the scanner 0.3 to 0.5 GB, 1.0 to 1.1 GB together. Scan time on a quiet machine: 16.5 and 18.5 s on main, 16.8 and 19.4 s with the change. The records written had the same digest in every run. Scanning one fixed tree with main's scanner and with the changed scanner gave byte-identical observations (58,269,385 bytes, SHA-256 starting 1f318da588ff59a2). A first comparison that scanned each scanner's own checkout differed by 194 bytes only because the scanned tree contained the edited file. The new test fails on main with two programs alive at once and passes with the change. bun run check passed: 28 Node tests, 951 Bun tests, 67 skipped, none failing. The readability check reports only two lines of source-analysis.ts that this task does not touch. The evidence read from a program is plain data (files, operations, invocations, HTTP facts, entries), so nothing reads the program after its release. One very large single project is not helped: its program is needed while it is analyzed. No public contract or documentation states how long programs live, so none changed. The TypeScript scanner package stays at 0.2.6, which is not published.

Correction during the work: the first form moved the reading into its own function; the final form keeps one function with a try and finally block, which is a smaller change with the same behaviour. The measurements above were repeated with the final form.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The TypeScript scanner releases each compiler program when that project's analysis ends. A repository of several TypeScript projects now needs the memory of its largest project instead of all of them together: on 4,085 files in 27 projects the peak fell from between 3.0 and 4.4 GB to about 1.0 GB, with the same scan time, byte-identical observations and the same records. One test counts the programs alive at once and fails without the release. A single very large project still needs memory in proportion to its size; that needs a different change.
<!-- SECTION:FINAL_SUMMARY:END -->
