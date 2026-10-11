---
id: TASK-591
title: Harden audited surfaces and correct documentation drift
status: In Progress
assignee: []
created_date: '2026-09-27 01:23'
updated_date: '2026-10-11 19:31'
labels: []
dependencies: []
modified_files:
  - plugins/scanners/entry-points/javascript.ts
  - src/scanner/modules/discovery.ts
  - src/viewers/web/server.ts
  - src/viewers/web/work/island.ts
  - src/cli.ts
  - src/welcome/model.ts
  - src/write-commands.ts
  - plugins/work-sources/backlog/src/index.ts
  - src/work/pins.ts
  - docs/product-model.md
  - docs/component-markdown.md
  - docs/agent-instructions/inspect.md
  - CONTRIBUTING.md
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
  - test-bun/groma-filesystem.test.ts
  - test-bun/javascript-manifest.test.ts
  - test-bun/backlog-cli.test.ts
  - test-bun/scanner-source-listing.test.ts
  - test-bun/cli-actions.test.ts
  - test-bun/web-hardening.test.ts
  - docs/viewers/web/index.md
  - src/code-reference.ts
  - test/architecture-model-errors.test.ts
  - test-bun/scanner-discovery.test.ts
  - test-bun/work-pins.test.ts
  - docs/scanners/javascript/index.md
  - src/viewers/source/diff.ts
  - test-bun/file-diff.test.ts
