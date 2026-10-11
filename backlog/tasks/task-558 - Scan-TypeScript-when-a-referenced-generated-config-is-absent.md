---
id: TASK-558
title: Scan TypeScript when a referenced generated config is absent
status: Done
assignee:
  - '@claude'
created_date: '2026-10-07 22:36'
updated_date: '2026-10-07 22:55'
labels: []
dependencies: []
references:
  - plugins/scanners/typescript/src/projects.ts
modified_files:
  - plugins/scanners/typescript/src/projects.ts
  - docs/scanners/typescript/index.md
  - test-bun/nested-scanners.test.ts
type: bug
ordinal: 641000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A fresh Nuxt 4 checkout has a root tsconfig.json that only references generated configs in .nuxt/, which exists only after nuxt prepare. The TypeScript scanner follows each reference with stat and throws ENOENT, so the whole TypeScript scan fails and groma keeps the saved scanner data (reproduced on FunstageGmbH/Buzzinga-web in a clean clone). An absent extended base already keeps scanning with a warning; an absent referenced config does not.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A TypeScript scan whose tsconfig references an absent config completes, analyses the remaining source, and reports a warning naming the referencing config.
- [x] #2 Other configuration errors still stop the scan.
- [x] #3 The TypeScript scanner documentation describes absent referenced configs.
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
1. projects.ts: when a referenced config path does not exist, record a typescript-missing-config-reference warning on the referencing config and continue; files it would have owned fall to the other configs or the default options, like files outside every config. Other stat or config errors still throw.
2. docs/scanners/typescript/index.md: state the absent-reference rule next to the absent-base rule.
3. Test (test-bun/nested-scanners.test.ts): rule = the existing fresh-checkout rule for absent generated bases, reproduced failure for references; incorrect result = the scan throws ENOENT and reports no source; gap = only absent extended bases are covered. Smallest test: a solution tsconfig referencing an absent .nuxt config scans its source with one warning.
4. bun run check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: an absent referenced config records typescript-missing-config-reference on the referencing config and is skipped; other stat and config errors still throw. The new test fails with ENOENT on the previous code and passes with the change. FunstageGmbH/Buzzinga-web clean clone without .nuxt/: the scan completes with 115 files and 691 operations (identical to the scan with .nuxt/) plus four reference warnings, instead of failing. Note: the nested-scanners "sibling nested projects" tests time out intermittently at default bun concurrency on the unmodified tree too (pre-existing); bun run check runs them with --max-concurrency 1.

bun run check: Biome 1 pre-existing warning (test-bun/execution-evidence.test.ts), typecheck pass, Node 16/16, Bun 753 pass / 51 skip / 23 fail; all 23 failures are Java, COBOL, Scala and Swift tests that need toolchains absent on this machine (no Java runtime or jar, no SwiftParser module), none in TypeScript, Vue or core. Cold simplicity review: no structural findings; applied its stale typescript-outline.ts header, kebab-case test coverage, redundant reference guard, duplicate comment, unneeded allowJs/noEmit, fixture strict flag, vueResolution name and docs wording. After those edits: Biome on changed scanners and tests clean except pre-existing infos, typecheck pass, vue-scanner + code-outline + nested-scanners 34/34 pass (max-concurrency 1, as in bun run check). End to end on a FunstageGmbH/Buzzinga-web clone with both rebuilt scanner packages and groma 0.6.6: scan completes, groma export finishes in 2.3 s (previously never finished), and the map gains GameSectionNavigationButtons -> GameListLoggedIn/GameListLoggedOut (navigateNext, navigatePrevious) and GameSectionHeader -> GameSectionLoggedIn (selectTab).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
An absent referenced tsconfig, such as the .nuxt configs before nuxt prepare, is skipped with a typescript-missing-config-reference warning instead of failing the TypeScript scan; other config errors still stop it. Verified by a new test that failed with ENOENT before, the existing invalid-options test, and a Buzzinga-web clone without .nuxt (115 files and 691 operations, identical to the prepared checkout). Documented beside the absent-base rule.
<!-- SECTION:FINAL_SUMMARY:END -->
