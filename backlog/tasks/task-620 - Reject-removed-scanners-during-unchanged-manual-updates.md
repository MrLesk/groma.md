---
id: TASK-620
title: Reject removed scanners during unchanged manual updates
status: Done
assignee:
  - '@codex'
created_date: '2026-10-17 12:11'
updated_date: '2026-10-17 12:14'
labels: []
dependencies: []
references:
  - src/scanner/modules/inventory.ts
  - test-bun/scanner-update.test.ts
  - docs/scanners/index.md
  - docs/config.md
modified_files:
  - test-bun/scanner-update.test.ts
  - src/scanner/modules/inventory.ts
  - docs/scanners/index.md
ordinal: 686000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The final 0.7 review reproduced a manual update returning success after a concurrent operation removed the same scanner. This happens when the registry returns the version already selected, bypassing the final conflict check. The scanner guide also still says downloads require explicit actions despite default background updates.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A manual scanner update reports a conflict if the scanner was removed while resolving the already-selected version, and does not restore that selection.
- [x] #2 An unchanged manual update succeeds when its selection remains current, while unrelated project settings remain intact.
- [x] #3 The scanner guide describes default background downloads and links to the automatic update rules.
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
1. Extend the existing held-registry update coverage: docs/config.md promises a conflict when the same selection changes during a manual update. The reproduced wrong result is success after removing that scanner when the resolved source is unchanged; existing coverage only tests removal of another plugin during a version change. Add the smallest concurrent regression in scanner-update.test.ts and verify failure before the fix. Also verify the unchanged successful operation and preserved config in that scenario. 2. Always run the existing locked current-selection guard, using its current no-write result when the selection is unchanged. No new helper, config field, OKF concept or C4 element is needed; plugin inventory still owns selection changes. 3. Replace the obsolete explicit-only download statement with the existing background update rule and link. 4. Run focused update coverage and bun run check; perform implementer specification and quality reviews. Deliver the task-scoped fix through a PR and require Windows, Linux and macOS CI before integrating into the release candidate. Publication remains paused.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The new held-registry regression fails before the fix because updateScanner resolves successfully after the same scanner is removed. The inventory change removes the outer source-difference condition, so every manual update uses the existing locked selection guard and unchanged valid selections still avoid a config write. The scanner guide now describes default compatible background downloads and links to config.md.

Implementer specification review: AC1 is proved by the held-registry removal race failing before the source change and passing after it; the scanner stays removed. AC2 is proved by success for the same current source and byte-identical config, with existing concurrent-settings coverage still passing. AC3 is verified by reading the corrected guide and its existing automatic-updates heading/link. Quality review traced plugin update to inventory replacement, final locked config validation and result; the only source change removes the bypass, retains existing errors/no-write behavior, and adds no helper or architecture concept. The existing owner remains Plugin packages; git status --short groma/ is empty. Both changed TypeScript files remain below 500 lines and no changed function produces a complexity warning. Astra performed one targeted re-review of its original findings and found both resolved with no patch regression. Focused checks:16 pass,0 fail,147 assertions. Full bun run check passes:16 Node tests,898 Bun tests,62 optional skips,0 failures,3703 Bun assertions; log /tmp/groma-task620-check.log. Windows/Linux/macOS CI remains the PR merge gate. No publication has been started.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every manual scanner update now validates the current selection under the existing config lock, including an unchanged version. A concurrent removal reports a conflict instead of false success, while valid unchanged updates avoid writing config. The scanner guide describes default compatible background downloads. Regression fails before and passes after the fix; focused and full repository checks pass, and Astra targeted re-review is clean. Exact-head three-platform CI is required before merging; release publication remains paused.
<!-- SECTION:FINAL_SUMMARY:END -->
