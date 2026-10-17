---
id: TASK-619
title: Avoid the GitHub parallel-action event-file race
status: Done
assignee:
  - '@codex'
created_date: '2026-10-17 06:02'
updated_date: '2026-10-17 07:43'
labels: []
dependencies: []
references:
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
  - 'https://github.com/actions/runner/pull/4675'
modified_files:
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
type: bug
ordinal: 686000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-merge main CI39008135402 fails in setup-dotnet Context JSON parsing before repository checks, despite an identical green PR tree. GitHub rewrites the shared event.json before each action, so concurrent action startup can read its empty intermediate contents. The same reported runner defect affects checkout/cache and remains open upstream. Keep Groma CI, release and architecture workflows reliable without masking failures or adding retries.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CI, release and architecture action setup does not overlap shared GitHub event-file readers with other action startup.
- [x] #2 All existing platform matrices, package qualification, scan/export and publication gates remain present; independent build and test commands can still run concurrently.
- [x] #3 The required local check and Windows/Linux/macOS CI pass; the release build-only workflow keeps publication disabled.
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
1. The failed setup-dotnet stack reads GITHUB_EVENT_PATH at its Context constructor; runner v2.338.0 rewrites that same path before each action. Upstream runnerPR4675 reports the identical parallel startup race. Replace only native parallel groups containing uses steps with the same ordered ordinary steps in CI, release and architecture. Keep job matrices and pure command/build/test groups parallel. Action repository workflows already use sequential action setup and need no duplicate fix. 2. This is execution ordering in existing workflow owners, not a new OKF record, C4 element or product capability. Add one short workflow comment linking the upstream reason. No new helper, dependency, retry, timeout or test is needed; source-text assertions would not verify the runner behavior. Validate preserved parsed step contents/gates and workflow syntax, run the required repository check, then current3OS CI and the existing build-only release workflow with publication false. 3. Perform implementer specification/quality reviews, record objective evidence, open one TASK-619 PR and merge only after exact-head platform checks pass. Retain the user-paused publication state and Action draft gate.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Replaced9native parallel groups containing uses with the same sequential steps across3workflows; pure command groups and independent jobs/matrices stay parallel. A parsed workflow comparison flattens old/new groups and proves every step,condition,command,matrix,permission and publication gate unchanged (/tmp/groma-task619-workflows.log). bun run check passes16Node,897Bun,62optional skips,0 failures,3693assertions (/tmp/groma-task619-check.log). Implementer specification review confirms AC1/2 scheduling and unchanged gates; AC3remote qualification remains pending. Quality review traces workflow entry through ordered setup to existing build/test/publication responsibilities; the only additions are short upstream-reason comments. No helpers,dependencies,retries,timeouts,assertion changes or model concepts added. Action repo workflows already serialize uses; no changes required there. Existing26untracked architecture records remain unrelated and unstaged.

Final specification review confirms AC1/2 parsed schedule preservation and AC3all3CI/all5build-only qualification. Implementer quality review finds direct workflow ownership and no added indirection. All5targets execute existing packaged fresh-checkout checks; publisher jobs are skipped by explicit publish_scanners=false. The previous main pre-test setup failure was rerun once after identifying the upstream race and now passes39008135402 on all3OS. The final task-record-only commit follows verified source6e09bdff; its exact-head CI remains the merge gate.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Action setup is sequential in CI, release and architecture workflows to avoid the reproduced GitHub runner event-file race. Independent jobs and build/test commands remain parallel, and all checks and publication gates are preserved. Local checks pass16Node/897Bun with0failures; exact source6e09bdff passes Windows/Linux/macOS CI39008687313 and combined271d3bd7 passes all5scanner build/fresh-checkout hosts in build-only39008688948. Codex code/security reviews report no findings. No retries,timeout changes,helpers or product/model changes were added. Publication remains paused and ActionPR8 stays draft.
<!-- SECTION:FINAL_SUMMARY:END -->
