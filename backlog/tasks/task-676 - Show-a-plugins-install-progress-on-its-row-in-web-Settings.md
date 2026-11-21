---
id: TASK-676
title: Show a plugin's install progress on its row in web Settings
status: Done
assignee:
  - '@claude'
created_date: '2026-11-21T22:50:00Z'
updated_date: '2026-11-21T23:27:00Z'
labels:
  - web
dependencies: []
references:
  - src/viewers/web/settings/plugins.ts
  - src/plugins/settings-model.ts
  - src/scanner/session.ts
modified_files:
  - src/plugins/settings-model.ts
  - src/viewers/web/settings/plugins.ts
  - test-bun/scanner-settings.test.ts
type: enhancement
ordinal: 711000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In web Settings, Plugins, pressing Install only disables every button: the row shows nothing while the package downloads. As soon as config.json lists the plugin its row reads Installed, although the same action is still running the first scan with it, and when that scan fails the row turns to Needs attention. A person cannot tell that an install is running and reads a result before there is one. Reported by Alex while installing the C# scanner from Settings on 2026-11-21.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 While a plugin action runs, each row it acts on says what is happening where its status stands (Installing…, Updating…, Removing… or Scanning…) and shows a moving progress line along its bottom edge; with reduced motion the line does not move.
- [x] #2 A row an action acts on shows no Installed or Needs attention and no primary button until the action ends; then it shows its real status.
- [x] #3 After Add is pressed for a plugin source, a pending row at the top of the list names the typed source with the same label and progress line until the plugin's own row exists; that row keeps Installing… until the action ends.
- [x] #4 Install all and Install missing mark every row they install, and Retry marks the rows that needed attention as Scanning…; an action that names one plugin marks only that row.
- [x] #5 A failed action still shows its failure details with Retry, and the rows show their real status.
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
1. Rule (src/plugins/settings-model.ts): a running action is one value, the action together with the rows as they were when it started (RunningPluginAction). pluginProgress says what a row shows while that action acts on it, or nothing when the action leaves the row alone: install and restore name one row (Installing…), update names one row (Updating…), remove names one row (Removing…), add acts on a row config.json lists now and did not list at the start (Installing…), Install all acts on the scanner rows that were not listed and had an install source (Installing…), Install missing acts on the rows that were missing (Installing…), Retry acts on the rows that needed attention (Scanning…), the automatic updates switch acts on no row. pendingPlugin gives the typed source of Add while config.json does not list the new plugin yet.
2. Web screen (src/viewers/web/settings/plugins.ts): the screen keeps that one value instead of `busy`. Rows are painted from the settings state and the running action: a row in progress shows the label where its status stands, has no primary button and carries the class that draws the progress line (a CSS animation that runs to and fro so it is always in sight; a still line of the full width under reduced motion). After Add, a pending row at the top names the typed source until config.json lists the new plugin. A row moves to another group when config.json lists or drops its plugin, so each painting brings the first row in progress into view. Buttons stay disabled while an action runs; no text is patched into the rows after painting.
3. Test. Supported rule and authority: Alex's request of 2026-11-21, a row an action acts on says what is happening and never reads Installed before the action has ended. Wrong results the test detects: the newly listed plugin of an install or of Add is not marked (so its row would read Installed while the first scan still runs); Add by a source marks a recommendation that is still unlisted; an action that names one plugin marks another row. Gap: test-bun/scanner-settings.test.ts covers notices, groups and row actions but nothing about a running action. Smallest test: one case in that file over a recommended, a missing and a blocked row.
4. No DOM test: the settings screen has no DOM harness, and the look is checked on the live map (install a recommended scanner, Install all, Add by source, Remove, Retry, a failing Add, dark theme, reduced motion).
5. Docs: docs/scanners/setup.md describes the screen but does not state what a row shows during an action, so nothing there becomes false.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified on the live map of groma's own repository in the dark theme, in the Browser pane and in headless Chromium. Install on a recommended scanner showed Installing… with the progress line from the click until the action ended (about 30 s, across the moment config.json listed the plugin) and Installed only then. Remove showed Removing…, Choose version showed Updating…, Retry showed Scanning… on the four rows that needed attention, Install all showed Installing… on both recommended rows. Add by source showed the pending row with the typed source, then Installing… on the new row. Adding a package that does not exist kept the pending row until the action ended and then showed Plugin action failed with Retry installation. The row in progress stayed in view when it moved to another group. Under reduced motion the line had the full width of the row and no animation. Install missing was not exercised live; the unit test covers its rows.

bun run check passed: 26 Node tests, 959 Bun tests, 67 skipped, 0 failed. Scans with the configured scanners wrote no groma/ changes for these source edits.

Corrections while building: the rule was first two functions and is now one switch with one case per action. The progress line first swept across and out of the row, which left it out of sight for part of each pass; it now runs to and fro. The row is brought into view on each painting because the first live run showed it leaving the visible list when config.json listed the plugin.

Not changed, seen while testing: rows the action does not act on read Installed while the scan after the action checks them again, also when they needed attention before. A failed Add reports its failure only after that scan. The terminal plugin screen shows Working… at the bottom and nothing on the rows.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
In web Settings, Plugins, a row a running action acts on now says Installing…, Updating…, Removing… or Scanning… where its status stands, with a progress line along its bottom edge, and shows a status only when the action has ended. After Add, a pending row names the typed source until the plugin has a row of its own. The screen keeps the running action together with the rows it started from and paints the rows from that; one function in the plugin settings model decides which rows an action acts on. Checked on a live map and by the repository check. Rows the action does not act on, the failure timing of Add and the terminal screen are unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
