---
id: TASK-563
title: Play the architecture's history between two commits on the web map
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-11 19:21'
labels:
  - senior
dependencies: []
references:
  - history-revisions
  - revision-control
  - presentation
  - map
  - camera
  - render
  - src-core
  - web-server
  - web-page
  - src/viewers/web/revision/control.ts
  - src/viewers/web/revision/playback.ts
  - src/viewers/web/revision/view.ts
  - src/viewers/web/map-session.ts
  - src/history/revisions.ts
  - src/viewers/web/revision-archives.ts
modified_files:
  - src/viewers/web/revision/history.ts
  - src/viewers/web/map-session.ts
  - src/viewers/web/data.ts
  - src/viewers/web/revision/playback.ts
  - src/viewers/web/revision/control.ts
  - src/viewers/web/render.ts
  - src/viewers/web/revision/view.ts
  - docs/viewers/web/history-playback.md
  - groma/systems/groma-md/containers/cli/components/history.md
  - groma/systems/groma-md/containers/export/components/playback.md
  - groma/systems/groma-md/containers/cli/components/web-server.md
  - groma/systems/groma-md/containers/export/components/revision-control.md
  - test-bun/web-revisions.test.ts
  - src/history/revisions.ts
  - src/history/snapshots.ts
  - src/viewers/web/revision-archives.ts
  - src/viewers/web/payload.ts
  - docs/viewers/web/index.md
  - groma/systems/groma-md/containers/cli/components/revision-archives.md
  - src/viewers/web/runtime.ts
  - src/viewers/web/page.ts
type: feature
ordinal: 3
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A Play button on the web map. The person picks a start commit and an end commit among the revisions Groma.md can read, presses Play, and the map walks through the commits one by one: buildings appear, grow, move and get connected, with the commit's subject and date shown while it plays. There is a speed choice and a Stop. At the end the map shows the comparison from start to end. This turns the timelapse people saw in talks into a feature of the product.

