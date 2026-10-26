---
id: TASK-633
title: Add an R scanner and qualify it on six open source repositories
status: Done
assignee:
  - '@codex-r-scanner'
created_date: '2026-10-25T10:05:00Z'
updated_date: '2026-10-26T11:43:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/176'
  - plugins/scanners/python/src/index.ts
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - docs/scanners/r/index.md
  - test-bun/r-scanner.test.ts
  - plugins/scanners/r/src/index.ts
  - plugins/scanners/r/build.ts
  - plugins/scanners/r/package.json
documentation:
  - docs/scanners/creating-a-plugin.md
modified_files:
  - >-
    backlog/tasks/task-629 -
    Add-an-R-scanner-and-qualify-it-on-six-open-source-repositories.md
  - plugins/scanners/r/package.json
  - bun.lock
  - plugins/scanners/r/src/index.ts
  - plugins/scanners/r/build.ts
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - test/fixtures/r-source/functions.R
  - test-bun/r-scanner.test.ts
  - docs/scanners/r/index.md
  - docs/scanners/index.md
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/r/validation.md
  - plugins/scanners/r/.gitignore
  - groma/config.json
  - groma/systems/groma-md/components/r-src-index.md
  - groma/systems/groma-md/containers/cli/components/r-src-index.md
  - >-
    backlog/tasks/task-633 -
    Add-an-R-scanner-and-qualify-it-on-six-open-source-repositories.md
type: feature
ordinal: 677000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue #176 asks for R language support. Alex requested a delegated implementation validated on at least six open source R repositories, followed by the cold simplicity and full-context complexity reviews.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An installable R scanner inventories selected R source and reports parsed named functions with source outlines without running project code, installing project dependencies, or requiring an R installation.
- [x] #2 R scanner discovery and the scanner catalogue expose the supported R package or source project flow, and documentation states the supported syntax and limitations.
- [x] #3 A built package is checked against at least six distinct open source R repositories at recorded commit SHAs; results include source and declaration checks, repeatability, source immutability, and no project dependency installation.
- [x] #4 Focused domain checks and bun run check pass, and both required simplicity reviews complete with no remaining authority-backed blocking findings.
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
1. Provide an experimental R scanner package using the pinned tree-sitter R grammar and web-tree-sitter runtime, bundled with their WebAssembly assets and licenses. Inventory selected UTF-8 .R/.r source, DESCRIPTION-based source membership, direct top-level named functions and matching source outlines. Visibility is source-binding visibility; NAMESPACE exports remain unverified. Operations, calls, frameworks and runtime entry inference are outside this syntax-only scope. 2. Register package discovery/catalogue and build staging through existing scanner concepts, and document supported behavior and limits. OKF/C4: parsed names are Code supporting knowledge; DESCRIPTION supplies source grouping, not systems, containers or collaborations. Ordinary Markdown readers see source links/names; core owns component placement and Groma ownership metadata. Add no OKF fields or C4 levels. This evidence rule holds across projects and languages. 3. Test authority: the scanner contract requires selected-file inventory and named function outlines. Concrete failures are wrong source membership, declarations copied from comments/strings or nested functions, invalid selected syntax accepted, missing bundled assets/tools, code execution/network dependence and source mutation. Existing other-language tests cannot detect these R-specific gaps. Use one minimal R fixture and two concurrent scanner/package tests. 4. Qualify the built package on pinned dplyr, ggplot2, plumber, targets, data.table and rlang checkouts with defaults, plus Shiny with its explicitly configured template exclusion. Record exact URLs, revisions, source/function anchors, identical repeated observations and unchanged input hashes/checkouts; install no project dependencies and run no project code. 5. Complete focused checks, one cold simplicity review, own specification/quality reviews, required repository check, and one full-context complexity review. Apply only the accepted documentation/package-documentation corrections, rerun affected checks and the complete repository check, then record evidence and finish.

6. Alex requested a separate R pull request. Carry only TASK-633 files and R-only integration hunks into an isolated worktree on freshly fetched current main; regenerate the dependency lock against current main without reverting other scanners or dependency upgrades. Preserve the completed reviews and seven-repository evidence, rerun focused R/package and full repository checks on the PR tree with declared temporary runtimes, include task-caused architecture changes, then commit, push and open a ready PR. Do not merge or publish the R scanner.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Initial parser proof: the upstream @davisvaughan/tree-sitter-r 1.3.0 npm package includes a working WebAssembly grammar. The new package uses web-tree-sitter 0.25.10, bundles its runtime and the grammar, and strips build/runtime npm dependencies from the runnable artifact. The first built-package scan of dplyr completed without R installed. Scope decision confirmed by the parent: keep syntax-only source binding visibility and explicitly state NAMESPACE exports are unverified; do not change the shared outline hook. Both reviews must check the CodeVisibility interpretation.

