---
id: TASK-563
title: Play the architecture's history between two commits on the web map
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-11 16:26'
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
1. Fix the reviewed endpoint flow in the existing revision selector: retain chosen endpoints while opening a field after Stop, render endpoint fields directly, and disable Play through the current pending-navigation state. 2. Retain each historical archive for the server session, reuse it for architecture, source and code-detail requests, release it on close, and prepare ordinary layouts only when requested. Remove the unused loader branch and playback members; preserve browser frame caching, two-frame preloading, Git order, speed, Stop, reduced motion and final full-range comparison. 3. Regression authority: AC1 and the reproduced stop/edit failure require changing one endpoint to retain the other. Existing server tests do not exercise browser endpoint edits; reuse the Chromium stop/edit reproduction. AC1 and the reproduced pending-navigation race require Play to wait for the chosen range; hold the selected endpoint response and verify Play is disabled until it applies. AC3 requires one historical read per session; existing source assertions check values but not reused reads. Extend the existing web-history test by temporarily removing Git access after loading snapshots, then request old code/source details and verify they still work. Browser Git archive logging with How open on two replays verifies one extraction per revision. 4. Reuse the minimum 50-commit browser fixture to verify order, range URL, final comparison/changes stepper, speed, Stop, replay and reduced-motion execution; run focused checks and bun run check. 5. Run one cold simplicity review, implement accepted local simplifications, then perform specification and quality review; run one final full-context complexity review. Read finalization instructions, record objective evidence without claiming unverified visual morph quality, curate any scanner-caused architecture files, and make the authorized local task commit.

Regression refinement after self-review: the retained chosen endpoints must not replace the displayed revision getters used by render.ts for How/source and changes navigation. Authority is the existing displayed-frame detail flow and the required chosen-range/displayed-frame distinction. The wrong result would show final-range code while an intermediate frame is visible. The replay browser check asserts code requests name the displayed first snapshot, with no comparison endpoint, rather than the retained final range; later comparison frames render their embedded file changes.

Maintainability pass (review findings A to H, 2026-10-11). It supersedes steps 2 and 3 where they say one archive per revision is retained for the whole server session.
A. The web host keeps at most a named, fixed number of commits extracted (four: the previous frame, the current one and the two the browser preloads). A commit nobody is reading and that was used least recently is closed when the limit is exceeded; a commit that failed to open is not kept. Replays are served by the browser frame cache.
B. /playback.json reads only the two endpoints and answers with every commit of the range, oldest first. The browser walk skips a commit the current reader cannot read and continues from the last readable frame.
C. One signal names an unreadable architecture: readSnapshot throws UnreadableArchitectureError, the host answers with UNREADABLE_REVISION_STATUS, the browser data source throws UnreadableRevisionError. Git and filesystem failures answer 500 and reach the person.
D. The host module moves out of the browser folder to src/viewers/web/revision-archives.ts. compareSnapshots in src/history/snapshots.ts owns the assembly of a comparison from two loaded snapshots; readComparison and the host both call it.
E. The per-revision source text cache is removed: a comparison reads the files from the two open archives, so no shared entry is edited by readers. The lazily added ordinary layout is declared in the entry's type.
F. The speed control reuses the header dropdown atom (details, anchored-popover, anchored-option, bindPopover).
G. docs/viewers/web/index.md links the playback page, which is brought in line with A to D.
H. Imports follow each file's grouping.
Tests (one new test in test-bun/web-revisions.test.ts):
1. Rule and authority: review decision A, a bounded number of open commits with least-recently-used closing and no kept failure; review finding C, only an unreadable architecture counts as unreadable; review decision B, the candidates are every commit of the range in Git order, oldest first.
2. Wrong results caught: every requested commit stays extracted until the session closes; a failed read is answered from the cache forever; a Git failure is reported with the unreadable status and playback would skip the commit silently; /playback.json reads or filters the middle of the range or answers newest first.
3. Coverage gap: the existing test opens three commits and only proves reuse, never closing, retry, the failure status or /playback.json. Smallest test: one repository with more commits than the limit and one unreadable commit in the middle, observed through the session's HTTP routes with Git hidden, as the existing reuse assertion does.
The browser walk has no DOM test harness in this repository; skipping an unreadable commit is verified with a headless Chromium run and recorded in the notes.
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

Maintainability pass on review findings A to H (2026-10-11). The Final Summary above predates this pass: its statements that one archive per revision is kept for the server session and that each of 50 revisions is extracted exactly once no longer hold and must be rewritten at finalization.

