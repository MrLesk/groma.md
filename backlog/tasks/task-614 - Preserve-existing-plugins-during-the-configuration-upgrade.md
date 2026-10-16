---
id: TASK-614
title: Preserve existing plugins during the configuration upgrade
status: Done
assignee:
  - '@codex'
created_date: '2026-10-16 14:10'
updated_date: '2026-10-16 15:17'
labels: []
dependencies: []
references:
  - src/config.ts
  - test-bun/work-source-selection.test.ts
  - docs/config.md
documentation:
  - docs/config.md
modified_files:
  - test-bun/work-source-selection.test.ts
  - src/config.ts
  - docs/config.md
type: bug
ordinal: 682000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Alex approved a one-time upgrade before Groma 0.7.0. Existing projects otherwise lose their scanner selection and implicitly enabled Backlog tasks when config.json replaces scanners.json. Existing explicit config.json choices must remain authoritative. This approval is the scoped migration exception to the earlier prototype replacement rule in TASK-568.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When config.json is absent and scanners.json exists, the first configuration read creates config.json with the same scanner pins, settings, include/exclude lists and global flags, then removes scanners.json.
- [x] #2 Conversion records an installed Backlog CLI version without reinstalling or initializing Backlog, unless a legacy scanner already owns the backlog plugin ID; that scanner is preserved. Without the CLI or with that ID occupied, workSources is empty.
- [x] #3 An existing config.json is unchanged, no legacy file is read or removed, and an explicit Backlog removal is respected on later reads.
- [x] #4 Project configuration documentation and the draft upgrade notes describe the one-time conversion; focused checks and the repository check pass, with Windows/Linux/macOS CI required before release.
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
1. Keep the approved one-time conversion in readGromaConfig, using the existing project lock, parser, writer and Backlog readiness check. Existing config.json remains authoritative; preserve scanner selections and remove scanners.json only after saving the new configuration.
2. Honor the existing global plugin-ID rule: if a legacy scanner already owns the backlog ID, preserve that scanner and do not auto-register or probe the Backlog work source. Otherwise record an installed Backlog CLI version without installing or initializing it. This resolves Codex finding discussion_r4295734222 within the approved configuration-preservation flow.
3. Existing concurrent child-process tests cover normal installed-CLI conversion, missing CLI and existing config.json. Add one collision regression: a valid legacy custom scanner with ID backlog currently makes writeGromaConfig reject every configuration read. Prove its configuration now converts and remains usable, without adding a duplicate work source or calling the CLI. This is the smallest gap identified by the user-requested Codex review and the documented global ID constraint.
4. Configuration is delivery state, not OKF knowledge or a C4 element; no architecture meaning or stored metadata changes. Explain the ID condition in project configuration documentation and draft upgrade notes.
5. Deliver PR #162 directly to latest main, including TASK-613 layout changes in its base, without the paused release metadata or TypeScript packaging commits. Run the collision regression before and after the fix, bun run check, and Windows/Linux/macOS CI. Review only the reported finding, its fix and merge-update regressions. Merge after checks and Codex feedback pass; npm and GitHub publication remain paused.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Before the fix, both upgrade regression cases fail because config.json is never created; the existing-config guard already passes. The common reader now performs the approved conversion under the existing project lock, reusing the parser/writer and Backlog readiness check.

All 11 focused work-source/configuration tests pass after the fix. Both conversion cases failed before it. Updated docs/config.md and the still-unpublished v0.7.0 draft Upgrading paragraph to explain automatic conversion and installed-CLI registration; other release headings and notes stay in the approved eight-release format. The release target remains the prior qualified commit until this fix passes CI.

Own quality review keeps the isolated Windows fake-CLI PATH limited to its bin directory and native System32 commands, because the existing adapter launches cmd.exe for npm-style .cmd shims. This avoids relying on an interpreter search outside the controlled test environment. Source behavior is unchanged.

Specification review: the common reader converts only a missing config.json with an existing scanners.json; all scanner fields/global flags are preserved; installed Backlog is recorded through the existing readiness contract; no installer or initializer runs. Existing config.json wins, including an explicit Backlog opt-out. The old file is removed only after the new file validates and saves. Documentation and draft upgrade notes match that behavior.

