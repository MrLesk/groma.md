---
id: TASK-531
title: Publish PR architecture comparisons for groma.md pull requests
status: Done
assignee:
  - '@claude'
created_date: '2026-09-27 15:11'
updated_date: '2026-09-27 15:38'
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
- [x] #1 Opening or pushing to a groma.md pull request posts or updates one bot comment with the component and relationship change counts and a link to https://mrlesk.github.io/groma.md/comparison/pr-<n>/auto/ comparing the pull request's merge base with its head
- [x] #2 The comparison is exported with MrLesk/groma.md-action@v1
- [x] #3 Publishing a pull request comparison keeps the architecture map at /architecture/auto/ current, and publishing the map keeps the comparison of every open pull request
- [x] #4 No branch is added to the repository to store previews
- [x] #5 Jobs that check out pull request code have read-only permissions; the job that deploys Pages and writes the comment runs no pull request code
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

Live, 2026-09-27: 5cbde346 pushed to main. Groma architecture run 36329184618 succeeded (pulls, compare for #110, build, deploy, comment). /architecture/auto/ and /comparison/pr-110/auto/?revision=f4f758e&from=5882073 both return 200 and render with no page errors: the comparison header shows both commits and the Changes list shows Scanner discovery modified. Bot comment 5857149194 on #110 uses the Action format and link. CI passed on 5cbde346. Not yet exercised live: a pull_request_target event (open, push, close); this run came from the push to main.

Pull request events, verified live with throwaway draft PR #112 (one component description edited through the CLI):
- opened: run 36329692498 posted comment 5857246104 (1 modified component, merge base 5cbde34 to 4334267); /comparison/pr-112/auto/ returned 200; #110's comment was untouched (updated_at unchanged), so identical bodies are skipped.
- synchronize: run 36329885551 updated the same comment to head c182936.
- closed: run 36330037174 compared only #110; afterwards /comparison/pr-112/auto/ returned 404 while /comparison/pr-110/auto/ and /architecture/auto/ returned 200.
The PR was closed and its branch deleted.
Final polish, not yet pushed: the matrix job is now named "Compare PR #<n>" instead of listing its three matrix values.

Job token permissions, from the logs of run 36330037174: compare, the only job that checks out pull request code, had Contents read. build (main checkout) had Contents and Pages read. deploy (no checkout) had Pages write. comment (no checkout) had PullRequests write. pulls had PullRequests read.
Correction before the final push: an unquoted job name "Compare PR #${{ ... }}" parses as a YAML comment after " #", so it is quoted. The Bun.YAML parse now returns the full name.
No documentation change: no doc describes the Pages workflow. The README's live-map link (/architecture/auto/) is unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
groma.md pull requests now get an automatic architecture comparison. .github/workflows/architecture.yml, still the only Pages publisher, also runs on pull_request_target. It lists the open pull requests and, in a read-only job per pull request, exports its merge-base-to-head comparison with MrLesk/groma.md-action@v1. It places each comparison at /comparison/pr-<n>/auto/, deploys them with the architecture map, and keeps one bot comment per pull request in the Action's format. With no previews branch, every deploy rebuilds each open pull request's comparison, and a closed pull request's comparison is dropped. Verified live: push run 36329184618 commented on #110. Throwaway PR #112 was opened, pushed and closed (runs 36329692498, 36329885551, 36330037174): the comment was created, then updated in place, and on close the preview returned 404 while #110 and the map stayed 200. The job token permissions match the read-only design.
<!-- SECTION:FINAL_SUMMARY:END -->