Seven pinned public repository checks passed with the built package: dplyr 109 R files / 820 functions; ggplot2 213 / 895; plumber 87 / 227; targets 288 / 1398; data.table 75 / 459; rlang 77 / 1236, all using defaults. Shiny 151 / 718 passed after explicitly excluding inst/app_template/, whose {{...}} template syntax correctly fails the default scan. No repository-specific scanner default or fallback was added. Each repeated observation is identical, source anchors and exact lines are verified, SHA-256 input hashes are unchanged, and every public checkout stays clean. No R installation, project dependencies or code execution was used. Exact URLs, SHAs, commands, counts and limits are in docs/scanners/r/validation.md. Focused evidence: typecheck passes; lint of the new scanner/build/test files passes; r-scanner.test.ts has 2 passing concurrent tests, including isolated offline package execution and throwing source that is never executed.

Cold simplicity review completed by /root/r_scanner/r_cold_simplicity with no conversation history. The reviewer traced discovery through source grouping, parser extraction, observation and outline; found the implementation minimal and readable; recommended no code or test deletions; and confirmed syntax-level public bindings do not imply verified NAMESPACE exports. Its only finding was an extra backslash in the documented R shorthand function literal. Corrected that documentation. The reviewer independently ran both concurrent R tests successfully. No blocking simplicity finding remains.

Implementer specification review: AC1 is demonstrated by the built scanner, the isolated package test (empty PATH/home, rejected network fetches, source throws if executed), and the CLI smoke flow in /tmp/groma-r-scanner-629/cli-smoke: init -> scanner add local artifact -> scanner check -> scan -> view R/functions.R --plain resolves the Functions component. AC2: metadata discovery recommends r, the official catalogue and build staging select its manifest/builder, and the R and shared outline guides describe the supported syntax and explicitly unverified NAMESPACE visibility. AC3: all seven pinned repository results are recorded, with six defaults and one explicit Shiny template exclusion. AC4 awaits the full permitted repository check and the final full-context complexity review. Quality review: traced catalogue -> plugin entry -> selected-file/root membership -> parser/tree ownership -> normalized observation and source outlines -> core ownership and CLI view. Parsing is shared by scan and outline; each call owns its parser and deletes each tree; no project code, new architecture concept, speculative fallback, compatibility layer, or duplicate declaration model is introduced. Both tests detect concrete wrong behavior (false top-level declarations, wrong source membership, syntax accepted when selected, missing package assets/runtime tools, execution/network dependency or source mutation) and tolerate prose/refactor changes. No in-scope blocking defect found. First bun run check failed because the sandbox denied FSEvents/ps and Maven DNS; the unchanged required command is rerunning with permissions.

Quality correction: include validation.md beside the built README so its validation-record link has a local target, matching the existing framework-package delivery pattern. No scanner behavior changes.

The permitted bun run check completed successfully: Biome and scrollbar checks, TypeScript, Node tests, and 819 passing Bun tests / 54 skipped / 0 failed. Existing lint output has one unrelated warning in execution-evidence.test.ts and two unrelated informational style suggestions; no new R warning. A final unchanged check is running after the small package-documentation copy correction; focused R tests already passed after that correction. The cold review correction was only the documented backslash spelling. Own targeted re-review confirms the built package now carries validation.md beside its README and the scanner behavior and declared support scope are unchanged.

Final full-context complexity review completed by /root/r_scanner/r_full_context_complexity after the implementer specification/quality reviews. It found no blocker, no useful deletion/consolidation, and no missing abstraction. Responsibilities and source-to-result flow are clear for a junior developer. The reviewer confirmed public describes the documented source-binding profile without proving NAMESPACE exports or :: access, checked all seven repository results including the explicit Shiny exclusion, and independently ran both focused R tests successfully. No architecture-scope change or follow-up task is proposed. Finalization waits only for the final full repository check.

Final verification after the package-documentation correction: bun run check exits 0. Node: 16 passed / 0 failed. Bun: 819 passed / 54 skipped / 0 failed across 156 files (873 tests). Log: /tmp/groma-r-scanner-629/check-final.log. Both required review gates are complete with no remaining blocking finding. The final built artifact at /tmp/groma-r-scanner-629/package includes the parser/runtime WASM assets, both upstream licenses, README and validation record; CLI source-owner inspection works. git diff --check for tracked task changes is clean, and git status --short groma/ is empty. All acceptance criteria and Definition of Done items now have objective evidence.

PR preparation started from origin/main b28edd92c19b1a94f258af907ad21f6eafcf1fc5 in managed worktree /Users/alex/.codex/worktrees/r-scanner-pr/groma3, branch codex/task-629-r-scanner. The exact CLI-authored task record was copied intact before these CLI lifecycle updates. Main now includes C/C++/Ada/Dart/MQL5/Mojo registrations and newer dependencies; those changes will be preserved. The approved R semantics and parser versions are unchanged. Bun 1.4.4 is verified from its official npm artifact (SHA-1 491d25046cf553ba0f0201c9d3758f42415e3018) in a temporary folder; Node 26.12.1 is provided separately. No global runtime installation changes.