Quality/simplicity review: the complete flow stays in the existing configuration owner, uses the existing project lock/parser/writer and adds no public API, framework or migration schema. The bundled Backlog readiness import has no dependency back on Groma configuration. A junior developer can follow readGromaConfig from the existing-file branch through conversion and normal configuration reads. Three isolated regression cases cover the accepted upgrade and preservation rules; the two conversion cases fail before the fix. Every test owns its fixture, fake CLI and child environment. Existing config/source tests cover downstream plugin selection. No authority-backed blocking source finding remains; Windows/Linux/macOS CI is the remaining release gate.

Final local bun run check passes lint and type checks, 16 Node tests, 877 Bun tests, 62 optional skips, zero failures and 3565 Bun assertions (/tmp/groma-task614-final-check.log). The final Windows fake-CLI environment keeps only its controlled bin and native System32 commands. Own specification/quality/simplicity review is complete with no blocking finding. git diff --check passes; groma/ is unchanged because this operational configuration fix changes no architecture concept or source ownership. Platform CI remains pending and publication stays paused.

Windows, Linux and macOS CI all pass for source commit 64a6c7738157d3f976aab861d00467612bb7709a: https://github.com/MrLesk/groma.md/actions/runs/38915675414. This verifies the approved conversion and configuration-preservation cases on all three systems. No blocking specification or quality finding remains. Release publication remains paused; this task delivers the upgrade in stacked PR #162.

Alex asked for active work to get PR #162 merged and for appropriate Codex feedback fixes. The three upgrade source/test/documentation files on main8affbc2f match the old stacked base exactly. Existing migration commits were applied cleanly in a separate managed checkout, preserving the old release checkout and its uncommitted TASK-610 progress record. Codex review discussion_r4295734222 reproduces a duplicate global plugin ID when a valid legacy scanner is named backlog; preserve that explicit scanner choice and skip automatic work-source registration for that ID.

Codex collision regression fails before the fix: readGromaConfig reaches writeGromaConfig, which rejects the duplicate backlog ID. The source fix now checks the existing scanner selection before probing or registering Backlog. An explicit scanner keeps its ID and the old configuration converts normally with an empty workSources list. The documentation states this existing global-ID constraint.

The duplicate-ID regression fails before the fix with requireUniqueIds rejecting backlog, then all 12 focused configuration/work-source tests pass afterward (27 assertions). The installed fake CLI receives no call when a scanner already owns the ID. Own targeted specification/quality review confirms the scanner selection is preserved, the shared global-ID contract stays unchanged, normal automatic registration still passes, and no new abstraction or architecture metadata is introduced. The project guide and unpublished draft upgrade note now state the ID condition. Full repository check on the latest-main combination is running.

Latest-main repository check passes after the Codex fix: bun run check completes lint, types, 16 Node tests and 880 Bun tests, with 62 optional skips, zero failures and 3567 Bun assertions (/tmp/groma-task614-main-check.log). The focused collision test fails before the fix and all 12 configuration/work-source tests pass afterward. The only source difference from the previously reviewed migration is the guard preserving an already selected backlog scanner ID; the documentation and one regression test explain and prove it. The branch is based on main8affbc2f, so it includes the merged shared-map-layout feature and excludes release metadata/packaging changes. Windows/Linux/macOS CI and refreshed Codex review remain the merge gates.

The latest-main source commit 5bd51205b41530ff37c269ad0b5de1d2c5f9f3c9 passes Windows, Linux and macOS CI run 38921394645 and architecture workflow 38921391574. Refreshed Codex code review for that exact commit completed with no findings or unresolved findings. Original review thread PRRT_kwDOTVpKCM6tPlki is resolved after reproducing the collision and proving the fix. Own targeted specification/quality review found no blocking issue in the guard, its regression test or the clean main update. main remains8affbc2f. This final task-record commit changes no source or tests; its automatic checks must finish before the direct-to-main merge. npm and GitHub publication remain paused.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The configuration reader converts scanners.json once when config.json is missing, preserving scanner selections and global options. It records an installed Backlog CLI without installation or initialization, unless a selected scanner already owns the backlog ID; that scanner keeps its identity and remains usable. Existing config.json and later Backlog removals remain authoritative. Documentation and draft upgrade notes explain the behavior. Conversion and collision regressions fail before their fixes and pass afterward; all 12 focused cases and bun run check pass (16 Node, 880 Bun, 62 optional skips, zero failures). Latest-main source5bd51205 passes Windows/Linux/macOS CI38921394645, architecture38921391574 and refreshed Codex review with no findings. PR #162 now targets main directly, independently of the paused release metadata and packaging changes. Publication remains paused.
<!-- SECTION:FINAL_SUMMARY:END -->
