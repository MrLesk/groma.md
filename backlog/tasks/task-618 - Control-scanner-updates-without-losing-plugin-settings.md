---
id: TASK-618
title: Control scanner updates without losing plugin settings
status: Done
assignee:
  - '@codex'
created_date: '2026-10-17 05:12'
updated_date: '2026-10-17 05:49'
labels: []
dependencies: []
references:
  - src/scanner/modules/inventory.ts
  - src/plugins/management.ts
  - src/plugins/settings.ts
  - src/scanner/session.ts
  - src/viewers/web/settings/plugins.ts
  - src/viewers/tui/plugin-settings.ts
modified_files:
  - test-bun/scanner-update.test.ts
  - src/config.ts
  - src/scanner/modules/inventory.ts
  - src/plugins/management.ts
  - src/plugins/settings-model.ts
  - src/scanner/session.ts
  - src/viewers/web/map-session.ts
  - src/plugins/settings.ts
  - src/viewers/web/settings/plugins.ts
  - src/viewers/tui/plugin-settings.ts
  - test-bun/scanner-upgrades.test.ts
  - test-bun/project-review.test.ts
  - docs/config.md
  - docs/scanners/setup.md
  - test-bun/work-source-selection.test.ts
ordinal: 685000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Before the 0.7 release, manual plugin changes must preserve settings changed while packages download. People also need to control automatic updates from Plugins and fetch releases while a map stays open. The approved scope keeps startup and offline use immediate and uses the existing scan and map refresh flow.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Manual scanner and Backlog plugin changes preserve unrelated current configuration when operations overlap.
- [x] #2 Web and terminal Plugins show and save Automatic updates, enabled when the configuration omits the setting.
- [x] #3 Opening Plugins in a running map starts a background compatible scanner check without delaying the settings screen; overlapping checks share the in-flight work.
- [x] #4 Disabling automatic updates prevents automatic package selections and follow-up scans, including during a pending check; explicit updates still work.
- [x] #5 Updated scanners use the ordinary scan and map refresh flow without changing authored architecture or view controls.
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
1. Keep final config mutations in the config domain under the existing project lock, after downloads. Manual scanner and Backlog operations reread current state and only change their own selection; a conflicting same-plugin edit is reported.
2. Add the project automatic-updates action and setting to shared Plugins state, with one switch in web and one key control in terminal. This is operational config, with no new OKF metadata or C4 element. Existing plugin management owns persistence; scanner sessions own background work.
3. Reuse the session's background check at startup and when Plugins opens. Share the in-flight promise; opening settings remains immediate. Enabling starts a check; disabling uses the existing final config guard. Keep the ordinary scan/watch refresh and close cancellation.
4. Coverage: the reproduced manual-update race loses automaticUpdates and scanner settings; existing tests only preserve a static config. Extend scanner-update coverage with a held registry and an intervening config/plugin change. Existing update tests cover offline startup, pending disable and close; add one second-check test proving a newer release is applied after startup, overlapping callers share work, and refresh resolves while registry work is held. Extend the existing settings test for the action/default/persisted flag; manually verify both controls.
5. Run focused checks, tui-test and the web switch flow, then one cold simplicity review, implementer specification/quality reviews and one full-context complexity review. Run bun run check and three-platform CI before merging this task; include scanner-caused architecture changes and update release notes.
6. Final release qualification remains TASK-610: integrate latest main plus release/worker PRs, verify upgrade/Backlog, fresh restore, offline startup, authored architecture and shared view controls with the actual candidate. Publication stays paused; the Action PR stays unmerged until npm 0.7 is available.

Manual two-viewer validation reproduced a stale switch: terminal saved On, while an already open web Plugins view stayed Off. The current project setting must be shown by both controls (AC2). Extend the switch test with an external config change plus reconfigure, expecting refreshed state and no new scan; refresh settings when scanner inputs are unchanged.

