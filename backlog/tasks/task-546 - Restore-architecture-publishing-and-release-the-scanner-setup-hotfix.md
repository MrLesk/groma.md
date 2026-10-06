---
id: TASK-546
title: Restore architecture publishing and release the scanner setup hotfix
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 10:57'
updated_date: '2026-10-05 11:39'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/actions/runs/37298447639'
documentation:
  - .github/workflows/architecture.yml
modified_files:
  - .github/workflows/architecture.yml
priority: high
type: bug
ordinal: 631000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The architecture workflow rebuilds optional comparisons for each open PR. Some PR snapshots still use an unsupported older relationship format, so those previews fail. The main map builds successfully but deployment was skipped because a failed comparison remained an ancestor job. Alex requested the main workflow fixed and Groma 0.6.5 released with the verified simultaneous-view setup fix, then explicitly stopped work on other PR branches. Restore main publication and keep optional comparison failures reported without failing the overall publishing workflow. Preserve current architecture semantics; no legacy reader or PR source changes are part of the final scope.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A successful architecture build deploys even when a comparison job fails, while failed builds and canceled runs do not deploy.
- [x] #2 Optional PR comparison failures remain reported in their job logs without failing the main architecture publishing workflow; successful comparison artifacts still join the site.
- [x] #3 Groma 0.6.5 includes TASK-545 and the workflow deployment fix, publishes all current platform packages and assets, and uses concise release notes matching 0.6.4.
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
1. Keep deployment explicitly conditional on a successful build and a non-canceled run. Make optional comparison jobs continue on error, matching the existing workflow contract that missing comparisons do not block the main site. A pushed main commit is the entry point and a published current map is the required result.
2. Use the existing repository check and real GitHub executions to verify successful build/deploy through a failed comparison; add no source-text tests or architecture-format compatibility.
3. Commit and push only main workflow changes and the task record, then verify the complete main publishing workflow.
4. Publish Groma 0.6.5 from its tested release commit and verify assets, npm packages and a fresh installation. Track Action adoption separately as Action TASK-5.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Main architecture publishing is owned by .github/workflows/architecture.yml. Optional comparison jobs use continue-on-error, and deploy runs only when the main build succeeded and the run was not canceled. Successful comparison artifacts still join the site; a failed comparison remains visible in its job logs. This restores the existing delivery contract. Markdown, OKF metadata, C4 semantics and scanner behavior are unchanged.

Verification: bun run check passed after the complete change with 16 Node tests, 760 Bun tests, 48 skips and zero failures; log /private/tmp/groma-546-main-check.log. git diff --check passed and groma/ was unchanged. Main CI 37301650512 passed on Linux, macOS and Windows. Architecture run https://github.com/MrLesk/groma.md/actions/runs/37301650527 passed on 94a46a11: one comparison succeeded, the other failed visibly, and build, deploy and comment succeeded. Existing tests and real workflow executions cover the supported result, so no source-text tests were added.

The implementer's specification and quality reviews found no blocking issues. The two conditions live in the jobs that own comparison and deployment. A reader can follow a main push through optional exports, site build and deployment without an added helper, dependency or model concept.

Scope correction: PR 110 had already been updated to current main before Alex stopped other-PR work. PR 113 was never pushed; its isolated local integration and interrupted check were archived. All subsequent work stayed on main and the separately authorized Action release.

Groma 0.6.5 was released from 05d91e53 after local checks and Linux/macOS/Windows CI passed. It includes TASK-545 and the deployment guard, with concise Fixes notes matching 0.6.4. The later optional-comparison condition is delivery-only and is active on main. Release run https://github.com/MrLesk/groma.md/actions/runs/37300984928 passed. All five platform packages and groma.md report 0.6.5 on npm. The GitHub release contains five binaries and SHA256SUMS. A fresh isolated npm installation reports 0.6.5; its macOS binary SHA256 matches the release checksum. Main was fast-forwarded to the release workflow's version sync commit 507900a3.

Action adoption is tracked separately as TASK-5. Action v1.0.2 and @v1 point to 766bf95a1c51ff50f113aabaa843e30d6aa3758a, whose 17 local tests and current-map/comparison Check workflow passed. Marketplace shows v1.0.2 as latest. Both example workflows already use @v1, so they receive the new CLI without file changes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored successful main architecture publication while keeping optional comparison failures visible. Released Groma 0.6.5 with the shared first-scan setup fix and deployment guard; all platform packages, six assets and the fresh-install checksum are verified. Full local checks, three-platform CI and the real architecture workflow pass. Action v1.0.2 adopts the release through the existing @v1 examples. Scope correction and verification are recorded above.
<!-- SECTION:FINAL_SUMMARY:END -->