Build on revisions and snapshots (src/history/revisions.ts, src/history/snapshots.ts), the revision picker (src/viewers/web/revision/), comparisons with retained positions (src/history/comparison.ts, src/viewers/web/comparison/), view motion (src/viewers/web/iso/view-motion/) and URL state (src/viewers/web/url.ts).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The revision control lets a person choose a start and an end commit among the readable revisions, and Play walks from start to end one revision at a time, with Stop and a speed choice. The URL carries the range so a link reopens it.
- [ ] #2 Each step morphs the map from the previous revision's layout to the next with retained positions, the way the comparison keeps positions, and the step's short id, subject and date show while it plays.
- [x] #3 Playback stays smooth: a revision is read once per session and cached, upcoming revisions load ahead, and a range of fifty commits plays without reloading the page or blocking the map.
- [x] #4 When playback reaches the end, the map shows the comparison from the start to the end commit with its changes bar and stepper.
- [ ] #5 A reduced-motion preference steps without animation. The static export and the terminal viewer are unchanged.
- [x] #6 Playback visits only compatible revisions, in commit order, from the chosen start commit to the chosen end commit.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Revision selector in the browser (src/viewers/web/revision/control.ts, view.ts). The control keeps two pairs. The displayed pair is what the map shows now, which is a playback frame while a range plays; source details and the changes bar read it. The chosen pair is the range Play was pressed on, or else the displayed pair; the fields and the URL show it, so a link reopens the range and editing one endpoint after Stop keeps the other. Play is disabled while a chosen revision is still loading.
2. Playback in the browser (src/viewers/web/revision/playback.ts), live map only. Play takes the commits between the chosen pair from the revision list every payload carries, oldest first, and walks them: the first frame is the start snapshot, each later frame is the comparison from the last commit shown. Each frame is requested once per page session and kept; the next two frames load ahead. A commit whose frame answers with the unreadable status is skipped. Any other failure stops playback, shows its message and is not kept, so Play asks again. Stop keeps the frame on screen and the chosen range. The walk ends on the full-range comparison that was on screen when Play was pressed. The speed menu (0.5x, 1x, 2x, 4x) is the header dropdown atom.
3. Web host (src/viewers/web/revision-archives.ts, used by map-session.ts). Opening a commit extracts the repository at that commit into a temporary folder and reads its architecture. OPEN_ARCHIVES = 4 commits stay open: the two a frame compares and the two the browser preloads. When a reader finishes, the least recently used commits nobody is reading are closed and their folders deleted; a commit that failed to open is not kept; closing the session deletes the rest. Ordinary views, comparisons, code outlines and source details read the open folder of their commit.
4. One signal for an unreadable architecture. readSnapshot (src/history/snapshots.ts) reports what the architecture reader rejects as UnreadableArchitectureError and passes a busy project lock or an operating-system failure through unchanged. The host answers the first with UNREADABLE_REVISION_STATUS (422, src/viewers/web/payload.ts) and everything else with 500. The browser data source (src/viewers/web/data.ts) turns that status into UnreadableRevisionError.
5. Single owners. compareSnapshots (src/history/snapshots.ts) assembles every comparison from two loaded snapshots. layOutMap (src/viewers/web/runtime.ts) lays out a loaded model and reports its timings.
6. Header. On a header up to 1320 px wide Search folds to its icon while Play shows, and the revision box clips fields that do not fit instead of letting them cover the controls beside it.
7. Documentation: docs/viewers/web/history-playback.md, linked from docs/viewers/web/index.md, and the Web host and Revision selector records under groma/.
8. Tests, all in test-bun/web-revisions.test.ts.
8a. Closing and retry. Rule and authority: review decision A, the host keeps OPEN_ARCHIVES commits open, closes the least recently used and does not keep a failed read; review finding C, a Git failure is not an unreadable architecture. Wrong results caught: every requested commit stays extracted until the session closes; a failed read is answered from the cache forever; a Git failure answers with the unreadable status and playback would skip the commit. Gap: the existing test opens three commits and proves only reuse. Smallest test: one repository with more commits than OPEN_ARCHIVES, observed through the session's HTTP routes with Git hidden.
8b. Reader count. Rule and authority: review item 8 and decision A, a folder is never deleted while a request reads it. Wrong result caught: readSourceTexts reports a missing file as a deletion, so a comparison whose folder was deleted under it shows every file as removed, with no error. Gap: removing the reader check fails no test. Smallest test: through the module's one reading entry point, hold one commit while more than OPEN_ARCHIVES other commits are opened one after another, then read a file from the held folder.
8c. Unreadable or failed. Rule and authority: review item 12, only an architecture the reader rejects is unreadable; an operating-system failure is a failure. Wrong results caught: playback silently skips a commit whose architecture could not be opened because of an I/O error; or a commit that merely lacks a document stops playback instead of being skipped. Gap: nothing fails when readSnapshot reports every reader error as unreadable. Smallest test: readSnapshot on a copy of the fixture, once without index.md and once with a directory in its place.
The walk in the browser has no DOM test harness in this repository; it is verified with headless Chromium runs recorded in the notes.
9. Verification: bun run typecheck, bunx biome lint, the focused bun tests, and headless Chromium runs for fifty commits, an unreadable middle commit, an injected failure with retry, the speed menu, and the header at 1000, 1100, 1280 and 1440 px in light and dark. Acceptance criteria 2 (morph quality) and 5 (reduced-motion geometry) need a visual check and stay unchecked.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Shared-file coordination: TASK-562 also records data.ts and map-session.ts; TASK-565 records map-session.ts, render.ts and the web index; TASK-568 records map-session.ts. Playback uses separate imports, endpoint and URL hunks and preserves their work. Playback documentation is a separate page to avoid overlapping edits to the web index.

