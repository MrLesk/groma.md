---
id: TASK-617
title: Update scanners in the background without blocking scans
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-16 19:01'
updated_date: '2026-10-16 19:23'
labels: []
dependencies: []
references:
  - src/scanner/modules/inventory.ts
  - src/scanner/modules/package-manager.ts
  - src/scanner/modules/package.ts
  - src/scanner/modules/published.ts
  - src/scanner.ts
  - src/scanner/session.ts
  - src/scanner/cli.ts
  - test-bun/scanner-update.test.ts
  - src/scanner/background-updates.ts
  - src/cli.ts
  - src/config.ts
  - test-bun/work-source-selection.test.ts
documentation:
  - docs/config.md
  - docs/scanners/setup.md
modified_files:
  - test-bun/scanner-update.test.ts
  - src/scanner/modules/inventory.ts
  - src/scanner/modules/package-manager.ts
  - src/scanner/modules/published.ts
  - src/scanner/modules/package.ts
  - src/scanner/session.ts
  - src/scanner.ts
  - src/scanner/background-updates.ts
  - src/scanner/cli.ts
  - src/cli.ts
  - test-bun/scanner-installation.test.ts
  - docs/config.md
  - docs/scanners/setup.md
  - src/config.ts
  - test-bun/work-source-selection.test.ts
type: bug
ordinal: 684000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Automatic npm updates currently run before the installed registry loads. A disconnected or slow registry therefore delays or prevents scans even when the scanner is already on this computer. Alex requires immediate startup from installed scanners, no startup timeout, and continued offline use. After the background updates finish, trigger the normal scan flow so the existing architecture watcher refreshes the map; no separate map-update protocol is needed. This replaces TASK-616’s synchronous startup policy. Release publication remains paused.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Installed npm scanners run immediately in scan, watch and live-view startup without awaiting registry lookups or using a startup timeout; unavailable registry access leaves the installed version usable.
- [x] #2 Successful background updates preserve project settings and publish the completed scanner selection together, then trigger the normal scan flow with the updated scanners so the open map refreshes through existing behavior.
- [x] #3 A one-shot scan can finish while the background update check is still pending. Closing a live session does not wait for network checks. Manual plugin update and restoration retain their explicit errors and installation behavior.
- [ ] #4 Focused regressions prove startup before a deliberately held registry response, offline operation, updated rescan after release, and settings preservation. bun run check and Windows/Linux/macOS CI pass; review Codex feedback before merge.
- [x] #5 Project config accepts automaticUpdates as a boolean, defaults to true when absent, and false prevents automatic registry checks and follow-up scans while explicit plugin updates remain available.
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
1. Keep automaticUpdates in src/config.ts as an optional validated boolean, enabled when absent. The automatic updater checks it before registry work and again before saving changes. false disables background checks/apply/rescan only; explicit plugin update and restoration keep their behavior. 2. Scan installed packages immediately. Live sessions start registry work outside their startup/close queue, then use the existing reconfigure/scan path after completed changes. Watch mode shares that session, including scan summaries and error callbacks. Closing a live session aborts its package-manager work without a timeout. 3. Inventory owns replacement validation and selection. It prepares compatible updates for installed npm scanners, keeps current packages when background work fails, rereads current config, and saves successful sources together only where the original selection still matches. Current settings, include/exclude lists and global choices are preserved. Git/local sources and the explicit missing-plugin install/restore flow keep their existing owners. 4. The one-shot CLI owns its independent unreferenced worker so process exit does not wait for the registry. Its hidden scanner command completes updates and calls the normal installed-scanner scan only when sources changed. Source and standalone builds share this command. Existing scan/architecture watching updates the map; there is no separate map event, retry policy, cache index or startup timer. 5. Supported test rules come from Alex: cached offline use, immediate startup without a timeout, normal post-update rescan, and default-enabled configuration control. Extend the existing isolated registry fixture to observe actual executed versions and held metadata requests. Catch startup or exit waiting for a held response, a new version being written while the current flag is false, settings lost during a check, and failure to execute the updated scanner. Preserve explicit update/restore coverage, round-trip and validate the boolean in existing config tests, and reuse the held CLI case against a temporary standalone build. 6. This flag and package state are operational configuration, not new OKF knowledge or a C4 element. Ordinary architecture Markdown stays unchanged. Existing scanner inventory, package process and lifecycle components own the meaning; configuration/setup guides explain immediate installed-version use, background updates, normal rescans and the switch. 7. Require focused tests, bun run check, one cold simplicity review, own specification/quality reviews and one final full-context complexity review. Commit one task-scoped PR, handle appropriate Codex feedback, and require Windows/Linux/macOS CI before merge. Release publication remains paused.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Alex clarified the offline request further: registry checks must not block startup, no startup timeout should be introduced, and once all scanner updates are complete the normal scan flow should run so the map updates through its existing watcher. The previous next-session-only assumption is replaced by this approved post-update rescan. Context: inventory owns scanner replacements/config writes, package-manager owns Bun registry processes, session owns scanner watchers and reconfigure, and the web map already observes architecture changes. Bun’s installed child-process documentation confirms unref prevents a spawned child from keeping the one-shot parent alive; its installed types support AbortSignal cancellation. The change needs no cache index, new configuration field, custom map event or retry policy.

