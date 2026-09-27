---
id: TASK-531
title: Publish PR architecture comparisons for groma.md pull requests
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-27 15:11'
updated_date: '2026-09-27 15:18'
labels: []
dependencies: []
modified_files:
  - .github/workflows/architecture.yml
ordinal: 616000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
groma.md-action v1.0.0 gives public repositories an automatic before/after architecture comparison on every pull request, and groma.md is about to announce it. groma.md's own pull requests do not get one. Its GitHub Pages site already serves its architecture map from the "Groma architecture" workflow, and the Action's complete PR workflow assumes it owns a dedicated Pages site kept on a groma-previews branch at /pr-<n>/architecture/<theme>/.

Owner decisions (Alex, 2026-09-27): use the groma.md Action v1 for the comparison export; add no branch to store previews; serve each PR comparison at https://mrlesk.github.io/groma.md/comparison/pr-<n>/auto/, next to the map at /architecture/auto/. Consequence: with nothing storing previews between deploys, every Pages deploy rebuilds the map and the comparison of each open PR, and a closed PR's comparison is dropped at the next deploy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Opening or pushing to a groma.md pull request posts or updates one bot comment with the component and relationship change counts and a link to https://mrlesk.github.io/groma.md/comparison/pr-<n>/auto/ comparing the pull request's merge base with its head
- [ ] #2 The comparison is exported with MrLesk/groma.md-action@v1
- [ ] #3 Publishing a pull request comparison keeps the architecture map at /architecture/auto/ current, and publishing the map keeps the comparison of every open pull request
- [ ] #4 No branch is added to the repository to store previews
- [ ] #5 Jobs that check out pull request code have read-only permissions; the job that deploys Pages and writes the comment runs no pull request code
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
1. Keep .github/workflows/architecture.yml as the only Pages publisher and also run it on pull_request_target (opened, synchronize, reopened, closed).
2. A pulls job lists the open pull requests (number, head SHA, base SHA). A closed pull request is no longer listed, so its comparison drops out of the next deploy.
3. A compare matrix job per open pull request, read-only: check out the head with full history, take the merge base, export with MrLesk/groma.md-action@v1, move architecture/auto to comparison/pr-<n>/auto and upload it. fail-fast is off so one pull request cannot block another.
4. The build job exports the map as today and adds the uploaded comparisons to the Pages artifact. It still runs when a comparison fails, so the map keeps publishing as it does today.
5. deploy stays as it is and also outputs the page URL.
6. A comment job writes one marked bot comment per compared pull request, with the same marker and layout as the Action's comment, and skips unchanged bodies.

Tests: none added. These rules live in workflow YAML that bun run check does not execute; the Action's own tests cover the export and its counts. Verification: a dry run of Action v1 with Groma 0.6.0 on PR #110 (2 s, 22 MB, 1 modified component, scanners.json restored), a YAML parse, then a live run after the push.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dry run before the push: MrLesk/groma.md-action v1 prepare.mjs and comparison.mjs with groma.md@0.6.0 on PR #110 (fork, head f4f758e, merge base 5882073). The export took 2 s and is 22 MB; comparison.json reports 1 modified component; groma/scanners.json was restored afterwards. The export loads ./render.js relatively, so moving it to comparison/pr-<n>/auto keeps it working.
Local checks: the workflow YAML parses (jobs pulls, compare, build, deploy, comment; triggers push, pull_request_target, workflow_dispatch); the open-pull-request list yields [{number:110, head, base}]; the comment script renders the Action's format with the /comparison/pr-110/auto/ link; an empty preview set runs no iterations.
bun run check is not run: it does not read workflow files. The live run after the push is the check.
<!-- SECTION:NOTES:END -->