Implemented Play/Stop and 0.5×/1×/2×/4× speed in the live revision control; the selected range remains in the URL and header while a caption identifies each frame. The web session caches architecture and source snapshots; playback filters unreadable revisions in Git list order and preloads the next two comparisons. Completion restores the full-range comparison. Existing comparison layout, keyed map morphing and reduced-motion behavior are reused. Static export and terminal code were not changed. Specification and quality review traced revision selection -> compatible range -> cached snapshots -> prefetched comparison frames -> map application -> final comparison. Type checking (tsc --noEmit), focused Biome lint and git diff --check pass; the one reported complexity warning is in the existing paintDetailsState function, outside this change. No builds or tests were run, as instructed. No browser automation tool is available in this session, so interactive behavior and fifty-commit smoothness remain unverified; acceptance criteria are not checked without that evidence. Architecture scan completed, and history.ts/playback.ts were combined into Web host/Revision selector with their responsibilities documented.

Review fix pass authorized by the user on 2026-10-09, superseding the earlier prohibition on tests. Scope is the three PR #121 defects and listed local simplifications. No stored architecture concept changes: OKF documents and Markdown links remain portable history; C4 elements/relationships remain unchanged; Revision selector and Web host own transient playback and session caches. The solution is independent of source language because installed scanners read the same cached revision root through the existing outline contract.

Cold simplicity gate passed with no blocker. Self-review traced render.ts consumers of selected/from and identified that they must continue to expose the displayed frame; dedicated endpoint helpers will own retained editing and URL choices. The cold optional collapse of repeated range checks is applied through those endpoint helpers without changing source-detail semantics. Initial bun run check passed: 16 Node tests; 776 Bun tests, 51 skipped, zero failures. Existing unrelated lint reports remain one warning and two informational messages.

Targeted cold re-review approved the endpoint-helper split with no blocking regression. Browser assertion follows the existing detail flow: the first frame is an ordinary snapshot and requests code for that displayed start revision, with no comparison endpoint; later comparison frames render embedded file changes. The check therefore asserts each replay code request names the displayed first snapshot rather than the retained final range.

Implementer specification review: the three reported failures are fixed in the declared committed-range flow. Chromium proves Stop/edit retains the chosen start, pending destination navigation disables Play and completes at the chosen destination, and How-open replay code requests follow the displayed start snapshot while each loaded commit is extracted once. The 50-commit run visits every revision in Git order, retains the URL, restores the full-range changes bar and supports Next change with one document navigation. The unreadable-middle fixture still skips only the unreadable commit. Original visual morph quality and reduced-motion geometry are not claimed by these minimum-fixture checks. Implementer quality review traced field click -> retained endpoint helpers -> navigation/loading -> playback frames -> displayed source getters -> cached server archive -> existing scanner outline/source reader -> HTTP response. Ownership and naming expose the two kinds of state; no separate navigation framework or new architecture concept exists. The one new assertion block detects reopening Git for both historical code and source, failed before the server fix, and passes after it; it is parallel-safe in the test-owned fixture. All changed source/test files remain below 500 lines and changed-file Biome reports no issues.

Final verification after the endpoint-helper correction: bun run check passed (16 Node tests; 776 Bun tests, 51 skipped, zero failures), including TypeScript, repository lint and scrollbar checks. Changed-file Biome and git diff --check pass. Chromium stop/edit keeps Revision 1 when destination is reselected; holding a chosen destination response disables Play, then playback finishes at Revision 6. Two How-open replays use the displayed first snapshot for code reads and one extraction per loaded commit. The final 50-commit run completed in 21.6 seconds with every commit in Git order, one document navigation, unchanged range URL, no page errors, and working final changes bar/Next change. Request order proves the next two frames preload. Archive logging confirms exactly one extraction for each of all 50 revisions, and session close removed all 50 archives. The unreadable-middle fixture returns only its first/last readable commits. Final screenshots were inspected. Maximum animation-frame gap was 100.4 ms while the native full checks and another browser ran; no larger-map performance claim is made. Original AC2 visual morph quality and AC5 reduced-motion geometry remain unchecked; reduced-motion execution itself passed and static/TUI coverage passed in the full check. Artifacts: /private/tmp/groma-pr121-fixes/regressions-result.json, fifty-result.json, cache-final.json and check-final.log.