The held-registry regression fails before the fix: it observes registry access before session.ready instead of running the installed scanner. After implementation, all 8 focused update tests pass with 71 assertions, including real connection-refused offline scans in scan/watch/live modes and a one-shot CLI process that exits with its registry response held. No elapsed-time threshold or startup timer is used. Registry cancellation is tied only to closing a live session. Watch mode now shares the existing session lifecycle; its error callback and scan summaries are preserved. Missing packages remain explicitly restored through the existing plugin flow, as verified by the colleague-installation scenario.

Focused installation/update/work-source integration passes 24 tests with 136 assertions. The first full repository check passes 16 Node tests and 887 Bun tests with 62 optional skips and zero failures. Two unused internal command options were then removed, and Alex added the automaticUpdates switch; rerun the required full check after that final code change. Compiled CLI smoke validation is in progress.

The actual compiled executable passes the held-registry CLI test: the main scan process exits while its detached background worker is waiting for the registry. Source-mode focused integration passes after the automaticUpdates addition; the final full repository check is running. automaticUpdates is an optional validated boolean, enabled when absent. false exits the automatic updater before registry access; explicit update/restore paths do not use that gate. The field remains operational config, not architecture metadata or a new C4 concept.

Final focused integration passes 26 tests with 149 assertions after adding automaticUpdates; final TypeScript checking passes. The default-enabled behavior is exercised by the held-response live/CLI tests with the field absent. The false-field test proves zero registry reads and a successful explicit update; configuration validation round-trips true/false and refuses a string. All modified source/test files remain under 500 lines, no new cognitive-complexity warning is reported, and git diff --check passes. Starting the required cold simplicity review on the complete diff now.

Cold simplicity review passes with no material runtime simplification or blocking finding. Accepted its one test simplification: the CLI case now waits until the registry request is held, then observes natural parent exit while that response is still held. It no longer requires stdout to close before the request begins, avoiding an unnecessary scheduler-dependent ordering. The supported requirement and exit/version assertions are unchanged. Focused and final required checks follow before implementer specification/quality reviews.

First implementer specification/quality review traced CLI, live/watch, inventory, config and package-process ownership after the cold simplicity gate. All planned behavior is present, with one blocking AC5 finding: disabling automaticUpdates while the existing held registry check is pending still allows its completed selection to be applied. This is the same supported config-edit flow already covered for settings preservation. Reproduce and fix that current-setting check, then limit the own re-review to this finding and its regressions.

The disable-during-check regression reproduces the AC5 failure before the fix (update returned true and wrote the new selection despite the current false setting). The final write guard now requires an actual change, the current automaticUpdates setting still enabled, and an active session. This shares the existing commit guard instead of adding another helper; the function stays within the cognitive-complexity limit. Targeted specification/quality re-review is limited to this finding and its regressions.

Targeted own specification/quality re-review passes after the reproduced AC5 fix. The current automaticUpdates flag is checked with cancellation and actual changes immediately before the configuration write; the new regression now passes, settings edited during checks remain preserved, and explicit update/restore tests still pass. Focused integration now passes 27 tests with 156 assertions; git diff --check passes and changed-code lint reports no warnings. All five acceptance criteria have implementation/behavior evidence locally; the final full repository check is running and hosted three-platform CI/Codex review remain pending. No further code or architecture change is planned. Run the final full-context complexity review next.

Final qualification passes: bun run check completed lint/types, 16 Node tests and 890 Bun tests with 62 optional skips, zero failures and 3645 Bun assertions. Focused integration passes 27 tests with 155 assertions (correcting the earlier 156-count typo). The exact final standalone build passes the held-registry CLI exit smoke. Cold simplicity review passed and its one accepted test deletion was applied; own specification/quality review and targeted re-review pass; final full-context complexity review passes with no findings or material simplification. Current source/test files are within 500 lines and changed-code lint has no complexity warning. AC4 remains open only for hosted platform CI and Codex feedback. Preparing the PR now; publication remains paused.
<!-- SECTION:NOTES:END -->
