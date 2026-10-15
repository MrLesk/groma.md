---
id: TASK-600
title: Integrate scanner fixes with shared plugin configuration
status: Done
assignee:
  - '@codex'
created_date: '2026-10-14 20:51'
updated_date: '2026-10-14 23:15'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/pull/117'
  - 'https://github.com/MrLesk/groma.md/pull/113'
  - plugins/scanners/entry-points/javascript.ts
  - src/scanner/modules/discovery.ts
  - src/plugins/management.ts
modified_files:
  - test-bun/javascript-manifest.test.ts
  - test-bun/scanner-discovery.test.ts
  - plugins/scanners/entry-points/javascript.ts
  - src/scanner/modules/discovery.ts
  - docs/scanners/javascript/index.md
  - docs/scanners/ada/index.md
  - docs/scanners/dart/index.md
  - docs/scanners/cpp/index.md
  - docs/scanners/c/index.md
  - docs/scanners/mql5/index.md
type: bug
ordinal: 677000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The new scanner batch was built before the unified plugin configuration in PR #117. The user asked to build scanner work on existing plugin fixes. PR #113 also contains two verified scanner failures that remain on this base: a malformed JavaScript manifest aborts a scan, and dependency discovery claims an installation above the repository.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The six new scanners use the config.json plugin installation and selection flow from PR #117 on current main.
- [x] #2 Malformed selected JavaScript manifests report a diagnostic without losing valid sibling entries or source inventory, and without inventing entries.
- [x] #3 Dependency discovery reports installed versions only from inside the repository while preserving valid local installations.
- [x] #4 The combined scanner work passes focused package and plugin-flow checks and the full repository check.
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
1. Stack the existing scanner batch on PR #117 and current main, preserving both upstream work and the saved batch. 2. Port only the two remaining scanner fixes from PR #113. The malformed-manifest regression must detect aborting the scan, losing sibling entries or inventing broken-package entries; existing coverage has no malformed sibling. The installed-version regression must distinguish the nearest in-repository install from a package above the root; existing coverage has no outside-root install. 3. Adapt scanner setup documentation to config.json and plugin add, then verify actual packaged scanners through the new plugin flow. 4. Integrate independently reviewed language fixes, run the combined repository check, and record evidence. Core remains the owner of C4 boundaries and OKF documents; these changes only correct source evidence and installation plumbing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rebased integration onto PR117 head 4a2c9bc plus main 502cc061, with a preserved pre-integration Git stash. Ported only the remaining PR113 scanner deltas (manifest fixes e867ca41/3dda605a/919e0b84, docs83dd5a03; installed-version boundary e867ca41/0babd11e). Both regressions failed before the fixes and pass afterward: 4 tests, 13 assertions. Strengthened the manifest witness to require exact good entry membership and retained broken-package inventory. PR136 is not a prerequisite and has reproduced false main entries and incomplete Spring paths, so it is excluded.

Initial combined check on PR117 plus main passed: 16 Node tests, 838 Bun tests, 60 opt-in skips, zero failures, 3305 assertions (/tmp/groma-task600-integration-check.log). Focused plugin install/restore/settings/release checks: 20 pass, 188 assertions. Actual CLI plugin add -> scan -> viewer source outline smoke passed for all six packaged scanners in fresh temporary repositories, with repeated observations and unchanged source hashes (/tmp/groma-plugin-batch-Uqzy0E/results.json). Language confidence fixes are still in progress; repeat full checks only after their final integration or other code changes.

Parent specification and quality review of the PR113 port: selected manifest parsing owns the warning, preserves existing observation diagnostics and valid sibling entries, and rethrows non-SyntaxError failures. Installed dependency lookup owns its root boundary and keeps normal in-repository resolution unchanged. The two focused regressions failed on the preserved base and now detect the concrete wrong outputs rather than implementation text. A junior developer can follow discovery -> installed manifest and selected JavaScript declarations -> entry evidence without a new shared abstraction. PR117 plugin/config behavior is reused unchanged. Remaining gate is final language integration and combined validation, not another architecture change.

Rebuilt Ada, Dart and Mojo packages passed the shared fresh-checkout test in the PR117 integration (3 tests, 21 assertions), with no language tooling on PATH and unchanged inputs. Official Dart 3.13.5 SDK archive HEAD checks returned HTTP 200 for all five release targets: Linux x64/ARM64, macOS ARM64, and Windows x64/ARM64. This checks build-input availability only; Windows/Linux execution remains a CI gate.

Reconfirmed that PR117 and PR113 heads remain 4a2c9bc and753edc0a respectively. The integration contains the exact PR117 head. Final C and MQL5 source fixes are integrated; rebuilt runtime hashes exactly match their frozen review candidates. Their combined focused checks pass34 tests250 assertions, and both fresh packages pass without language tools (2 tests14 assertions). C++ final source integration and the combined suite remain pending.

First frozen C++ confidence candidate integrated with exact JS/grammar hash match (35eddaf0e29d548ad90d7b71cc1c0885c8281e630d82bac47d116cb458a8129c / e69f0b1daf8b068c0918665be94f7ff2cf32bc10559640708055b7f7ce2dae01). All six actual CLI plugin add -> scan -> core Code outline flows passed with repeatable observations and unchanged source hashes: /tmp/groma-plugin-confidence-qbRzUR/results.json. Combined check passed 16 Node and 873 Bun tests, 62 opt-in skips, zero failures and 3,538 assertions: /tmp/groma-confidence-final-check-20261015.log. C++ final reviewers then found two targeted blockers, so this is a passing integration baseline, not release qualification: OpenTTD macro-qualified pool declaration syntax and GUARD macro block false function/caller ownership. TASK-594/600 remain open for those corrections and the final exact-package replay.

Final integration is qualified on the frozen C++ v4 source. Both previous review blockers and the targeted caller/access regressions are fixed; the independent C++ replay and final complexity review report no authority-backed blocker. The integration's C++ runtime and grammar match the frozen reviewed hashes. All six packages pass the actual plugin add -> scan -> core Code outline flow with repeatability and unchanged source hashes (/tmp/groma-plugin-confidence-oBnZDY/results.json). Fresh package validation covers all six final runtimes; final C++ fresh-checkout test passes 1 test/7 assertions. The final bun run check passes 16 Node tests and 873 Bun tests, with 62 opt-in skips, zero failures and 3,554 assertions (/tmp/groma-confidence-final-v4-check-20261015.log). The full OpenTTD selection remains explicitly unqualified; the six complete C++ library selections pass without narrowing. Windows/Linux runtime execution is not claimed. Final diff whitespace check passes and groma/ has no pending changes. The implementation plan describes the final integrated flow. Own specification and quality reviews remain satisfied; no runtime source changed after final verification. All task acceptance criteria and Definition of Done items have objective evidence. No commit, push, PR, merge or publication was performed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stacked the six-scanner batch on PR #117's unified plugin configuration and current main, then ported the two remaining source-scanner fixes from PR #113. Malformed selected JavaScript manifests now retain good sibling entries and source inventory with a concrete diagnostic; installed dependency versions are resolved only within the repository. Scanner setup documentation uses the shared plugin flow. All six final packaged scanners pass installation, scanning and Code outlines with unchanged inputs. Focused before/after regressions, plugin/package checks and the final repository check pass: 16 Node tests, 873 Bun tests, zero failures. The independently qualified language fixes and documented C++/OpenTTD limits are integrated on codex/scanner-confidence. No commit, publication or merge was performed.
<!-- SECTION:FINAL_SUMMARY:END -->