Final full-context complexity review passed with no material recommendations. It confirmed clear separation of chosen endpoints from displayed frames, the existing navigation flag for Play, distinct browser/server cache responsibilities, archive cleanup by the web session, lazy ordinary layouts, and unchanged OKF/C4 concepts. Cold simplicity review passed; the only optional repeated endpoint checks were collapsed into dedicated endpoint helpers and one targeted re-review approved them. All reported PR #121 defects and requested simplifications are complete. Original visual AC2/AC5 and DoD1 remain unverified, so the task remains In Progress rather than asserting full original-feature acceptance.
Maintainability pass and its review round (2026-10-11). The notes above record earlier designs; where they say that one archive per revision is kept for the server session, that the host filters the playback range, or that each of 50 revisions is extracted exactly once, this section replaces them. The Implementation Plan and the Final Summary describe the final system.

What changed and why.
Host. src/viewers/web/revision-archives.ts (moved out of the browser folder revision/) keeps OPEN_ARCHIVES = 4 commits extracted. withArchive is the one way to read a commit: it counts a reader, runs the read, and afterwards closes the least recently used commits without readers until four remain; folders are deleted in the background and close() waits for them. A commit that failed to open is dropped, so the next request tries again. The reader count is required: readSourceTexts reports a missing file as a deletion, so a folder deleted under a running comparison yields a wrong comparison with no error. A comparison opens its older commit, then its newer one, through nested withArchive calls. The in-memory source text cache is gone; the lazily stored ordinary layout is a documented field. The /playback.json route, its handler and the data-source method are deleted: the browser slices the range from the revision list in the displayed payload.
Unreadable or failed. readSnapshot (src/history/snapshots.ts) reports what the reader rejects as UnreadableArchitectureError and passes a busy project lock or an operating-system failure through; a missing document is a rejection. revisionError in map-session.ts answers the first with UNREADABLE_REVISION_STATUS (422, payload.ts) and everything else with 500; data.ts turns the status into UnreadableRevisionError.
Single owners. compareSnapshots (src/history/snapshots.ts) assembles every comparison from two loaded snapshots. layOutMap (src/viewers/web/runtime.ts) lays out a loaded model and reports its timings for both loadMapRoot and the archives; the total of the live map is now load time plus layout time instead of wall time. revisionDate (revision/view.ts) is the one date format of the commit list and the caption.
Browser. revision/playback.ts: stop() keeps the chosen range and clear() drops it; chosen() is the one place that says "the range Play was pressed on, else the displayed pair", and control.ts derives the fields, the URL ids, the x button and the error list from it. Play is offered by delivery kind. The walk skips an unreadable commit, drops a failed frame from its cache unless it failed as unreadable, and seeds only the comparison on screen when Play is first pressed. The repaint option and remember are deleted. The speed menu is the header dropdown atom. control.ts names the two pairs (selected/from for the frame on screen, chosenRevision/chosenFrom for what the person chose), the x handler is the one-line form again, and an error opens the chosen destination's list.
Header. On a header up to 1320 px Search folds to its icon while Play shows (page.ts), and the revision box clips fields it has no room for (revision/view.ts).
Docs and records: docs/viewers/web/history-playback.md and index.md; the web-server and revision-control records were updated through groma edit after the scan made a stand-alone revision-archives component that was combined into web-server.