Codex5d79 review identified two supported gaps: the web endpoint must retain documented available-version/error discovery with automatic updates enabled, and a concurrent same-Backlog version choice must not be overwritten after installation. Restore discovery for each explicit Plugins refresh while keeping its request asynchronous to the visible dialog. Compare the final Backlog selection with the original and intended versions under the same config lock. Extend the existing held-registry HTTP/settings coverage and fake-Backlog subprocess coverage; no new installer abstraction or retry is needed.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cold simplicity review passed with no material findings. Held-registry race fails before and passes after. Focused suite: 34 pass, 223 assertions. Web checkbox saves Off; tui-test toggles Off to On and captures /tmp/groma-task618-tui-on.svg. That cross-viewer run exposed stale settings state, now addressed in the existing reconfigure path.

Implementer specification review: AC1 uses final current-config mutations after downloads; the held-registry regression proves unrelated plugin removal, scanner settings, global useGitignore and automaticUpdates survive. AC2 web checkbox and terminal t persist the same project flag; the two-viewer stale-switch failure was reproduced before and verified after. AC3 startup and Plugins opening share background work; local refresh returns while the registry is held and a later release causes one normal rescan. AC4 pending disable and no extra flag-change scan pass; explicit updates retain existing coverage. AC5 existing scanner failure/curation and map-controls coverage remain passing. Quality review traced entry points through plugin settings, config mutation, session updates and ordinary scan ownership; no new architecture concept or retry/timer was introduced. Coalescing assertions now observe registry requests and scan results rather than promise identity. Cold review passed; its optional boolean timing comment was added. Full check: 16 Node, 894 Bun, 62 optional skips, zero failures; latest scanner-update assertions: 13 pass,118 assertions. Final full-context review follows.

The required scan made 26 stand-alone records for previously merged scanner source outside TASK-618. None belongs to a source file changed by this task. They remain untracked and unstaged; they are excluded from this task traceability and commit. Existing owners of this task source remain intact. Final full-context complexity review passed without findings.

Final current-tree bun run check passed: 16 Node tests; 894 Bun tests; 62 optional skips; zero failures;3679 Bun assertions. All changed functions satisfy Biome complexity<=15. Cold and full-context reviews passed. Web/TUI cross-viewer sync verified after the fix; screenshots /tmp/groma-task618-tui-on.svg and /tmp/groma-task618-tui-off.svg. Source owner inspection: src/config.ts belongs to Plugin packages; scanner/session.ts to Live scanner session. No architecture record for this task's source was created or changed by the scan. Remaining gate before merge/release: exact-head Windows/Linux/macOS CI and automated PR feedback.

Initial source5d79 passes all3platform CI39006384388 and architecture39006384389. Codex findings are recorded at /tmp/groma-task618-codex-findings.json and will be fixed before merge. Combined candidate d972eda9 passes its full localcheck and five CLI cross-builds; all6public scanner install and second-clone restore checks pass with the actual0.7 binary and Git-only PATH. Worker build-only run39006640891 remains in progress; publication is still paused.

Both Codex findings were reproduced before fixes and pass afterward: explicit Plugins discovery returns registry diagnostics with automatic updates enabled, and a Backlog installer cannot overwrite a concurrent version choice. Focused regression checks: 33 pass,200 assertions. Final bun run check:16 Node,897 Bun,62 optional skips,0 failures,3693 Bun assertions (/tmp/groma-task618-codex-check.log). Targeted specification and quality re-review confirms the two original findings and their regressions are addressed; no extra product behavior added.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Plugin changes now reread the current configuration after downloads and preserve unrelated edits; conflicting same-plugin choices are rejected. Web and terminal Plugins share the Automatic updates control, and opening Plugins starts a coalesced background check while preserving version discovery and registry diagnostics. Ordinary scan and map refresh behavior remains in place. Cold simplicity and full-context complexity reviews passed; web/TUI controls and concurrent edits were exercised. Final local check: 16 Node tests, 897 Bun tests, 62 optional skips, zero failures. Exact-head CI and automated feedback remain the merge gate; release publication stays paused.
<!-- SECTION:FINAL_SUMMARY:END -->
