---
id: TASK-615
title: Highlight matching scanner recommendations in the web map
status: Done
assignee:
  - '@codex'
created_date: '2026-10-16 14:18'
updated_date: '2026-10-16 14:24'
labels: []
dependencies: []
references:
  - src/viewers/web/settings/control.ts
  - src/viewers/web/settings/model.ts
  - docs/scanners/discovery.md
  - test-bun/project-review.test.ts
modified_files:
  - src/viewers/web/settings/model.ts
  - src/viewers/web/settings/control.ts
  - test-bun/project-review.test.ts
  - docs/scanners/discovery.md
priority: medium
type: enhancement
ordinal: 676000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A developer opening an existing project's live web map can miss newly matching scanners after upgrading Groma. Discovery already supplies recommended scanners, but the toolbar indicator currently covers scanner problems and does not draw attention to additional support. Provide a small, informational recommendation badge through the existing Settings and Plugins entry points. Recommendations still come from the scanner catalogue bundled with the installed Groma release; this task does not add remote scanner discovery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On live map startup and plugin-settings refresh, the visible Settings control and Plugins menu entry show the number of matching scanner recommendations that are not configured for this project.
- [x] #2 No recommendation badge appears when this count is zero. Configured scanners, missing copies of configured plugins, available work sources such as Backlog.md, and newer versions of configured scanners are excluded from this count.
- [x] #3 Opening Plugins lets the developer inspect the existing Recommended scanner rows, matching project files and Install actions. Installing a recommendation updates the badge when settings refresh.
- [x] #4 The recommendation badge remains distinct from existing missing or blocked plugin warnings, preserves their current actions, and exposes its meaning and count accessibly without relying on colour alone.
- [x] #5 The change reuses existing discovery and settings state. It does not install scanners automatically or add a remote catalogue, background polling, notification history or architecture metadata.
- [x] #6 Relevant documentation explains the badge and that newly introduced official scanners become discoverable after updating Groma to a release whose embedded catalogue includes them.
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
1. Keep this change in web Settings: count matching unlisted scanner rows from the shared PluginSettings state; do not alter discovery, warnings, upgrade checks or architecture metadata.
2. Add small numeric badges to Settings and Plugins, with accessible labels and titles carrying the count and meaning. Update both in the existing settings-state callback on startup, live refresh and installation.
3. Coverage authority is AC 1-4: existing project-review tests cover warnings, scanner-settings tests cover grouping/install/restore actions and upgrades tests cover version offers, but no test covers recommendation counts. Extend project-review coverage with mixed configured/missing/work-source/unmatched rows and a recommendation-to-configured transition; an incorrect count or changed warning/install action must fail. Exercise actual controls, Recommended evidence and Install in the available browser/DOM harness.
4. Briefly document visible behavior and the embedded catalogue release boundary in docs/scanners/discovery.md. Run focused tests, bun run check, and implementer specification/quality reviews. This is a bounded UI addition, with no substantial domain or architecture change requiring separate-agent reviews.
5. Finalize the existing task, check task-related groma changes, commit only task files, open the PR with the supplied template, and follow existing Linux/macOS/Windows CI.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Copied the exact uncommitted TASK-615 record from the primary checkout before CLI lifecycle updates (cmp passed). Isolated managed worktree begins at origin/main cabcec72. Current shared owner is src/plugins/settings-model.ts and src/plugins/settings.ts; web binding is settings/plugins.ts. No files overlap the main checkout edits for this task, so no other agent was contacted. OKF/C4: this badge is operational configuration owned by existing Settings, not stored architecture knowledge or a C4 element. Counting current matching scanner rows does not depend on a specific language or project.

Focused tests: bun test project-review, scanner-settings and scanner-upgrades suites: 12 pass, 0 fail (65 assertions). Disposable browser harness used the production settingsControl/createProjectSettings and bindPluginSettings. Browser/DOM evidence: startup Settings and Plugins exposed 2 matching recommendations accessibly; Recommended rows showed Python/Rust and api/pyproject.toml; Install emitted {action: install, id: python} and both badges became 1; onPluginSettings removed the last recommendation and both badges disappeared with base Settings/Plugins labels restored. The separate blocked warning remained visible and opened its scanner details. No architecture state was scanned or rewritten.

Full bun run check passed (exit 0): Biome lint and scrollbar rule, TypeScript, Node tests, and Bun 876 pass / 62 optional skips / 0 fail. Existing lint findings are outside the changed files. Implementer specification review: AC 1/3 verified in browser startup, install result and onPluginSettings refresh; AC 2 verified by mixed-state tests and zero DOM state; AC 4 verified through accessible count labels, visible numeric badges and preserved warning target/actions; AC 5 confirmed by the four-file diff and unchanged discovery/state owner; AC 6 documented in discovery.md. Quality review traced settingsControl -> createProjectSettings -> bindPluginSettings onState -> scannerRecommendationCount -> both controls; each responsibility remains in its existing owner. Tests fail on incorrect inclusion or a stale count after selection changes, and do not freeze prose or decorative details. No blocking findings, unnecessary modules or new dependencies. git diff --check passed; git status --short groma/ was empty.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Settings and Plugins now show matching scanner recommendation counts from current plugin settings, with accessible meaning/count labels and no badge at zero. Existing Recommended evidence/Install actions and scanner warnings remain separate. Documented the visible flow and that new official scanners require a Groma release containing their embedded metadata. Focused tests, production-controller browser/DOM verification and full bun run check passed. No architecture metadata or dependencies changed. Delivery uses the existing TASK-615 record in an isolated worktree; PR remains open for review.
<!-- SECTION:FINAL_SUMMARY:END -->
