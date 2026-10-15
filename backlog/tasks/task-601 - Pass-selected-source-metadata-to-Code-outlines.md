---
id: TASK-601
title: Pass selected source metadata to Code outlines
status: Done
assignee:
  - '@codex'
created_date: '2026-10-14 20:59'
updated_date: '2026-10-14 22:41'
labels: []
dependencies: []
references:
  - src/viewers/source/structure.ts
  - src/viewers/web/export.ts
  - src/history/revisions.ts
  - packages/scanner/src/index.ts
  - test-bun/code-outline.test.ts
modified_files:
  - test-bun/code-outline.test.ts
  - src/history/revisions.ts
  - src/viewers/source/structure.ts
  - src/viewers/web/export.ts
  - packages/scanner/src/index.ts
  - docs/scanners/creating-a-plugin.md
  - test-bun/react-scanner.test.ts
  - test-bun/vue-scanner.test.ts
type: bug
ordinal: 678000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
LocalSend declares Dart 3.11 in pubspec.yaml. Its source scan can use that selected metadata, but the Code outline host supplies only files with architecture ownership. This loses the language version and hides valid declarations in live and historical views. The user requested fixing real scanner failures across repositories; the host must pass selected metadata without giving it artificial C4 ownership.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Live Code outlines receive the configured selected source inputs, including metadata without an architecture owner, while honoring exclusions and Git-ignore selection.
- [x] #2 Historical outlines and static exports read the metadata from the requested revision and never substitute current source bytes.
- [x] #3 Metadata context does not create Code references, component ownership, or architecture elements; only requested references are outlined.
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
1. Retain the existing readCodeStructure fourth argument and pass complete configured selected inputs instead of only owned Code files. Live input listing uses the existing repository listing; historical input listing uses the exact Git tree. List once per static export snapshot and reuse that list for component outlines. 2. Keep source filtering with the existing configuredSelection owner and keep installed plugin/settings ownership in the current repository. Read source bytes only from the live or requested archived root. Metadata is source parsing evidence, not a C4 element or OKF concept; ordinary Markdown source links and ownership stay unchanged. 3. Extend the existing outline-context regression: selected metadata without Code must affect the outline, excluded metadata must not be supplied, and snapshot bytes must win over differing current bytes. Existing coverage tests another owned source only and would miss the LocalSend failure. Add the smallest live/revision selection witness needed to exercise actual Git listing; no test of exact documentation prose. 4. Run outline/export tests, cold simplicity, own specification/quality review, final full-context review and combined repository checks. Dart actual packaged live/historical outline checks supply the user-visible regression evidence.

5. Keep the existing React and Vue shared-file outline regressions unchanged in scope, but initialize their temporary repositories before calling the host. The host now uses the same Git selection boundary as scans; groma init already creates Git in the supported flow. These tests must still detect duplicate outlines and lost entry symbols. No extra assertions or non-Git fallback are needed.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Before-fix live/historical metadata regression failed with an empty outline. New test uses its own architecture fixture to avoid shared fixture locks during concurrent execution; full affected file now passes8 tests. Existing working-tree export test exposed an introduced Git listing when there are no configured scanners: outline context is now empty in that case because there is nothing to parse. No new fallback or filesystem discovery was added.

Cold simplicity review passed. Accepted its one deletion: the old explicit-context test duplicated selection/exclusion and historical-byte assertions now exercised through real live/revision outline calls. Removed that duplicated setup and artificial support component; installed-plugin ownership remains covered by the existing snapshot test. No runtime complexity or additional context abstraction was added.

After accepted simplicity deletion, outline/export focused checks pass9 tests72 assertions. Implementer specification review: metadata passes from configured live/exact-revision listing into existing filtered context, snapshots read their own bytes, world remains unchanged, and archive-only exports with no scanners need no listing. Quality review traced callers in live views and static export through one snapshot list and the existing per-scanner selection/import owner. Test witnesses fail on absent metadata, current bytes substituted into history, excluded or ignored inputs, or world mutation; no wording/implementation assertions. No new abstraction, fallback, or architecture concept. Final full-context review and packaged Dart integration are next.

Final full-context complexity review passed with no blocking finding or material simplification. Domain ownership and reuse of existing context/selection/snapshot paths are clear; no C4/OKF metadata change. Independent packaged Dart live/historical retest is running on the integrated host.

Independent packaged LocalSend validation now passes through the actual viewer outline: the formerly failing generated file has40 declarations, including constructors at294 and791. Changing only the current nearest pubspec to3.13 makes the current outline reject unchanged3.11 source, while the historical outline at the pinned3.11 revision exactly matches its original result. Excluding all pubspec metadata makes scan and outline fail, proving the scanner does not read hidden metadata. Inputs/config restored. Pub and Pixorama observations/outlines remain JSON-identical to the prior successful round. Independent report is being finalized by dart_adversarial.

The first integrated full check passed 863 Bun tests but the two existing React/Vue shared-file outline tests failed before reaching assertions: their temporary roots had no Git repository. Their scanner-only helpers predate host selected metadata. Production initialization creates Git (docs/index.md); preserve real host selection and correct those two test setups rather than adding unsupported filesystem fallback.

The two existing React/Vue host tests now initialize their own Git repositories, as groma init does for real projects. Their existing duplicate-outline and entry-symbol assertions pass unchanged: 2 tests, 7 assertions. Own targeted quality review confirms this is fixture setup only, with no runtime fallback, behavior weakening, retries, or shared state. Final combined check will run after the C++ candidate is integrated.

Removed the unused mkdir import left by the accepted duplicate-test deletion. This addresses the only new lint warning in the combined check; no behavior changed.

Integration verification on 2026-10-15: bun run check passed lint/typecheck, 16 Node tests and 865 Bun tests (62 opt-in skips, zero failures, 3,483 assertions), recorded in /tmp/groma-confidence-pre-cpp-check-20261015.log. This run contains final C, Ada, Dart, MQL5, Mojo and TASK-601 code. C++ confidence corrections are still in progress and are not certified by this run. No live groma changes, commit, push, merge or publication.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Code outlines now receive the same configured selected source context as scans, including parsing metadata that has no architecture owner. Live views use repository selection; historical views and static exports use the exact requested Git tree and snapshot bytes. Static export lists inputs once per snapshot. Existing plugin context and selection contracts remain the owners; no C4 or OKF metadata concept was added.

The regression proves selected metadata affects outlines, excluded/ignored inputs do not, history never substitutes current bytes, and the architecture world remains unchanged. Independent LocalSend package testing confirms 40 restored declarations and current/historical language-version behavior. Existing React/Vue shared-file host tests initialize their own Git repositories and retain their outline/entry assertions.

Cold simplicity, implementer specification/quality and final complexity reviews pass. Focused outline/export checks passed 9 tests and 72 assertions; the two shared-file regressions pass 7 assertions. The combined check now passes 16 Node and 865 Bun tests, with 62 opt-in skips and no failures. Documentation describes the existing plugin context argument accurately.
<!-- SECTION:FINAL_SUMMARY:END -->
