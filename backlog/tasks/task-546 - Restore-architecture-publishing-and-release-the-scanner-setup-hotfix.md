---
id: TASK-546
title: Restore architecture publishing and release the scanner setup hotfix
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-05 10:57'
updated_date: '2026-10-05 11:14'
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
- [ ] #1 A successful architecture build deploys even when a comparison job fails, while failed builds and canceled runs do not deploy.
- [ ] #2 Optional PR comparison failures remain reported in their job logs without failing the main architecture publishing workflow; successful comparison artifacts still join the site.
- [ ] #3 Groma 0.6.5 includes TASK-545 and the workflow deployment fix, publishes all current platform packages and assets, and uses concise release notes matching 0.6.4.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep deployment explicitly conditional on a successful build and a non-canceled run. Make optional comparison jobs continue on error, matching the existing workflow contract that missing comparisons do not block the main site. A pushed main commit is the entry point and a published current map is the required result. 2. Use the existing repository check and real GitHub executions to verify successful build/deploy through a failed comparison; add no source-text tests or architecture-format compatibility. 3. Commit and push only main workflow changes and the task record, then verify the complete main publishing workflow. No further PR branch changes are authorized. 4. Complete the already-started 0.6.5 publication from its tested release commit, verify assets and npm packages, and adopt the hotfix in the Action main release whose examples already use @v1.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Deployment now explicitly requires a successful build and a non-canceled run. This bypasses the comparison failure in the ancestor chain without publishing failed builds. The workflow already states that a failed comparison must not block the main map; a real GitHub run will verify that behavior. TASK-545 passed CI on Linux, macOS and Windows. PR 110 is mergeable; PR 113 has real conflicts and will need a reviewed merge of current main in an isolated checkout. Alex also asked to update the Action examples, so inspect its latest main and make a separately tracked adoption change there.

bun run check passed: 16 Node tests, 760 Bun tests, 48 skips, zero failures; log /private/tmp/groma-546-check.log. git diff --check passed and groma/ is unchanged. Own specification and quality review of the one-line condition confirms that only a successful build in a non-canceled run can deploy, regardless of earlier comparison failures. Ownership stays in the deployment job and no helper, dependency, source-text test or model change is added. The Action examples already use @v1; adoption is tracked as Action TASK-5 in its clean checkout.

The isolated merge of main into PR 113 has three conflicts: architecture.yml must retain the author SHA pins while adding main comparison jobs; GromaFileSystem.write must retain the author atomic-write sequence followed by the current root-index refresh; the author relationship escaping must move from obsolete markdown-emitter helpers into the current relationship-storage writer. Imported upstream architecture already supplies current-format relationships. These are PR-branch integration changes only; the release branch keeps the small workflow fix. Preserve the original PR head as an ancestor and adapt its existing escaping regression to the current writer instead of restoring removed APIs.

Architecture workflow 37300228193 proves the deployment fix: both old comparisons failed, but build, deploy and comment all succeeded. The PR 113 workflow conflict now keeps main comparison jobs and the deploy guard plus the original audit SHA pin for the Pages upload action.

Resolved the PR 113 filesystem conflict by keeping the existing audit temporary-file/rename write, then refreshing the bundle root index when the write adds a top-level entry. No new filesystem behavior was added to main or the hotfix.

Resolved markdown-emitter in PR 113 to the current main implementation. Its only audit changes were escaping inside the removed relationship helpers; those same escaping rules are being retained in relationship-storage, which now owns row writing. This removes obsolete code rather than adding compatibility APIs.

PR 113 relationship-storage now uses the exact three escaping helpers from its original emitter change. Rows keep source ownership and the current four-column Markdown shape; ordinary readers still see links and prose, and C4 endpoints and direction are unchanged. No legacy document is restored.

The PR 113 escaping tests now use the current withStoredRelationships writer and source-owned component rows. Existing round-trip, ordinary endpoints, escaped-row removal, derived HTTP labels and full-model scenarios remain. Tests read the existing relationship-pairs fixture and identify only the hostile-source relationship in the complete model, leaving unrelated fixture rows intact. No legacy record or added scenario is introduced.

Alex explicitly stopped other-PR work. PR 110 had already been updated through the GitHub update-branch API to 604a20a7507f560910976879baca727efd00c24b. Nothing was pushed to PR 113; its isolated integration is no longer in scope and its running full check was interrupted. Preserve this correction history, but limit the final modified-file list and release scope to main architecture.yml. Add job-level continue-on-error for optional comparisons: the existing build contract already permits a failed comparison to leave that preview out while publishing the main map.

The optional comparison matrix now sets job-level continue-on-error. Failed exports retain their job errors and produce no preview; successful artifacts still join the main site. Deployment still requires a successful build and a non-canceled run. This restores the already-documented delivery behavior without reading old architecture formats or changing another PR.

The isolated PR 113 checkout is archived with a recoverable local snapshot and no push. PR artifacts were unlinked from this chat after Alex stopped that scope. The second main-only condition uses GitHub job-level continue-on-error, confirmed by the official workflow syntax documentation: it prevents a failed optional job from failing the workflow run. The first real run already demonstrated successful main deployment through failed comparisons; the next main run will verify the overall workflow succeeds too.

The complete main-only change passes bun run check again: 16 Node tests, 760 Bun tests, 48 skips and zero failures (/private/tmp/groma-546-main-check.log). git diff --check passes and groma/ has no changes. Own quality review finds two job-owned conditions only: optional comparison failure does not fail the main workflow, and deploy requires a successful build in a non-canceled run. The artifact collection, successful previews and main CLI behavior are unchanged. Groma 0.6.5 was published from 05d91e53 after its Linux/macOS/Windows CI passed; its existing release pipeline is now building the platform binaries.
<!-- SECTION:NOTES:END -->
