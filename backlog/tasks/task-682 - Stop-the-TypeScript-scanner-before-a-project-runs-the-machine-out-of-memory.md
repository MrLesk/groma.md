---
id: TASK-682
title: Stop the TypeScript scanner before a project runs the machine out of memory
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-24T07:48:00Z'
updated_date: '2026-11-24T07:54:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/typescript/src/source-analysis.ts
modified_files:
  - plugins/scanners/typescript/src/source-analysis.ts
  - test-bun/typescript-memory.test.ts
  - docs/scanners/typescript/index.md
priority: high
type: enhancement
ordinal: 718000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Analysing one TypeScript program takes about 250 bytes of memory for every byte of its source, in the scanner process and the compiler process together. A single very large project, or a project whose roots import many files, can therefore need more memory than the machine has. The scan then freezes the machine or the operating system kills it without a message. The compiler takes most of its memory within a second of creating the program, so the scanner cannot react by watching memory; it has to judge a project by its source size before the costly work. The owner requires that a scan cannot run the machine out of memory and approved a guard that fails the TypeScript scanner with a clear message through the existing scanner failure path, where the other scanners' results are written and the saved TypeScript data is kept.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Before compiling a project, the TypeScript scanner compares the source size of the project's files with the machine's memory and, when the project is too large, fails without creating the compiler program.
- [ ] #2 After the compiler has built a program, the scanner applies the same rule to the selected files the program holds, including the files its roots import, before it reads their symbols.
- [ ] #3 The failure message names the project, its number of files, the memory the analysis would take, and the memory a scan may take on this machine.
- [ ] #4 The failure reaches the scan report through the existing scanner failure path: the other scanners' results are written and the saved TypeScript data is kept.
- [ ] #5 A scan of a project within the limit produces the same observations as before.
- [ ] #6 The memory needed per byte of source is measured on more than one repository, and the measurement is recorded so it can be repeated.
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
1. plugins/scanners/typescript/src/source-analysis.ts states the rule beside analyzeProject. One program's analysis takes about MEMORY_PER_SOURCE_BYTE (250) bytes of memory per byte of its source, and may take MACHINE_SHARE (half) of the machine's memory. largestProgramSource() is the most source one program may hold on this machine, and requireMemoryFor(project, files, sourceBytes) throws the failure message.

2. analyzeProject applies the rule twice, with what is known at each time. Before createProgram it adds up the sizes on disk of the project's root files, so a project too large by its own files is never compiled. After the program's selected source trees are fetched it adds up their text lengths, which include the files the roots import and are known only then. The error leaves through the existing finally blocks (program disposed, compiler closed) and core records it as a scanner failure.

3. Tests in test-bun/typescript-workspace.test.ts. Supported rule and authority: the owner requires that a scan cannot run the machine out of memory and approved failing the TypeScript scanner with a clear message. Wrong results the tests detect: a project too large by its own files is compiled anyway, which is the step that takes most of the compiler's memory; a project that grows past the limit only through imports is analysed to the end. Gap: no existing test has a project near any memory limit. Smallest tests: one scan whose only root is one byte larger than largestProgramSource(), expecting the failure and no compiler program; one scan whose root is small and imports a file of that size, expecting the failure to name that project. The files are real sizes for this machine, so nothing global is faked and the tests stay parallel safe.

4. Verify on throwaway copies: a project past the limit by its roots stops at once, one past it by imports stops after compiling, and a scan within the limit writes the same observations as main.

5. docs/scanners/typescript/index.md states the limit. Run bun run check and the readability review. The scanner package version stays 0.2.6, which is not published yet (npm has 0.2.4).
<!-- SECTION:PLAN:END -->
