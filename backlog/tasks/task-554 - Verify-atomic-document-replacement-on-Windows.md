---
id: TASK-554
title: Verify atomic document replacement on Windows
status: Done
assignee:
  - '@codex'
created_date: '2026-10-06 10:04'
updated_date: '2026-10-06 10:16'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/actions/runs/37443321671'
  - 'https://github.com/MrLesk/groma.md/pull/114'
  - 'https://github.com/MrLesk/groma.md/actions/runs/37447815524'
documentation:
  - docs/component-markdown.md
modified_files:
  - test-bun/filesystem-access.test.ts
priority: high
type: bug
ordinal: 638000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Windows CI fails in the atomic replacement test because it keeps a raw file handle open outside the documented cooperating Groma filesystem access boundary. Preserve the regression against in-place truncation while making the observation valid on every supported CI host. The production filesystem behavior and local coordination contract stay unchanged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The replacement regression proves that the previous file contents survive and the architecture path contains the complete edited document on Windows, Linux, and macOS.
- [x] #2 The regression still fails if document replacement becomes an in-place write; it is not skipped or weakened to only check successful editing.
- [x] #3 The complete repository check and the affected cross-platform CI run pass.
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
1. Replace the raw open-handle observation in the existing atomic replacement test with a hard link, a second name for the same original file in the same temporary fixture. This preserves the previous-file assertion without Windows open-handle replacement restrictions. Read the updated architecture to verify the intended title. 2. Test authority: TASK-552 criterion 3 and the documented atomic replacement contract require replacement rather than in-place truncation. Existing coordination tests cover readers using the lock, but this last test assumes POSIX handle behavior. Change only that test and prove an in-place-write mutation fails it. No runtime or test-runner API changes. 3. Run focused filesystem tests, bun run check, own specification and quality reviews, then push the isolated fix and verify all three CI hosts. No OKF metadata, C4 elements, or Groma architecture files change.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Focused filesystem checks pass: 4 tests, 12 assertions. In a disposable checkout, replacing the production rename with an in-place write causes the revised previous-file assertion to fail as intended. The test therefore retains its atomic-replacement regression value. Microsoft documents NTFS hard links as names for the same file on one volume; this fixture keeps both names on that volume. No runtime code or contract changes are needed.

Implementer specification review: the revised test preserves the old-content check and strengthens the new-path check to load the architecture and assert the edited title. Existing tests still cover lock waiting and complete structural reads. Implementer quality and simplicity review: one existing test changes; its fixture, link, and cleanup are isolated per concurrent test. The link stays outside groma so it is not a duplicate architecture record. A new developer can follow fixture -> second name -> normal authoring edit -> old contents and new title. No new helper, dependency, timeout, skip, retry, runtime fallback, architecture element, or test runner behavior.

The complete bun run check passed after the test change: Biome and TypeScript passed, Node tests passed, and Bun reported 773 passed, 51 existing optional skips, 0 failures. git diff --check passed and git status --short groma/ is clean. Cross-platform GitHub CI remains the final acceptance gate.

GitHub CI run 37447815524 passed on Ubuntu 24.04, Windows latest, and macOS latest at code commit 3fedd22920a16a151cfa092dff3ae372f30b7797. All repository-check steps and standalone builds succeeded. The PR 114 architecture comparison and preview deployment also succeeded. The shared architecture workflow reported an unrelated comparison failure for existing PR 113; that comparison does not change the result of this PR or its three CI jobs. No product code, public contract, or architecture record changed, so no documentation update or architecture scan is required.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed the Windows CI regression by observing the original document through a hard link instead of holding a raw file handle open during replacement. The test still proves that the old file retains its complete contents and that the normal architecture path contains the edited title. A deliberate in-place overwrite fails the revised assertion. All four filesystem tests and bun run check passed locally; GitHub CI passed on Windows, Linux, and macOS. Production behavior is unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
