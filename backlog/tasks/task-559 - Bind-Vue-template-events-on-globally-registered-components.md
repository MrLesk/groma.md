---
id: TASK-559
title: Bind Vue template events on globally registered components
status: Done
assignee:
  - '@claude'
created_date: '2026-10-07 22:43'
updated_date: '2026-10-07 22:55'
labels: []
dependencies: []
references:
  - plugins/scanners/vue/src/evidence.ts
  - plugins/scanners/vue/src/project.ts
modified_files:
  - plugins/scanners/vue/src/project.ts
  - plugins/scanners/vue/src/evidence.ts
  - test-bun/vue-scanner.test.ts
  - docs/scanners/vue/index.md
type: enhancement
ordinal: 642000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Vue templates often use components without importing them: Nuxt 4 registers app/components automatically and unplugin-vue-components does the same, both by declaring them on Vue's GlobalComponents interface (typeof import("./X.vue")["default"]). The Vue scanner resolves a template tag only through an import alias, so every event binding on such a component reports unsupported-vue-binding and no callback relationship is derived. On FunstageGmbH/Buzzinga-web (Nuxt 4) all 20 unsupported bindings are on auto-registered components. The Vue compiler also never loads the generated declarations: a Nuxt 4 root tsconfig.json is a solution config (files: [] with references to .nuxt/tsconfig.*.json), and the Vue scanner reads only the root config's own options and the scanner's tracked files, while the generated .nuxt declarations are Git-ignored.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An event binding to a named handler on a component declared on GlobalComponents produces the same callback invocation as an imported component.
- [x] #2 A Vue package whose root tsconfig.json names no source and references configs compiles through the first referenced config that compiles one of its SFCs, including that config's declaration files; a fresh checkout without the referenced config scans as before.
- [x] #3 The Vue scanner documentation describes globally registered components and solution configs.
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
1. project.ts: readConfig/sourceConfig select the config that compiles the package SFCs: a root config with no source and references compiles through the first existing referenced config that includes one of the package SFCs (React scanner precedent); the root config stays when none exists. Declaration files that config includes are compiler roots even when Git ignores them, so generated GlobalComponents load.
2. project.ts: globalComponents(tag) reads Vue's GlobalComponents (checker module symbol, so augmentations merge) and returns owned SFCs declared as Name: typeof import(...)["default"], with the tag PascalCased as Vue resolves it.
3. evidence.ts: component() falls back to globalComponents only when no import names the tag.
4. Test (test-bun/vue-scanner.test.ts): rule = Vue event-binding contract applied to the GlobalComponents registration Nuxt and unplugin generate; incorrect result = unsupported-vue-binding and no Emitter->Host relationship for a non-imported component; gap = every existing binding test imports the child. Smallest test: prepared Nuxt 4 shape (solution config, Git-ignored .nuxt config and declarations, installed vue stub) with one PascalCase and one kebab-case tag. Fresh checkout without .nuxt is already covered by the existing Nuxt routes test.
5. Docs, bun run check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented per plan. The new test fails on the previous code and passes after; all 15 Vue scanner tests pass. FunstageGmbH/Buzzinga-web: invocations 0 -> 5 (navigateNext x2, navigatePrevious x2, selectTab), unsupported-vue-binding 20 -> 15; the remaining 15 are handler expressions (10) or native events on components that declare no such emit (Button @click, Image @error, SearchInput @input), both unsupported by the documented rule. Found while testing: augmentations merge into the checker module symbol, not SourceFile.symbol; real Vue hid this because GlobalComponents is re-exported from @vue/runtime-core.

bun run check found the typecheck failing on ts.isDeclarationFileName (absent from the TS 7 typings the repository checks against) and component() at cognitive complexity 17. Replaced the call with a .d.ts/.d.mts/.d.cts filename test and split the import lookup into importedComponents(); Vue tests still 15/15.

bun run check: Biome 1 pre-existing warning (test-bun/execution-evidence.test.ts), typecheck pass, Node 16/16, Bun 753 pass / 51 skip / 23 fail; all 23 failures are Java, COBOL, Scala and Swift tests that need toolchains absent on this machine (no Java runtime or jar, no SwiftParser module), none in TypeScript, Vue or core. Cold simplicity review: no structural findings; applied its stale typescript-outline.ts header, kebab-case test coverage, redundant reference guard, duplicate comment, unneeded allowJs/noEmit, fixture strict flag, vueResolution name and docs wording. After those edits: Biome on changed scanners and tests clean except pre-existing infos, typecheck pass, vue-scanner + code-outline + nested-scanners 34/34 pass (max-concurrency 1, as in bun run check). End to end on a FunstageGmbH/Buzzinga-web clone with both rebuilt scanner packages and groma 0.6.6: scan completes, groma export finishes in 2.3 s (previously never finished), and the map gains GameSectionNavigationButtons -> GameListLoggedIn/GameListLoggedOut (navigateNext, navigatePrevious) and GameSectionHeader -> GameSectionLoggedIn (selectTab).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Template event bindings on components registered on Vue's GlobalComponents (Nuxt 4, unplugin-vue-components) now resolve like imported ones; an import still shadows a global name and kebab-case tags find PascalCase registrations. A solution root tsconfig compiles through the first existing referenced config with the package SFCs, including its Git-ignored declaration files; without it the root config applies as before. Verified by a new prepared-Nuxt-4 test (fails before the change), the existing fresh-checkout Nuxt test, and Buzzinga-web: callback invocations 0 -> 5, unsupported bindings 20 -> 15 (the rest are handler expressions or native events).
<!-- SECTION:FINAL_SUMMARY:END -->
