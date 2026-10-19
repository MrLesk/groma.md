---
id: TASK-592.3
title: Report an Angular source file once when two listed paths name it
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:51'
updated_date: '2026-10-13 18:43'
labels: []
dependencies: []
references:
  - plugins/scanners/angular/src/project.ts
  - plugins/scanners/angular/src/scan.ts
documentation:
  - docs/scanners/angular/index.md
modified_files:
  - test-bun/angular-scanner.test.ts
  - plugins/scanners/angular/src/project.ts
  - plugins/scanners/angular/src/scan.ts
parent_task_id: TASK-592
type: bug
ordinal: 660000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On a case-insensitive disk (the macOS and Windows defaults), a repository whose index tracks two paths that differ only by case, such as `src/Foo.ts` and `src/foo.ts`, fails the Angular scan with "duplicate file path: src/Foo.ts". Both listed paths enter the own-file set of a program (`project.ts`), TypeScript resolves them to one source file, and `scan.ts` pushes that file once per listed path. The TypeScript, React and Vue scanners report the file once in the same situation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A source file that two listed paths name is reported once and the scan succeeds.
- [x] #2 Its operations and calls are reported once.
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
1. Owner of the rule: angularPrograms in plugins/scanners/angular/src/project.ts, which decides the program that owns each listed source. One source has one owner however many listed paths name it. Each program keeps its owned sources as a set of the compiler's sources (asked with getSourceFile), never a list of paths, and a listed path that no config includes is skipped when the source it names already has an owner.
2. Both parts are needed, each for a reproduced failure: the set covers two spellings that no config includes (they compile together in the default-options program); the skip covers a second spelling of a source that a config includes, which otherwise joins the first program that reads it, the owner itself (audit probe ng3) or an application that imports it from a sibling library (scratch probe e, still failing with the set alone). The set alone only prevents a repeat inside one program, because each program has its own ts.SourceFile objects.
3. Reported spelling: the owning program's name for the source, which is the config's (disk) spelling when a config includes it, otherwise the importing program's, otherwise the first listed one. The AngularProgram type states this. In the audit probe ng3 and the five scratch probes it equals the spelling the TypeScript scanner reports. That is an observation for those layouts, not a general guarantee; see the known limit in item 8.
4. AngularProgram.owned is a ReadonlySet of sources, so the type says each source is owned once and scan.ts reads the set directly.
5. Test decision (one new test in test-bun/angular-scanner.test.ts, existing workspace helper, no new fixture directory):
   - Rule and authority: a source that two listed paths name is reported once with its facts once; authority is the reproduced failure in this task (duplicate file path) and acceptance criteria 1 and 2.
   - Wrong result caught: the scan throws duplicate file path, or reports files, operations or calls that differ from a listing that names each source once.
   - Coverage gap: no Angular test hands the scanner two paths for one file. Smallest test: one workspace with a library component that an application imports (a config includes it, another program reads it first) and one source no config includes; both get a second spelling in the Git index (the disk cannot hold both); the scan of that listing must equal the scan of the listing without the second spellings. On a case-sensitive disk the listing drops the absent second paths, so the test is real on macOS and Windows and compares a scan with itself on Linux.
