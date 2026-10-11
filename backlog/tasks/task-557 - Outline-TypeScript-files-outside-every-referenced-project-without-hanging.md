---
id: TASK-557
title: Outline TypeScript files outside every referenced project without hanging
status: Done
assignee:
  - '@claude'
created_date: '2026-10-07 22:34'
updated_date: '2026-10-07 22:55'
labels: []
dependencies: []
references:
  - plugins/scanners/typescript/src/structure.ts
modified_files:
  - plugins/scanners/typescript/src/structure.ts
  - test/fixtures/typescript-outline-solution/tsconfig.json
  - test/fixtures/typescript-outline-solution/tsconfig.app.json
  - test/fixtures/typescript-outline-solution/src/inside.ts
  - test/fixtures/typescript-outline-solution/outside.ts
  - test-bun/code-outline.test.ts
  - plugins/scanners/typescript-outline.ts
type: bug
ordinal: 640000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
groma export and the web map hang on a repository whose root tsconfig.json is a solution config (files: [] with references), as Nuxt 4 and Vite templates generate, when a TypeScript file belongs to no referenced project (for example a root config file such as playwright.config.ts). The outline hook asks the native SDK for the file's default project; typescript 7.1.0-dev.20260924.1 and 7.1.0-dev.20261007.1 panic there (nil pointer in configFileRegistryBuilder.acquireConfigForFile), and the async API promise never settles, so core never receives an error and the export never finishes. Reproduced on FunstageGmbH/Buzzinga-web (Nuxt 4) and on a four-file project with no framework. The outline contract asks hooks to parse source only, without project tools.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The TypeScript outline of a file outside every project referenced by a solution tsconfig returns its declarations instead of hanging.
- [x] #2 The outline reads only the requested sources: no tsconfig project selection, dependencies or other project files.
- [x] #3 Existing TypeScript outline declarations and visibility are unchanged.
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
1. structure.ts: build one program from the requested files only (noLib, no types, noResolve) and read each source from it, instead of a project snapshot and getDefaultProjectForFile. This follows the outline contract (parse source only) and never asks the SDK to choose a project.
2. Test (test-bun/code-outline.test.ts): rule = outline contract plus the reproduced hang; incorrect result = export never finishes (test timeout) or no declarations for a file outside the referenced projects; gap = the existing fixture uses a plain tsconfig. Smallest test: a solution tsconfig referencing src/ and an outlined root file outside it.
3. bun run check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: readCodeStructure parses only the requested files in one program (noLib, no types, noResolve) instead of a project snapshot. The new solution-tsconfig test times out on the previous code (tsgo panic, promise never settles) and passes with the change. On FunstageGmbH/Buzzinga-web all 115 TypeScript-outlined files return in 0.32 s (76 with declarations); the previous hook never finished.

bun run check: Biome 1 pre-existing warning (test-bun/execution-evidence.test.ts), typecheck pass, Node 16/16, Bun 753 pass / 51 skip / 23 fail; all 23 failures are Java, COBOL, Scala and Swift tests that need toolchains absent on this machine (no Java runtime or jar, no SwiftParser module), none in TypeScript, Vue or core. Cold simplicity review: no structural findings; applied its stale typescript-outline.ts header, kebab-case test coverage, redundant reference guard, duplicate comment, unneeded allowJs/noEmit, fixture strict flag, vueResolution name and docs wording. After those edits: Biome on changed scanners and tests clean except pre-existing infos, typecheck pass, vue-scanner + code-outline + nested-scanners 34/34 pass (max-concurrency 1, as in bun run check). End to end on a FunstageGmbH/Buzzinga-web clone with both rebuilt scanner packages and groma 0.6.6: scan completes, groma export finishes in 2.3 s (previously never finished), and the map gains GameSectionNavigationButtons -> GameListLoggedIn/GameListLoggedOut (navigateNext, navigatePrevious) and GameSectionHeader -> GameSectionLoggedIn (selectTab). Isolation check: a file beside a tsconfig with an invalid target and a missing extended base, importing an uninstalled package, outlines its function.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The TypeScript outline hook now parses only the requested files in one native program (no library, types or module resolution) instead of asking the SDK for each file's default project, which panicked and never answered for a file outside every project of a solution tsconfig. Verified by a new solution-tsconfig test that times out on the previous code, the unchanged outline rules test, an isolation check against an invalid tsconfig, and Buzzinga-web: 115 files outline in 0.32 s and groma export finishes in 2.3 s.
<!-- SECTION:FINAL_SUMMARY:END -->
