---
id: TASK-616
title: Keep npm scanners current before scanning
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-16 16:09'
updated_date: '2026-10-16 16:36'
labels: []
dependencies: []
references:
  - src/scanner/modules/inventory.ts
  - src/scanner/modules/package.ts
  - src/scanner.ts
  - src/scanner/session.ts
  - src/plugins/management.ts
  - test-bun/scanner-update.test.ts
  - test-bun/scanner-installation.test.ts
documentation:
  - docs/config.md
  - docs/scanners/setup.md
modified_files:
  - test-bun/scanner-update.test.ts
  - src/scanner/modules/inventory.ts
  - src/scanner/modules/package.ts
  - src/scanner.ts
  - src/scanner/session.ts
  - src/scanner/modules/package-manager.ts
  - src/plugins/management.ts
  - src/plugins/cli.ts
  - src/viewers/web/startup/restore.ts
  - test-bun/scanner-installation.test.ts
  - docs/config.md
  - docs/scanners/setup.md
type: enhancement
ordinal: 683000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Alex wants people to receive scanner improvements automatically instead of remaining on the exact npm version saved by setup. Current scan and viewer startup load that saved version until someone invokes an update. Change the default version-selection policy using the existing package selector, cache and compatibility rules while preserving project settings. Alex explicitly excluded npm-unavailable and offline handling from this change: use existing error reporting, with no new fallback, retries or offline policy. Release publication remains paused.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Starting a scan or a live viewer selects and installs the newest stable compatible release of each configured npm scanner before the initial scan, without a manual update command; file-edit rescans keep that session’s selected version.
- [x] #2 Automatic updates preserve scanner identity, project settings, include/exclude lists and global flags; config.json records the selected release but no longer holds npm scanners on an older version. Git and local sources keep their declared selection.
- [x] #3 Restoring a configured npm scanner obtains the newest stable compatible release. A current release reuses its cached package and leaves the configuration unchanged.
- [ ] #4 Focused behavior tests and bun run check pass, documentation explains the automatic update policy, and Windows/Linux/macOS CI and Codex feedback are clear before merge.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep version selection and installation in src/scanner/modules/inventory.ts and package.ts. Add one operation that refreshes configured npm scanners through the existing updateScanner flow. Reuse the exact-version cache and avoid rewriting config.json when its selected release is unchanged. config.json records the release last selected, not a permanent npm lock. Git and local sources keep their existing selection semantics.
2. Call that operation before the first registry load in scanRepository, watchScan and createScannerSession. Keep registry loading read-only, and keep one loaded version for file-edit rescans. Restore an npm scanner through the same newest-compatible update path; preserve explicit read-only viewer behavior and existing error reporting. No npm-unavailable fallback or new retry logic.
3. Configuration is operational delivery state, not OKF architecture knowledge or a C4 concept. Version refresh belongs to existing plugin management and scanner startup; ordinary architecture Markdown and its metadata are unchanged. No new storage schema, settings field or extension point is needed.
4. Coverage authority and gap: Alex requires automatic improvements. Existing scanner-update tests cover only a manual update. Extend that registry fixture with runnable versions and observe the version actually used by live-session and CLI scan/watch entry points, catching a missed startup hook. Publish a newer fixture version while one session is open: file edits must use its existing loaded engine and the next session must use the new release, as declared in AC1. Existing restore tests promise old exact pins; replace that obsolete assertion and verify that restoration selects the newest compatible scanner while preserving settings. Repeating a current restore must reuse the cached package and leave configuration bytes unchanged, detecting repeated downloads or unnecessary rewrites in the normal startup flow. Add no offline tests.
5. Update the configuration guide, scanner setup guide and affected version-pin wording to describe automatic startup selection and current-release restoration. Preserve manual update and source-selection operations as explicit actions; their selected npm version is refreshed at the next startup.
6. Run focused tests and bun run check. Then run one cold simplicity review with task/diff/repository and no conversation history, apply accepted simplifications, and perform own specification/quality reviews. Run one final full-context complexity review. Commit only this task with its exact title, open one PR, check Codex feedback, and require Windows/Linux/macOS CI before merge. Publication remains paused.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Alex answered the offline-policy question by excluding those edge cases. No cached-scanner fallback, retry policy or offline behavior will be added. Existing package selection already chooses the newest stable release supported by this computer and Groma version; existing updateScanner preserves project settings. Actual npm installation currently invokes Bun even for an already installed version, so startup reuse belongs in the package installer. Planned changes do not overlap PR161/TASK615 modified files (web settings control/model, discovery guide and project-review tests).

The live-session regression runs1.0.0 before the fix when1.1.0 is available. Startup hooks now update configured npm sources before registry loading, and restoration uses the same update owner. A real supported-flow failure was then reproduced: publishing1.2.0 during a session is visible to pm view, but Bun install rejects it from stale manifest metadata. Bun1.4.3 install help and official documentation (https://bun.sh/docs/pm/cli/install#cache) confirm --no-cache ignores only the manifest cache. Install now uses that flag once for a needed download; installed exact packages remain reusable in Groma’s cache. No retry or offline fallback is involved.

Focused integration now passes all21configuration, installation and update tests. The changed installation test opens a colleague session with scan:false, so it now verifies two installed current version values rather than requiring ready (which means a completed scan). It still proves unchanged project configuration and architecture. New tests observe the actual executed scanner through a per-fixture local server, prove settings/global flags are preserved, prove file edits do not recheck releases, and prove the next startup installs a newly published version. Initial full check passed lint/types/16Node tests and883Bun cases; its only failure was the incorrect ready expectation just corrected. Final full check is running. No new offline or recovery behavior was added.

Final local validation passes: bun run check completed lint and type checking, 16 Node tests, and 884 Bun tests with 62 optional skips and zero failures. Focused update/installation/work-source integration passes 21 tests with 111 assertions. git diff --check passes and groma/ has no changes. The cold simplicity review passed with no findings or material simplifications. Implementer specification review confirms AC1–3: all scan/live startup paths refresh npm through the existing compatible-release selector; terminal and web share createScannerSession; file-edit rescans keep their loaded registry; restoration shares updateScanner; settings, identities and non-npm sources retain their existing owners. Implementer quality review traced startup through inventory, selection, exact-package cache, config write and registry execution. No new schema, dependency, pin mode, retry or offline fallback was introduced. Tests observe executed versions and downloads using isolated concurrent fixtures; the startup regression failed before the fix, and the stale-manifest failure was reproduced before the single-install metadata correction. Existing changed source files retain their architecture owners. Hosted Windows/Linux/macOS CI and latest-head Codex feedback remain pending, so AC4 and final verification stay open. Final full-context complexity review follows now. Release publication remains paused.

The final full-context complexity review passes with no material findings. It confirms the normal flow stays small: entry points choose startup timing, inventory owns selection/configuration, and the existing installer owns exact-package reuse and download. Supported usage is clear in the guides, with no new architecture concept or fallback policy. Preparing the task-scoped commit and PR now; Windows/Linux/macOS CI and latest-head Codex feedback remain the final merge gate.
<!-- SECTION:NOTES:END -->