6. Verify: audit probes ng3 and ng2 and scratch probes before and after; test-bun/angular-scanner.test.ts and test-bun/angular-http.test.ts, biome lint on the changed TypeScript, bun run typecheck.
7. No guide change: docs/scanners/angular/index.md does not describe the failure, and the result matches what it already says about each project reporting its own sources.
8. Known limit, outside this task: when a program other than the owner imports the source by the second listed spelling (for example ../../../libs/ui/src/panel while the disk and the library's config say Panel.ts), the scan succeeds, but the file is reported under both spellings with its operations split between them, while the TypeScript scanner reports one spelling. The cause is that an operation is named by the file name of the program that reads it (Evidence.operationId in evidence.ts), not by its owner's name. A fix needs a new naming rule for operations, so it is not part of this task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in plugins/scanners/angular/src/project.ts (angularPrograms, programWithOwnedSources): each program keeps its owned sources as a set of compiler sources, and a listed path that no config includes is skipped when a program already owns the source it names. AngularProgram.owned is a ReadonlySet, which plugins/scanners/angular/src/scan.ts reads directly. Guide unchanged.

Correction history:
- The first version only made the owned list distinct per program. The audit probe ng3 then passed, but a workspace where an application imports a doubly listed library source still failed with duplicate file path (scratch probe e), because the second spelling joined the first program that reads the source, not the program that owns it. The final version adds the skip for a source that already has its owner.
- An earlier plan said the reported spelling matches the TypeScript scanner with no extra rule needed. That holds for the audit probe ng3 and the five scratch probes only. The cold review built a layout where it does not hold, recorded as a known limit below.

Cold review (no blocking findings; both parts of the fix confirmed necessary in scratch copies: with the set only the cross-program layout still throws, with the skip only the no-config layout still throws). Accepted clarifications applied:
- The AngularProgram type states the reported spelling: the owning program's name, which is the config's spelling when a config includes the source, otherwise the importing program's, otherwise the first listed one.
- The helper is named programWithOwnedSources, which reads as construction.
- The comment at the skip says why both parts exist: the set only prevents a repeat inside one program, and each program has its own ts.SourceFile objects.
- AngularProgram.owned is a ReadonlySet; the array copy in project.ts and the second set in scan.ts are gone.
- The new test's comments say that the application's config comes first only because apps/ sorts before libs/, and that on a case-sensitive disk the test compares a scan with itself.

Known limit, outside this task, no code: when a program other than the owner imports the source by the second listed spelling (review layout v2b: ../../../libs/ui/src/panel, disk Panel.ts), the scan succeeds but reports libs/ui/src/panel.ts and libs/ui/src/Panel.ts with the operations split between them (3 files, 4 operations), while the TypeScript scanner reports one spelling. An operation is named by the file name of the program that reads it (Evidence.operationId in evidence.ts). Per the review, HEAD was worse for this layout. A fix needs a new naming rule for operations.

Verification on macOS (case-insensitive disk), repeated after the review changes:
- Before the fix: bun run.ts angular ng3 prints THROW duplicate file path: src/Foo.ts. After: OK files=1, src/Foo.ts once.
- Scratch probes a to e (config includes the file with disk spelling upper or lower; no config includes it; library source imported by an application): the observation of the two-path listing is JSON-equal to the observation of the one-path listing in all five. Probes a to d hold a component, an output binding and an HttpClient request (4 operations, 2 invocations, 1 request, each once); probe e holds plain functions.
- New test 'Angular reports a source once when the listing names it by two paths' fails at HEAD (duplicate file path: libs/ui/src/Item.ts), fails with the skip removed (same error) and fails with the owned sources kept as a list (duplicate file path: tools/Seed.ts); passes with the change.
- bun test --timeout 20000 test-bun/angular-scanner.test.ts test-bun/angular-http.test.ts: 15 pass, 0 fail. bunx biome lint on the three changed files: clean. bun run typecheck: clean.
- Not verified here: Windows and Linux runs of the new test.

Assessment only, no change: two components that name one templateUrl get one handler operation in the template file and one invocation per parent binding. Both invocations are true, each carries its own event attribute position, core keeps both claims without a conflict, and the guide's rule for an emit in a child's own template describes this result.

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
On a case-insensitive disk two listed paths can name one TypeScript source, and the Angular scan failed with "duplicate file path". `angularPrograms` in `project.ts` now gives each source one owner: owned sources are a set of compiler sources, and a listed path whose source another reading program already owns is skipped. The file, its operations, calls and requests are reported once. Verified by a test whose two-spelling scan must equal the one-spelling scan (it fails with either half removed), five probe layouts including an Nx style workspace, and a cold review with eleven further layouts. Known limit, not caused by this change: when another program imports the file by its second spelling, it is still reported under both spellings, because an operation is named by the reading program. The shared `templateUrl` report from the audit was assessed and is correct evidence; nothing changed for it. Windows and Linux runs of the new test are unverified locally (on Linux it compares a scan with itself).
<!-- SECTION:FINAL_SUMMARY:END -->
