---
id: TASK-548
title: Scan NASM assembly and map the Cityssembly game loop
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-05 18:09'
updated_date: '2026-10-05 19:41'
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
- [ ] #6 Focused scanner and installed-package validation, bun run check, cold simplicity review, own specification and quality reviews, and full-context complexity review pass.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Package NASM 3.02 for five host platforms. Verify its source archive; retain outer macro invocation locations with the one-line source-location patch. Windows uses the system tar executable and the documented upstream header fix.
2. Preprocess one selected NASM ELF64 source snapshot using entry/includePaths. Decode LF and CRLF output, extract exported/directly called text routines and bounded call evidence, and preserve physical source positions. Add no executable inference, source-unit ownership or automatic relationships.
3. Pass selected Code context through the existing outline hook for includes owned by another component and historical snapshots. OKF remains ordinary Markdown and source links; C4 boundaries and collaborations stay with core and curation.
4. Wire discovery, native package assembly and relocated fresh-checkout checks. Coverage detects wrong macro/include/UTF-16 locations, active branches, provider certainty, excluded includes and source context. The Windows output regression detects lost %line directives and wrong original routine origins; it failed before the fix and passes after it.
5. Qualify pinned Cityssembly: 59 sources, 12 responsibilities, Player and Play one frame flow. Verify stable rescans and web, TUI and static source navigation using existing unidentified-container placement when execution evidence is absent.
6. Complete the cold simplicity review, accepted deletion, implementer specification/quality review and full-context complexity review. Review release-build fixes only for their reproduced failures and regressions.
7. Release COBOL and NASM together as Groma 0.6.6 after five-platform qualification. Assemble the successful host packages, inspect final archives, verify their relocated installation, bootstrap both new npm packages with valid authentication, then publish the prepared GitHub release and verify workflow outputs.
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

Qualification run 37357039886 passed repository validation, both Linux hosts and macOS. Windows x64 failed in NASM archive extraction: tar interpreted D: as a remote host. Windows ARM initially failed earlier in setup-dotnet with Internal CLR error; its old-candidate retry was stopped after the shared Windows extraction defect was identified. Release draft 0.6.6 exists but remains unpublished.

Windows extraction fix: select %SystemRoot%/System32/tar.exe on Windows and retain tar on Unix. Microsoft documents the bundled tool as bsdtar (https://learn.microsoft.com/en-us/windows/tar/). Targeted implementer review confirms the only change is archive-tool selection; no fallback, new scanner behavior or extra test is introduced. Full check passes again: 16 Node and 763 Bun tests, 50 skipped. Windows execution is still pending the new release qualification run.

Run 37359706320 passed full validation and Linux/macOS package tests. Both Windows builds passed archive extraction and failed compiling NASM nasmlib/file.c with Windows SDK error C1189 No Target Architecture. Upstream NASM documents and fixes the same defect at https://repo.or.cz/nasm/nasm2.git/commit/ace0078261329437224d4875b289647279a41fa1.

Applied the exact upstream header fix only to nasmlib/file.c during Windows compilation. Targeted quality/specification review confirms that compiler setup changes only; scanner evidence and macro semantics remain unchanged. Full check passes again: 16 Node and 763 Bun tests, 50 skipped. No extra tests are needed because the native Windows package builds and fresh-checkout runs exercise the failing operation directly.

Run 37362351335 passed full validation, Linux ARM64 and macOS packages. Windows ARM64 built all packages and passed COBOL, but NASM failed during evidence extraction. Reproduced locally by converting actual NASM output to CRLF: nasm: source location is outside selected files: :0. Linux x64 was cancelled while queued, before a runner was assigned.

Windows x64 reproduced the same CRLF failure; COBOL passed on both Windows hosts. GitHub annotation for Linux x64: The job was not acquired by Runner of type hosted even after multiple attempts. The new regression failed before the one-line output split fix and passes after it. Both focused NASM tests pass (16 assertions). Targeted specification/quality review confirms only generated-output line separation changes; physical source offsets remain untouched. The assertion checks the original routine line and offset, and does not depend on wording or helper structure.

Full repository check after the CRLF fix passes: 16 Node and 764 Bun tests, 50 skipped. No new complexity warnings or architecture record changes. The release draft remains unpublished pending renewed native qualification and npm login.

Release continuation: candidate 9c5b6adc8e1d192198809d0566f596fe4da92d69 is pushed. Qualification run https://github.com/MrLesk/groma.md/actions/runs/37364700886 is pending. GitHub reports runner assignment delays in incident https://www.githubstatus.com/incidents/3q1yb5m7ltvb (started 2026-10-05 19:11 UTC). The release draft v0.6.6 points to this candidate and is unpublished. npm whoami still returns 401; Alex has a pending login request. No tools need to be installed for scanner users. Final artifact collection is reserved at /tmp/groma-0.6.6-final-artifacts; older local collections are previous candidates and must not be published. Only @groma/scanner 0.2.2, @groma/scanner-cobol 0.1.0 and @groma/scanner-nasm 0.1.0 are new scanner package versions. Keep this task In Progress until native qualification is complete.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented NASM preprocessing, original-source routine navigation, bounded call evidence and shared outline context. Cityssembly has a verified 12-component game-loop map with stable rescans and web, TUI and static source links. Both required external review gates and implementer reviews pass. Windows qualification found and resolved archive extraction, upstream header inclusion and CRLF output issues; the CRLF regression fails before and passes after its fix. Current full check passes: 16 Node and 764 Bun tests, 50 skipped. Combined Groma 0.6.6 release is prepared but unpublished. Final native qualification is pending during a GitHub Actions incident, and npm authentication must be restored before initial package publication.
<!-- SECTION:FINAL_SUMMARY:END -->
