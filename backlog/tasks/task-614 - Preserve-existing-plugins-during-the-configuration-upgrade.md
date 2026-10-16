---
id: TASK-614
title: Preserve existing plugins during the configuration upgrade
status: Done
assignee:
  - '@codex'
created_date: '2026-10-16 14:10'
updated_date: '2026-10-16 14:48'
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
- [x] #2 Conversion records the installed Backlog CLI version when available, without reinstalling or initializing Backlog; without that CLI the converted workSources list is empty.
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
1. Keep the change in src/config.ts: the common reader uses the existing project lock, prefers config.json, and converts scanners.json only when config.json is absent. Reuse the current parser/writer and the bundled Backlog plugin readiness check. Preserve exact scanner sources, settings, include/exclude lists and global flags; record an installed Backlog CLI version without installing or initializing it; remove the old Groma-owned file after saving the new one.
2. Configuration is delivery state, not OKF architecture knowledge or a C4 element. No architecture metadata or containment meaning changes; ordinary Markdown remains unchanged. This is the explicitly approved one-time upgrade, not a permanent reader for two configuration formats.
3. Regression coverage: the user-approved upgrade must preserve scanner choices and existing Backlog tasks. Current tests cover explicit config.json and new-project setup, but no legacy conversion. Add one installed-CLI conversion test proving preserved settings, saved configuration and no re-registration after removal; one absent-CLI conversion in .groma; one existing-config test proving no CLI probe or rewrite even when an old file remains. Reuse the child-process fake CLI helper and make its launcher work on Windows so these rules run on all three CI systems.
4. Update project configuration documentation and the draft release Upgrading paragraph. Run focused tests, inspect the complete diff with specification and quality reviews, and run bun run check. Commit only this task's files and open a stacked PR; require Windows/Linux/macOS CI before it enters the release. Keep publication paused.
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
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The common configuration reader converts scanners.json once when config.json is absent, preserving scanner sources, settings, patterns and global flags. It records an installed Backlog CLI without installing or initializing it, saves config.json, then removes the old Groma-owned file. Existing config.json and later Backlog removals stay authoritative. Configuration documentation and the unpublished release upgrade notes explain the behavior. Before/after regression checks, bun run check (16 Node and 877 Bun tests, zero failures), and Windows/Linux/macOS CI run 38915675414 pass. PR #162 is stacked on #158; publication remains paused.
<!-- SECTION:FINAL_SUMMARY:END -->