What changed and why.
A. src/viewers/web/revision-archives.ts (moved from revision/history.ts) keeps OPEN_ARCHIVES = 4 commits extracted: the two a frame compares and the two the browser preloads. Each open commit counts its readers; when a reader finishes, the least recently used commits without readers are closed until four remain, and their folders are deleted in the background while close() waits for them. A commit that failed to open is dropped, so the next request tries again. The reader count is required, not optional: readSourceTexts reports a missing file as a deletion, so closing a folder under a running comparison returns a wrong comparison without any error. A scratch run of 49 concurrent comparisons returned 49 correct results with the count and many wrong added/removed results without it.
B. /playback.json (playbackResponse in map-session.ts) reuses comparedPair for the two commits, opens only those two, and answers with every commit of the range, oldest first. The walk in revision/playback.ts skips a commit whose frame answers with the unreadable signal and compares the next commit with the last one shown.
C. readSnapshot (src/history/snapshots.ts) wraps whatever the architecture reader throws in UnreadableArchitectureError. revisionError in map-session.ts answers that error with UNREADABLE_REVISION_STATUS (422, payload.ts) and every other failure with 500; data.ts turns the status into UnreadableRevisionError. Git and extraction failures therefore reach the person. The dead project === null check in payloadAt is removed.
D. compareSnapshots in src/history/snapshots.ts assembles every comparison from two loaded snapshots; readComparison and the archives module call it. The host module now sits beside map-session.ts and is named for what it holds.
E. The in-memory source text cache is gone: a comparison reads the files from the two open folders, so no stored entry is edited by a reader. The only field added after opening, the ordinary layout, is declared and documented on the Archive type.
F. The speed control is a details element with the shared anchored-popover and anchored-option atoms and bindPopover, like the theme, Help and Info menus.
G. docs/viewers/web/index.md links the playback page; the page describes the limit, the unreadable status, the browser skip and the one comparison owner.
H. revision/control.ts lists its local imports in order; map-session.ts imports the archives module in its place in the local group.
Architecture: the scan made a stand-alone revision-archives component for the moved file; it was combined into web-server, and the web-server and revision-control overviews were updated through groma edit.

Verification (run by this pass). bun run typecheck passes. bunx biome lint: 1 warning and 2 infos, the same as before the pass, none in a changed file. bun scripts/lint-web-scrollbars.ts passes. bun test --timeout 20000 on web-revisions, web-export, revision-comparison, web-page-inset, web-sharing, web-startup: 22 pass, 0 fail. The new test fails on the previous code: /playback.json dropped the unreadable middle commit, and with that assertion removed the oldest commit was still served with Git hidden (200 instead of 500). The full bun run check was not run in this lane.
Headless Chromium 1600x1000, light theme, minimum fixtures. Fifty commits at 4x: all 50 captions in Git order in 19.4 s, range URL unchanged, changes bar shown at the end, no page error; /playback.json answered in 25 ms; 50 frame requests, and 0 frame requests on a replay. Host folders: at most 5 at once while playing, 4 before close, 0 after close. Extractions: 48 commits once; the end commit twice (once for the comparison shown before Play, once when the walk reaches it); the start commit a second time on the replay, because /playback.json opens both endpoints again. Unreadable middle commit: captions show only the first and last commit, no error, the map ends on the starting comparison. A frame answered with 500 stops playback and shows its message. Speed menu: opens, lists 0.5x 1x 2x 4x with the current one marked, closes on an outside click, is usable with Enter and Tab, returns focus to its button; screenshots inspected in light, dark and a 1000 px header.
Not verified: acceptance criteria 2 (morph quality) and 5 (reduced-motion geometry) stay unchecked. Criterion 3 says a revision is read once per session; after decision A that holds for the browser (each frame is requested once per session) but not for the host, which reads a closed commit again.
Observed, outside findings A to H and unchanged by this pass: in a comparison at 1280 px wide, with the fixture's 24-character project title, the header has no room for the revision fields beside Play and the speed button, and the controls overlap the fields (measured at 1000, 1100 and 1280 px; 1600 px fits). The unmodified pull request shows the same.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed all three PR #121 review defects: endpoint editing after Stop retains the other chosen endpoint; Play is disabled while an endpoint navigation is pending; historical code and source details reuse one archive per revision for the server session. Layouts are lazy, fields render actual endpoints, and unused loader/playback state is removed. Displayed-frame source reads stay separate from retained editing/URL choices. Existing owners, two caches, next-two preloading, Git order, speed, Stop, reduced-motion execution and final full-range comparison are preserved. Added one cache regression in the existing web-history test (failed before the server fix, passed after). Final bun run check passed: 16 Node and 776 Bun tests, 51 skipped, zero failures. Chromium verified stop/edit, pending destination, two How-open replays, all 50 commits in order, retained URL, one document navigation, final changes bar and Next change. All 50 revisions extracted once; closing the session removed every archive. Cold simplicity and final complexity reviews passed. The original morph-quality and reduced-motion-geometry criteria remain unchecked; no larger-map performance claim is made. Fix branch is local only; no push.
<!-- SECTION:FINAL_SUMMARY:END -->
