---
id: TASK-682
title: Stop the TypeScript scanner before a project runs the machine out of memory
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-24T07:48:00Z'
updated_date: '2026-11-24T08:09:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/typescript/src/source-analysis.ts
modified_files:
  - plugins/scanners/typescript/src/source-analysis.ts
  - test-bun/typescript-memory.test.ts
  - docs/scanners/typescript/index.md
  - plugins/scanners/typescript/src/program-memory.ts
  - groma/systems/groma-md/containers/cli/components/typescript-src-index.md
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

3. Tests in test-bun/typescript-memory.test.ts, a file of their own: one of them counts the compiler programs created, and a second spy on that method beside the program lifetime test in typescript-workspace.test.ts could interfere when tests overlap. Supported rule and authority: the owner requires that a scan cannot run the machine out of memory and approved failing the TypeScript scanner with a clear message. Wrong results the tests detect: a project too large by its own files is compiled anyway, which is the step that takes most of the compiler's memory; a project that grows past the limit only through imports is analysed to the end. Gap: no existing test has a project near any memory limit. Smallest tests: one scan whose only root is one byte larger than largestProgramSource(), expecting the failure and no compiler program; one scan whose root is small and imports a file of that size, expecting the failure to name that project. The files have real sizes for the machine the tests run on, so nothing global is faked and the tests stay parallel safe.

4. Verify on throwaway copies: a project past the limit by its roots stops at once, one past it by imports stops after compiling, and a scan within the limit writes the same observations as main.

5. docs/scanners/typescript/index.md states the limit. Run bun run check and the readability review. The scanner package version stays 0.2.6, which is not published yet (npm has 0.2.4).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measurements, 2026-11-24, on a 32 GB machine. Memory is each process's footprint, read from the kernel every 30 ms while marks printed by the scanner name the step. For one program of 3,320 files (18 MB of source) the compiler process grew from 0.5 to 1.9 GB during the 0.2 s in which the program is created and reached 2.3 GB while symbols are read; the scanner process grew over the following nine seconds to 2.2 GB. A watcher cannot react within the compile step, and the compiler is a separate process, so the rule judges a project by its source size. Highest memory of both processes together per byte of source, one large program each: 250 (this repository's src copied ten times, 18 MB), 258 (copied twenty times, 36 MB), 254 (another repository's src copied eight times, 21 MB), 184 (a third repository, two packages copied four times, 19.5 MB). In that third repository a project of 4 root files held 275 selected files once compiled, so root files alone do not give a program's size; that is why the program is measured again after it is compiled.

Verification, 2026-11-24. With the scanner alone over one fixed tree, the observation is byte-identical with and without the change (same SHA-256) and the time is the same (1.8 s, three runs each). A project of 13,280 loose files (72.7 MB) stops before it is compiled; with the real scan command the report reads: typescript: stopped, the files outside every tsconfig.json (13,280 files) would take about 17.7 GB of memory, more than the 16 GB a scan may take of this machine's 32 GB (saved scanner data kept). That scan ended in 2.6 s, the other scanners' results were written (refreshed 10) and no stored record changed. A project with one root file that imports those 13,280 files passes the first measure, is compiled (compiler 6.9 GB, scanner 1.7 GB for about four seconds) and then stops with the same message naming scale/tsconfig.json (13,287 files). Each new test fails when its check is removed: without the measure before compiling the first test fails because a program is created; without the measure after compiling the second test fails because the scan succeeds. bun run check passes (953 Node tests, 1,020 Bun tests). The readability gate reports nothing in the changed lines.

Limits. A project that passes by its own files and grows past the limit only through imports is compiled before it stops, which takes about half of the memory the whole analysis would; such a project several times over the limit can still exhaust the machine during that compile. The machine's memory is what the operating system reports, so a container with a lower limit than its host is not seen. The factor of 250 belongs to this analysis and has to be measured again when the analysis or the compiler changes. Other scanners are not changed.

Review round, 2026-11-24: one review with the full context and the automated review on the pull request, both on the first commit. Changes made. The tests' fixture folder was named groma-ts-memory-, so any error that prints the repository path held the word the tests look for; it is groma-ts-large- now. The measure after compiling counted characters while the measure before compiling counts bytes, so a file with text outside ASCII counted less after compiling; both count bytes now, the unit the factor is measured in. The message says 'one project may take', because the limit is per project, and the measure after compiling names itself 'with imported files', because its file count includes them. The rule moved from source-analysis.ts into plugins/scanners/typescript/src/program-memory.ts, so the memory rule has one findable home and the tests import the limit from it; the scan made a stand-alone component for the new file, combined into typescript-src-index with groma edit. Messages from the real scan command after these changes: typescript: stopped, the files outside every tsconfig.json (13,280 files) would take about 17.7 GB of memory, more than the 16 GB one project may take of this machine's 32 GB (saved scanner data kept); and for the project that reaches the files through imports: typescript: stopped, scale/tsconfig.json with imported files (13,287 files) would take about 17.9 GB of memory, more than the 16 GB one project may take of this machine's 32 GB (saved scanner data kept). Both tests still fail when their measure is removed, a rescan of the worktree changes no further record, and bun run check passes again (953 Node tests, 1,020 Bun tests). Left as it is: the two measures, the factor of 250 and the share of half, the exported limit with files of real size in the tests, and counting an unreadable file as nothing.
<!-- SECTION:NOTES:END -->