Verification of the final code. bun run typecheck passes. bunx biome lint: 1 warning and 2 infos, the same as before the pass, none in a changed file. bun scripts/lint-web-scrollbars.ts passes. bun test --timeout 20000 on editing, http-relationships, web-revisions, web-sharing, scanner-source-listing, vue-http, web-export, web-page-inset, web-startup and revision-comparison: 136 pass, 0 fail. Each new test fails when the behaviour it guards is removed (checked in scratch copies): no reader check fails the reader test in 15 of 15 runs; reporting every reader error as unreadable, or treating a missing document as an I/O failure, fails the snapshot test; never closing a commit, or keeping a failed open, fails the closing test. The full bun run check was not run in this lane.
Headless Chromium, minimum fixtures. Fifty commits at 4x, 1600 px: all 50 captions in Git order in 19.4 s, range URL unchanged, changes bar at the end, no page error; the first frame is requested 3 ms after Play; 50 frame requests, none on a replay; Stop, its label and the loading caption appear in the same task as the click. Host folders: at most 5 at once, 4 before close, 0 after. Extractions: 49 commits once, the end commit twice (once for the comparison shown before Play, once when the walk reaches it). Unreadable middle commit: skipped, no error, the map ends on the starting comparison. A frame answered with 500 stops playback, shows the message under the destination field and keeps the range; with the failure removed, Play asks for that frame again and finishes. After Play, Stop on the first frame and a click on the start field, the x opens the destination on its own. Editing the destination after Stop keeps the chosen start. Speed menu: opens, lists four speeds with the current one marked, closes on an outside click, works with Enter and Tab, returns focus to its button.
Header widths, comparison of two commits, light and dark: no overlap at 1000, 1100, 1280 and 1440 px. With the fixture's 24-character project title the fields show 36 of 72 px at 1280 and 33 of 72 px at 1440, and are clipped away at 1000 and 1100 px, because the project title never gives way. With an 8-character title both short IDs read whole at 1000 px, the messages show 20 of 72 px at 1100 px and whole at 1280 and 1440 px. Before this change the same fixture overlapped at 1000, 1100 and 1280 px.

Acceptance criterion 3, exact behaviour: the browser requests each frame once per page session and keeps it, so a replay asks the host for nothing; the host keeps the last four commits open and extracts a closed commit again when it is asked for. Upcoming frames load two ahead, and fifty commits play without a page reload.
Not verified: acceptance criteria 2 (morph quality) and 5 (reduced-motion geometry) stay unchecked; animation-frame gaps were not measured in this pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The live web map plays the architecture's history between two commits. Play and a speed menu (0.5x, 1x, 2x, 4x) appear beside a comparison of two commits; Play walks the commits between them in Git order, shows each commit's short id, subject and date, and ends on the full-range comparison with its changes bar and stepper. Stop keeps the frame on screen and the chosen range; the fields and the URL keep that range, and editing one endpoint after Stop keeps the other.

How it works. The browser (src/viewers/web/revision/playback.ts) takes the commits of the range from the revision list in the displayed payload, requests one frame per commit from /world.json, keeps every frame for the page session and loads two frames ahead. A commit whose architecture the current reader rejects is answered with status 422 and skipped; any other failure is answered with 500, stops playback, shows its message and is asked for again on the next Play. The host (src/viewers/web/revision-archives.ts) extracts a commit into a temporary folder, keeps the four most recently used commits open, never deletes a folder a request is reading, and deletes all folders when the session closes. compareSnapshots (src/history/snapshots.ts) assembles every comparison; layOutMap (src/viewers/web/runtime.ts) lays out every loaded model. Static exports and the terminal viewer have no playback.

Verification. Type check, lint (no new warning) and the focused bun tests pass, including three tests for closing and retry, the reader count, and the unreadable-versus-failed line. Headless Chromium runs on minimum fixtures confirm fifty commits in order with no request on replay, the skip of an unreadable commit, a failure with retry, the speed menu, the x after Stop, and a header without overlap at 1000, 1100, 1280 and 1440 px in light and dark. The full bun run check is left to the orchestrator.

Open. Acceptance criteria 2 (morph quality) and 5 (reduced-motion geometry) need a visual check and are unchecked. With a 24-character project title the revision fields are clipped away at 1000 and 1100 px, because the project title never gives way. The end commit of a range is extracted twice per first playback.
<!-- SECTION:FINAL_SUMMARY:END -->