Reapplied only the R additions onto current main. New R-owned files match the reviewed implementation byte-for-byte. Existing C/C++/Ada/Dart/MQL5/Mojo registrations, the Go build ordering, new outline contract rows, and current dependency versions are preserved. bun.lock was regenerated by Bun 1.4.4 and adds only the R workspace/parser dependency records (19 added lines), with no removals or dependency downgrades. No behavior change makes the seven-repository qualification or completed reviews stale.

Current-main integration checks found two delivery adjustments: the local-install command is now groma plugin add (scanner check remains unchanged), and the documented build command writes development WASM assets into plugins/scanners/r/dist. Updated the R guide to the supported command and added the package-local dist/ ignore rule used by the other scanner packages. Parser/extraction semantics and the seven-repository results are unchanged; no broad re-review or requalification is needed. Focused R package tests pass on Bun 1.4.4; the full current-main check is running.

Architecture preparation follows the commit ownership rule: temporarily select only the new R adapter through the existing TypeScript scanner in groma/config.json, then restore the original configuration byte-for-byte. R parsing runs inside the existing CLI process, so its source analysis belongs to one CLI component, matching the existing language scanner adapters. It adds no C4 level or runtime boundary; ordinary OKF Markdown holds the overview and Code link, and existing Groma metadata owns identity/parentage. No scanner implementation behavior changes.

Added one task-owned architecture component r-src-index under the existing CLI container and Language scanners group, through Groma scan and edit commands. It owns plugins/scanners/r/src/index.ts and explains source grouping, parser/tree lifecycle and the syntax-only limits. The temporary one-file scan also removed derived rows outside this task; those 12 newly generated side effects were restored to their exact HEAD records before curation. No unrelated architecture change is included. groma/config.json is restored byte-for-byte to current main; its temporary use remains in traceability. The R component is the only resulting architecture diff.

PR-tree verification on current main b28edd92: Bun 1.4.4 / Node 26.12.1; complete bun run check passes with 26 Node tests, 935 Bun passes, 63 skips and 0 failures across 168 Bun files (998 tests). Log: /private/tmp/groma-r-scanner-pr/check.log. Both focused R/package tests pass again. Current CLI smoke: init -> plugin add built package -> scanner check -> scan -> view R/functions.R --plain resolves Functions, with no R execution. The reviewed scanner source, build, manifest, tests and fixture match the original reviewed implementation byte-for-byte; only current-main registration, dependency-lock regeneration, install-command wording, the generated-asset ignore rule and the required R ownership record were added for delivery. Original cold simplicity and full-context complexity reviews and pinned seven-repository evidence remain valid; no broad review/qualification rerun. Targeted integration review confirms no dependency downgrade, no removed scanner registrations, no unrelated architecture changes, and config.json restored exactly. The CLI reads the new R source scanner component with parent cli and its precise source file; git diff --check is clean. PR scope is TASK-629 / issue #176 only.

Task identity corrected from TASK-629 to TASK-633 on 26 October 2026 because independent fetch-wrapper PR #183 already uses TASK-629. All local refs, refreshed origin refs/tags, and all ten open pull request heads were checked; TASK-632 belongs to Ruby PR #187 and TASK-633 was unused. Backlog doctor performed the single ID/filename repair in an isolated metadata workspace, leaving unrelated historical duplicates untouched. The CLI repair preserved the task dates, status, checked criteria, full implementation evidence and both review records byte-for-byte apart from the frontmatter ID. Earlier TASK-629 mentions describe the original work history; the active R task and PR now use TASK-633. This correction changes task/document/PR metadata only, so scanner behavior and existing checks/repository qualification are unchanged; no code checks or reviews were repeated.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adds the experimental @groma/scanner-r plugin for selected R inventory, DESCRIPTION source membership, direct top-level functions and outlines. Bundles the pinned parser/runtime WASM assets and licenses; registers discovery and build staging; documents supported syntax and limits; and includes its CLI-owned architecture record. Seven pinned open source repositories are qualified: six with defaults, Shiny with an explicit app-template exclusion, with identical repeats and unchanged inputs. Both required simplicity reviews pass. The current-main PR tree passes bun run check (26 Node tests; 935 Bun pass, 63 skip, 0 fail), focused R/package checks and the current plugin-install/readiness/scan/source-owner flow under Bun 1.4.4 and Node 26.12.1. R is not executed and no project dependencies are installed during scanning. NAMESPACE exports, class/dispatch models, calls/frameworks, runtime boundaries and R Markdown remain outside this syntax-only support. Prepared as a separate pull request for review; the scanner is not merged or published.
<!-- SECTION:FINAL_SUMMARY:END -->
