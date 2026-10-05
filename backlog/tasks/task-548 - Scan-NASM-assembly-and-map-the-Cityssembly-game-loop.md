---
id: TASK-548
title: Scan NASM assembly and map the Cityssembly game loop
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 18:09'
updated_date: '2026-10-05 18:33'
labels: []
dependencies: []
references:
  - >-
    https://github.com/mixy1/cityssembly/tree/b5ff5470bedd24ad6bd55e71fa47d3ffcc7ed4b0
  - scanner-src-index
  - source-read
  - modules-discovery
  - nasm-src-index
  - cobol-src-index
documentation:
  - docs/scanners/creating-a-plugin.md
modified_files:
  - plugins/scanners/nasm/package.json
  - plugins/scanners/nasm/.gitignore
  - plugins/scanners/nasm/build.ts
  - plugins/scanners/nasm/THIRD-PARTY-NOTICES.txt
  - plugins/scanners/nasm/src/preprocess.ts
  - plugins/scanners/nasm/src/evidence.ts
  - plugins/scanners/nasm/src/index.ts
  - packages/scanner/src/index.ts
  - src/viewers/source/structure.ts
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - test-bun/scanner-release.test.ts
  - test-bun/scanner-fresh-checkout.test.ts
  - bun.lock
  - test/fixtures/nasm-source/macros.inc
  - test/fixtures/nasm-source/main.asm
  - test/fixtures/nasm-source/helpers.asm
  - test-bun/nasm-scanner.test.ts
  - test-bun/code-outline.test.ts
  - groma/systems/groma-md/components/evidence.md
  - groma/systems/groma-md/components/nasm-src-index.md
  - groma/systems/groma-md/components/preprocess.md
  - docs/scanners/nasm/index.md
  - docs/scanners/index.md
  - docs/scanners/creating-a-plugin.md
  - package.json
  - groma/systems/groma-md/containers/cli/components/nasm-src-index.md
  - groma/systems/groma-md/containers/cli/components/evidence.md
  - groma/systems/groma-md/containers/cli/components/preprocess.md
  - packages/scanner/package.json
  - plugins/scanners/cobol/package.json
type: feature
ordinal: 633000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Alex approved a first assembly scanner using Cityssembly after investigation found no public original RollerCoaster Tycoon assembly source. A developer should be able to scan a fresh NASM x86-64 source checkout and inspect a curated game architecture with original-source navigation. Qualify one Linux build configuration at Cityssembly b5ff5470bedd24ad6bd55e71fa47d3ffcc7ed4b0, then prepare this scanner and completed COBOL support for one release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An installed scanner reads host-selected NASM x86-64 source and local includes for the declared configuration without installed project tools, a project build, or scan-time downloads.
- [x] #2 Routine outlines and supported direct-call evidence retain original source files and lines through the macros and includes used by the approved Cityssembly configuration; indirect and external calls remain uncertain.
- [x] #3 Assembly labels, sections, include dependencies and ordinary calls do not invent C4 elements, source-unit ownership or automatic architecture relationships.
- [x] #4 A curated Cityssembly map explains the game-loop scenario with source links and remains intact after another scan; web, terminal and static source navigation are verified.
- [x] #5 The official catalog and existing package release assembly include the new scanner; documentation states the supported configuration, tools and limits.
- [x] #6 Focused scanner and installed-package validation, bun run check, cold simplicity review, own specification and quality reviews, and full-context complexity review pass.
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
1. Qualify one NASM 3.02 ELF64 preprocessing unit at pinned Cityssembly. Bundle the tool and retain macro invocation origins with the documented one-line location patch. 2. Expose entry/includePaths settings; copy only selected sources; extract exported/directly called text routines and bounded direct-call facts. Keep raw calls temporary, with no execution-entry inference, source-unit ownership or automatic arrows. OKF remains readable Markdown and source links; C4 meaning stays with core and curation. 3. Pass stored Code context, filtered by scanner selection, through the existing outline hook so includes in other components and historical snapshots work. 4. Extend existing catalog, native host assembly and relocated fresh-checkout checks. The minimal NASM test detects wrong macro/include/CRLF/UTF-16 positions, wrong active branch or call certainty, and excluded includes leaking into analysis. The outline host test detects wrong cross-component context or reading the current tree instead of a snapshot. Existing release assembly coverage verifies a worker from each host; the package test owns repeatability and absence of installed tools/network. 5. Curate 59 Cityssembly sources into 12 responsibilities and one frame flow, using existing unidentified-container placement without executable evidence. Verify rescans and web, TUI and static source navigation. 6. Run cold simplicity review, accepted simplification, complete checks, own specification/quality review and final full-context review. Prepare versions and changelog for the combined COBOL/NASM release; qualify all five release hosts before publishing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The installed NASM package passes fresh-checkout scanning with no language tools, network or project mutations. Focused release assembly and outline checks pass (9 tests) with local server access. Cityssembly probe reports 59 files, 924 routine operations and 4392 calls; original macro invocation lines are retained.

