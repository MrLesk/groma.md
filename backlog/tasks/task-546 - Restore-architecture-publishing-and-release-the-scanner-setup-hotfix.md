---
id: TASK-546
title: Restore architecture publishing and release the scanner setup hotfix
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-05 10:57'
updated_date: '2026-10-05 11:00'
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
The architecture workflow rebuilds comparisons for each open PR. PRs 110 and 113 use snapshots from before relationships moved into their source elements, so the installed Action reports an invalid flow. The main map builds successfully but deployment is skipped because a failed comparison remains an ancestor job. Alex requested both workflow failures fixed and Groma 0.6.5 released with the already-verified simultaneous-view setup fix. Keep current architecture semantics and preserve each PR author change when updating the branches.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A successful architecture build deploys even when a comparison job fails, while failed builds and canceled runs do not deploy.
- [ ] #2 PRs 110 and 113 compare current-format architecture successfully after bringing their branches up to date, with their original source changes preserved.
- [ ] #3 Groma 0.6.5 includes TASK-545 and the workflow fix, publishes all current platform packages and assets, and uses concise release notes matching 0.6.4.
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
1. Add an explicit deploy job condition using cancellation state and the successful build result. This restores the behavior already stated by the workflow. No Markdown, OKF metadata or C4 meaning changes are required. GitHub is the executor; a pushed commit is the entry point; successful map publication is the visible result. 2. Validate the workflow condition and run bun run check. No new source-text test: only a real failed-comparison run can prove deployment continues through the job dependency chain. 3. Commit and push the scoped workflow fix; verify actual deployment while the old comparison snapshots still fail. Update both PR branches with current main, resolving real conflicts while preserving their requested source changes, and verify the resulting comparison jobs. 4. Publish 0.6.5 from the verified commit with only unreleased changes in the notes. Wait for the existing release workflow and verify GitHub assets plus npm versions. Inspect the Action examples and its pinned CLI so it can adopt the hotfix through its own scoped change.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Deployment now explicitly requires a successful build and a non-canceled run. This bypasses the comparison failure in the ancestor chain without publishing failed builds. The workflow already states that a failed comparison must not block the main map; a real GitHub run will verify that behavior. TASK-545 passed CI on Linux, macOS and Windows. PR 110 is mergeable; PR 113 has real conflicts and will need a reviewed merge of current main in an isolated checkout. Alex also asked to update the Action examples, so inspect its latest main and make a separately tracked adoption change there.

bun run check passed: 16 Node tests, 760 Bun tests, 48 skips, zero failures; log /private/tmp/groma-546-check.log. git diff --check passed and groma/ is unchanged. Own specification and quality review of the one-line condition confirms that only a successful build in a non-canceled run can deploy, regardless of earlier comparison failures. Ownership stays in the deployment job and no helper, dependency, source-text test or model change is added. The Action examples already use @v1; adoption is tracked as Action TASK-5 in its clean checkout.
<!-- SECTION:NOTES:END -->