priority: high
type: task
ordinal: 611000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
External audit of groma.md 0.5.0 (pull request #113 by an outside contributor), reduced to the changes the repository's rules allow and rebuilt on today's main.

Actor: someone who runs groma web, groma scan or another command in a repository whose content they do not fully trust.
Entry points: the web viewer's server and routes, the stored architecture model, the Backlog work source, the scanners' entry reader, scanner discovery, and the command actions in src/cli.ts.
Result: the viewer answers this machine only and refuses a request a browser sends for another site; a stored code reference cannot name a file outside the repository; Backlog text is never parsed as HTML; a failing command prints its message and exits 1; one broken manifest no longer fails a scan; pins follow subtask numbers; the corrected documents match the code; workflow actions are pinned by commit.

Of the audit's 28 fixes, 19 remain, 7 are back to main's code and 2 were already on main. The Implementation Notes name each.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The web viewer accepts connections on the loopback address only and answers 403 to a request a browser sends for another site
- [x] #2 A stored code reference whose file is absolute or has a '..' segment fails the model, so the source, comparison and export readers never open a file outside the repository
- [x] #3 A Backlog task id or status name appears as text in the work island and is never parsed as HTML
- [x] #4 A manifest that is not JSON, a dependency installed above the repository, a dotted task id and a failing export behave as their tests state, and each test fails on main
- [x] #5 Every removed change is back to main's code together with its helpers, tests and doc sentences
- [ ] #6 bun run check passes with no more lint warnings than main
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Clean-up pass on the external audit pull request (#113), on top of today's main.
1. Merge origin/main. Main already reports an absent referenced TypeScript config (TASK-558), so its projects.ts replaces the pull request's version.
2. Renumber this record to TASK-591; main owns TASK-531.
3. Restore main's code where a change guards a case nobody reproduced in a supported flow, or duplicates another owner: Backlog field coercion, SIGKILL escalation and stream resync; the Swift 256 MB output limit; dropping symlinks that leave the repository; the re-measured numbers in relationship-inference.md; relationship row escaping; the process-wide module mock, the help-wording test and the hand-made DOM tests.
4. Web viewer: listen on the loopback address only. Reject a stored code reference whose file is absolute or has a '..' segment in codeReferencesOf, the one owner of code reference validation, and delete the per-route checks and containment.ts.
5. Check every kept change against main: smallest form, no second copy, no misleading name or comment. This reduced the work island, discovery and pin order fixes, removed the welcome loop's duplicate catch, limited tolerant manifest reading to invalid JSON in the shared entry reader, and returned the Angular and React readers to main because their catch could not run.
6. Rewrite this record to describe what the pull request contains afterwards.

Tests (rule and authority; wrong result caught; coverage gap):
- test-bun/backlog-cli.test.ts, 'a task id with shell characters never reaches the Backlog CLI' (kept from the pull request, moved here). Rule: readItem passes an id to the Backlog CLI only when it is letters, digits, '.', '_' and '-'; a task id is repository content and the Windows npm shim runs through cmd.exe (owner decision, lane step 3a). Wrong result: 'backlog task view' starts with the id 'TASK-1 & calc'. Gap: no other test passes an id to readItem.
- test-bun/scanner-source-listing.test.ts, 'the repository listing leaves out a symlink whose target is absent'. Rule: the listing holds the repository files that exist (src/repository-listing.ts contract) and a symlink without a target must not stop it (owner decision, lane step 3c). Wrong result: repositoryListing throws ENOENT from realpathSync, or lists the link, once the existence filter is dropped or reordered. Gap: no listing test holds a symlink without a target. Main's code already passes it; no code change was needed.
- test-bun/cli-actions.test.ts, 'a failed export prints its message and exits 1 without a stack trace' (kept from the pull request; now runs in its own temporary repository instead of this checkout). Rule: a command that fails prints the message and exits 1, as groma scan and groma view already do (audit finding D2-3, kept by the owner). Wrong result: groma export prints a source frame and stack lines, which main does for an unknown revision. Gap: no test runs groma export to a failure.
- test-bun/web-hardening.test.ts, 'the viewer accepts no connection on a network address'. Rule: the viewer listens on the loopback address only (owner decision, lane step 4a, from the external review). Wrong result: a client on the network that sends 'Host: localhost' gets the map; main answers 200 on the machine's network address. Gap: every other server test connects through loopback, and the Host check cannot stop a client that is not a browser.
- test/architecture-model-errors.test.ts, 'reports a code reference that climbs out of the repository' and 'reports a code reference with an absolute file'. Rule: a stored code reference's file is repository-relative (docs/component-markdown.md, Code references), so the model rejects an absolute path or a '..' segment (owner decision, lane step 4b). Wrong result: buildArchitectureModel accepts the component and every reader joins that file to the repository root. Gap: no model test gives a component a code reference.
- test-bun/web-hardening.test.ts, 'a commit whose code reference climbs out of the repository cannot be compared' (replaces the source-route and export tests). Rule: the same, observed at the route the external review named. Wrong result: /world.json?from=<commit> answers 200 with the content of a file beside the repository, which it does without the model rule. Gap: no test compares against a commit whose stored reference is invalid.
- test-bun/scanner-discovery.test.ts, 'a dependency resolves its version only from a package installed in the repository' (the pull request's test, changed so that it fails on main). Rule: discovery reports an installed version only for a package inside the repository (audit finding D-sc-09, kept by the owner). Wrong result: a package declared in the repository but installed only in a directory above it is reported as installed there. Gap: no other test resolves a dependency version; the original test kept a copy inside the repository, which main finds first, so it passed without the fix.
- test-bun/work-pins.test.ts, 'pins follow task ids with each dotted number compared as a number' (the pull request's test, reduced to dotted ids). Rule: pins and their colours follow Backlog task order, where a subtask number is a whole number (audit finding D-work-05, kept by the owner). Wrong result: TASK-416.10 comes before TASK-416.2, which main does by reading '416.10' as the decimal 416.1. Gap: every other pin test uses whole-number ids.
- test-bun/javascript-manifest.test.ts, 'one malformed manifest is skipped with a diagnostic while a sibling still declares its entry' (the pull request's test, unchanged). Rule: a manifest that is not JSON supplies no entry and does not stop the scan (audit finding D-sc-04, kept by the owner). Wrong result: the scan throws a SyntaxError, which main does. Gap: no other test scans beside a broken manifest.
- test-bun/groma-filesystem.test.ts (the pull request's two tests of main's atomic writer, unchanged and outside this pass's lists). They state that a successful write leaves no temporary file and that a failed replacement keeps the previous content; main's filesystem-access test covers only the successful replacement.

- test-bun/file-diff.test.ts, 'an open task reads its modified files from the working tree, and never one named outside the repository' (review decision D1). Rule: a task's modified file is opened from the working tree only when it is a repository-relative path without a '..' segment, the rule isRepositoryRelativePath owns; anything else reads as absent, like a missing file. Wrong result: an open task whose modified files hold '../outside.txt' gets a row with status 'added' and that file's content, which main returns through /task-diff.json and the terminal viewer. Gap: no test called readTaskDiff.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Clean-up pass, 2026-10-11. The pull request now differs from main in 28 files. Audit findings by id:

Kept (19)
- D-sc-04: a manifest or workspace file that is not JSON supplies no entry and is reported as a warning. Only the shared entry reader (plugins/scanners/entry-points/javascript.ts) needed it, and only for invalid JSON.
- D-sc-07, D-work-06: CONTRIBUTING.md no longer names a script and a test file that do not exist.
- D-sc-09: discovery reads an installed version only from a package inside the repository.
- D2-3, D2-4, D2-8: groma, groma export, groma instructions and a signal-driven stop print the message and exit 1. A failed welcome action is reported by the calling command; the loop's own catch was a second copy.
- D2-5: groma draft help says --description and --technology are required for a relation.
- D2-7: the welcome status reads 'Scanners need attention' when the scanner notice is an error.
- D-work-01: readItem refuses a task id with characters outside letters, digits, '.', '_', '-', and the Windows .cmd shim receives quoted arguments.
- D-work-05: pins follow dotted task ids number by number, through numeric collation.
- D5-0, D5-1, D5-4: product-model.md, component-markdown.md and the inspect guide state what the code does.
- D5-5: every action reference in the three workflows is pinned by commit, including four in architecture.yml that main added later.
- WEB-01, WEB-02: the server answers 403 when the Host header does not name this machine or a write's Origin or Referer is not this viewer. It also listens on 127.0.0.1 only, which the external review asked for and which closes the audit's reported-only finding D-sc-06.
- WEB-03: codeReferencesOf rejects a file that is absolute or has a '..' segment, so one owner covers the live map, a commit, a comparison and an export.
- WEB-04: a Backlog task id and status name are appended to the work island as text.

Back to main's code (7)
- D-sc-02 relationship row escaping: another open pull request makes one function own table-text escaping. File names with '|', ']' or a line break stay an open follow-up.
- D-sc-03 dropping symlinks that leave the repository: main lists them on purpose. A symlink whose target is absent never stopped the listing; one test now says so.
- D-sc-08 Swift 256 MB output limit: evidence grows with the source, so main sets no limit.
- D-work-02, D-work-03, D-work-04 Backlog stream resync, field coercion and SIGKILL escalation: guards for a misbehaving Backlog CLI that nobody reproduced.
- D5-2 relationship-inference.md: a dated investigation record keeps the numbers it measured.

Already on main (2)
- D-sc-05: main reports an absent referenced TypeScript config (TASK-558). Skipping references that leave the repository, in the TypeScript and Angular readers, was not kept.
- D2-1: main replaces architecture files atomically (TASK-552, TASK-554). The pull request's two tests of that writer remain.

Also removed: the tests on a hand-made DOM, the process-wide module mock with the two welcome status tests, the help-wording test, and the Angular and React manifest catches, which could not run because typescript-project.ts selects a project only after parsing that same manifest.

Verification, all run in this worktree on macOS with Bun 1.4.3:
- bun run typecheck passes. bunx biome lint reports 1 warning and 2 infos, the same three as main and none in a changed file.
- Each of these tests was run against main's code for the fix and failed, then passed with it: task id, export failure, network address, both model cases, comparison route, discovery, pin order, broken manifest.
- 119 tests in 21 focused Bun files pass, and the 18 Node tests in test/ pass.
- Headless Chromium, work island: with a task id and a status that carry an img tag with an error handler, main builds two img elements and runs the handler; this version builds none and shows the text.
- Headless Chromium, curl and Bun fetch reach the 127.0.0.1 listener through http://localhost:<port> although localhost resolves to ::1 first on this machine; a request to the machine's network address is refused. Not run on Linux or Windows.
- A terminal session (tui-test): choosing groma scan from the welcome with an unreadable groma/scanners.json prints the parse error alone and exits 1.
- groma export and groma view --plain refuse a stored '../outside.txt' reference with the model's message.
- bun src/cli.ts scan left groma/ unchanged.
- bun run check was not run here; the orchestrator runs it. test-bun/nested-scanners.test.ts timed out in one or two of its twelve concurrent tests on most runs, and did the same on an export of origin/main; each test passes alone.

Correction history: commit 0587db65 (loopback binding) also carries the removal of the per-route checks and containment.ts, which belongs to the next commit; the commits were not rewritten.

Live source route, checked by script: with a valid tree /source.json serves an owned file and answers 404 for '../outside.txt'; with a stored '../outside.txt' reference in the working tree the viewer answers 500 with the model's message and sends nothing from outside.
<!-- SECTION:NOTES:END -->