Cold simplicity review found no blockers. Accepted its deletion of the redundant repeated-scan assertion, already proven by the installed-package test. Combined generated NASM implementation records into one Language scanners responsibility and documented its entry-to-result flow.

Prepared versions for the combined release: groma.md 0.6.6, shared scanner contract 0.2.2, COBOL 0.1.0 and NASM 0.1.0. Both new scanners require Groma 0.6.6, which adds program outlines and cross-component source context.

Final full check passes: 16 Node tests and 763 Bun tests, 50 skipped. The focused NASM test passes after removing the duplicate assertion. Cityssembly curation groups all 59 files into 12 responsibilities with a Player and Play one frame flow; two rescans create zero records. Browser navigation opens game_tick at src/main.asm:764, and static export opens sim_tick at src/sim.asm:387. No local assembler installation was needed.

Implementer specification review: installed selected-file scan, original macro/include locations, bounded evidence with no invented C4 behavior, official packaging and scoped documentation meet AC1-3 and AC5. Curated Cityssembly web/static navigation and stable rescans meet the verified portions of AC4; terminal navigation also reaches src/main.asm:764. Quality review traced hooks -> snapshot preprocessing -> bounded evidence -> shared contract -> Code outline. Each added assertion detects a source-origin, target-certainty, source-selection or cross-component-context error. No reproducible supported-flow defect or unclear responsibility remains. New source/build files are 44-118 lines and changed code has no new complexity warnings. Cross-platform package execution remains a release qualification step.

Terminal tui-test verification completed at 160x48 and 200x60. How lists macro-defined routines and opening game_tick shows original FUNC game_tick at src/main.asm:764; screenshot /tmp/groma-cityssembly-source.svg. Static export also exposes all seven authored frame-flow steps and highlights the selected renderer collaboration. Qualification checkout: /tmp/groma-cityssembly-research; export: /tmp/groma-cityssembly-export. Release notes use the recent GitHub format at /tmp/groma-v0.6.6-notes.md. npm whoami returned 401; new package bootstrap/publisher configuration is pending valid npm authentication.

Full-context complexity review passes with no blockers or material recommendations. Both separate-agent review gates and implementer reviews are complete. Host-specific build execution will be verified by the existing release workflow before publication.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added scanner-owned NASM 3.02 preprocessing for the approved Linux x86-64 source configuration, macro-aware routine navigation and bounded call evidence. Shared outline context supports includes owned by another component and historical snapshots. Qualified Cityssembly with a stable 12-component game-loop map and correct web, TUI and static source navigation. Catalog, package assembly, documentation and versions prepare the combined COBOL/NASM 0.6.6 release. Full check: 16 Node and 763 Bun tests pass; 50 skipped. Both review gates pass. Cross-platform release qualification and authenticated npm bootstrap remain publishing steps.
<!-- SECTION:FINAL_SUMMARY:END -->
