---
id: TASK-556
title: Use a trusted checkout and pinned reader for architecture comparisons
status: Done
assignee:
  - '@codex'
created_date: '2026-10-06 10:37'
updated_date: '2026-10-06 10:48'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md-action/pull/5'
modified_files:
  - .github/workflows/architecture.yml
  - README.md
  - CONTRIBUTING.md
type: bug
ordinal: 639000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The architecture workflow uses the moving Action v1 tag, which also changed its bundled Groma reader. The stale audit PR exposed that coupling when newer Groma could not load its committed format. Pin the reader independently, using the new groma-version Action input, so delivery updates cannot silently replace it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The architecture comparison workflow selects an exact released Groma CLI version independently of the Action release.
- [x] #2 The supported current PR comparison exports successfully and the repository checks pass.
- [x] #3 Fork PR comparisons keep the base checked out and fetch the requested head as Git data without disabling checkout protections.
- [x] #4 Automatic runs omit fork PRs; Run workflow can include a specific reviewed PR by number for that run only.
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
1. Select released Groma 0.6.6 in architecture.yml through the new Action groma-version input, using a tested Action commit that implements the input.
2. Run the existing repository check and validate real comparison export. No new unit tests: this is workflow wiring; the Action integration verifies version selection and existing comparison assertions cover output.
3. Review the one workflow change and open a focused PR independently of the audit PR. No OKF or C4 model change; the workflow owns the reader version, Groma owns parsing and comparison.

Run 37451040362 reproduced a second blocker: checkout v7 rejects checking out the fork PR head in pull_request_target. Change checkout ref to the trusted base and fetch the requested head in the merge-base step. Groma already extracts both committed snapshots, so the PR working tree is unnecessary. The Action example and existing integration coverage receive the same correction under Action TASK-6. No new compatibility, fallback, or model behavior.

User approved maintainer-triggered fork comparisons. Add an optional PR number to workflow_dispatch. List only same-repository PRs automatically; include the explicitly selected external PR only on a manual run. Keep the existing whole-site rebuild, exact commit comparison, and publication flow.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The selected Action commit 63e68636 passed Check on push and pull request (runs 37450953881 and 37450988889), including a default Groma 0.6.5 map and an explicitly selected 0.6.6 comparison. No architecture element owns the workflow file, so no architecture reference or generated record is required.

Action b77da940 passed Check with the working checkout at the before commit (runs 37451313962 and 37451319745). The first local repository check hit sandbox-denied listeners and FSEvents; rerun with normal host access rather than changing tests.

Manual selection checked against current GitHub data: default reviewed=0 returns no fork PR; reviewed=113 returns the exact current #113 head and base. The selected Action 7093f81 passes both Check runs with the final manual publisher. Own specification/quality review confirms the job keeps read-only permissions, leaves checkout protection enabled, and uses only explicit Git revisions. The existing complete-site deployment remains unchanged.

Final bun run check passed: lint, types and Node checks; 773 Bun tests passed, 51 optional skips, zero failures. The actual #113 comparison exported with released Groma 0.6.6 from a trusted main checkout (16 modified components, zero relationship changes). Workflow selection excludes the fork by default and includes it only for reviewed=113. README and contributor instructions describe automatic versus manual runs and explicit reader upgrades. Final implementer specification/quality review passed; no core parser or architecture changes were needed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Architecture comparisons use the trusted base checkout and released Groma 0.6.6. Normal runs select only same-repository PRs; maintainers can include a reviewed fork using the Run workflow PR-number input. The Action is pinned to its tested implementation, and its Groma reader is pinned separately. Full repository checks, released-CLI comparison, and automatic/manual selection checks pass. The existing full-site deployment behavior is documented.
<!-- SECTION:FINAL_SUMMARY:END -->
