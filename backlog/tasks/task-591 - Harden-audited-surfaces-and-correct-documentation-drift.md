---
id: TASK-591
title: Harden audited surfaces and correct documentation drift
status: Done
assignee: []
created_date: '2026-09-27 01:23'
updated_date: '2026-10-11 19:40'
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
  - test-bun/javascript-manifest.test.ts
  - test-bun/backlog-cli.test.ts
  - test-bun/scanner-source-listing.test.ts
  - test-bun/cli-actions.test.ts
  - test-bun/web-server.test.ts
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
Entry points: the web viewer's server and routes, the stored architecture model, the task diff reader, the Backlog work source, the scanners' entry reader, scanner discovery, and the command parser in src/cli.ts.
Result: the viewer answers this machine only and refuses a request whose Host is not this machine or whose write comes from another site; a stored code reference and a task's modified file are opened only when they are repository-relative paths without a '..' segment; Backlog text is never parsed as HTML; a failing command prints its message and exits 1; one broken manifest no longer fails a scan; pins follow subtask numbers; the corrected documents match the code; workflow actions are pinned by commit and labelled with their release.

Of the audit's 28 fixes, 19 remain, 7 are back to main's code and 2 were already on main. The Implementation Notes name each.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The web viewer accepts connections on the loopback address only; it answers 403 when the Host header does not name this machine, and when a request other than GET or HEAD carries an Origin or Referer that is not this viewer
- [x] #2 A stored code reference whose file is absolute or has a '..' segment fails the model, so the source, comparison and export readers never open a file outside the repository
- [x] #3 A task's modified file that is not a repository-relative path is never opened from the working tree; its diff row reads as absent
- [x] #4 A Backlog task id or status name appears as text in the work island and is never parsed as HTML
- [x] #5 A manifest that is not JSON, a dependency installed above the repository, a dotted task id and a failing export behave as their tests state, and each test fails on main
- [x] #6 Every removed change is back to main's code together with its helpers, tests and doc sentences
- [x] #7 bun run check passes with no more lint warnings than main
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
Clean-up pass on the external audit pull request (#113), on top of today's main.
1. Merge origin/main. Main already reports an absent referenced TypeScript config (TASK-558), so its projects.ts replaces the pull request's version.
2. Renumber this record to TASK-591; main owns TASK-531.
3. Restore main's code where a change guards a case nobody reproduced in a supported flow, or duplicates another owner: Backlog field coercion, SIGKILL escalation and stream resync; the Swift 256 MB output limit; dropping symlinks that leave the repository; the re-measured numbers in relationship-inference.md; relationship row escaping; the process-wide module mock, the help-wording test and the hand-made DOM tests.
4. Web viewer: listen on the loopback address only. Reject a stored code reference whose file is absolute or has a '..' segment in codeReferencesOf, the one owner of code reference validation, and delete the per-route checks and containment.ts.
5. Check every kept change against main: smallest form, no second copy, no misleading name or comment. This reduced the work island, discovery and pin order fixes, limited tolerant manifest reading to invalid JSON in the shared entry reader, and returned the Angular and React readers to main because their catch could not run.
6. Rewrite this record to describe what the pull request contains afterwards.
7. Review round: apply the consolidated list from the cold simplicity review and the orchestrator. The task diff reader uses the same path rule as the model (decision D1); the request gate says exactly what it decides; one catch around the command parser replaces the three action catches; the Windows shim line is back to main; every pin carries its exact release; the server tests use fetch and live in test-bun/web-server.test.ts.

Tests (rule and authority; wrong result caught; coverage gap):
- test-bun/backlog-cli.test.ts, 'a task id with shell characters never reaches the Backlog CLI' (kept from the pull request, moved here). Rule: readItem passes an id to the Backlog CLI only when it is letters, digits, '.', '_' and '-'; a task id is repository content and the Windows npm shim runs through cmd.exe (owner decision, lane step 3a). Wrong result: 'backlog task view' starts with the id 'TASK-1 & calc'. Gap: no other test passes an id to readItem.
- test-bun/scanner-source-listing.test.ts, 'the repository listing leaves out a symlink whose target is absent'. Rule: the listing holds the repository files that exist (src/repository-listing.ts contract) and a symlink without a target must not stop it (owner decision, lane step 3c). Wrong result: repositoryListing throws ENOENT from realpathSync, or lists the link, once the existence filter is dropped or reordered. Gap: no listing test holds a symlink without a target. Main's code already passes it; no code change was needed.
- test-bun/cli-actions.test.ts, 'a failed export prints its message and exits 1 without a stack trace' (kept from the pull request; now runs in its own temporary repository instead of this checkout). Rule: a command that fails prints the message and exits 1, as groma scan and groma view already do (audit finding D2-3, kept by the owner). Wrong result: groma export prints a source frame and stack lines, which main does for an unknown revision. Gap: no test runs groma export to a failure.
- test-bun/web-server.test.ts, 'the viewer accepts no connection on a network address'. Rule: the viewer listens on the loopback address only (owner decision, lane step 4a, from the external review). Wrong result: a client on the network that sends 'Host: localhost' gets the map; main answers 200 on the machine's network address. Gap: every other server test connects through loopback, and the Host check cannot stop a client that is not a browser.
- test/architecture-model-errors.test.ts, 'reports a code reference that climbs out of the repository' and 'reports a code reference with an absolute file'. Rule: a stored code reference's file is repository-relative (docs/component-markdown.md, Code references), so the model rejects an absolute path or a '..' segment (owner decision, lane step 4b). Wrong result: buildArchitectureModel accepts the component and every reader joins that file to the repository root. Gap: no model test gives a component a code reference.
- test-bun/web-server.test.ts, 'the comparison route refuses a commit whose code reference climbs out of the repository (the model rule, checked once at a route)' (replaces the source-route and export tests). Rule: the same; this is the one deliberate route-level check, at the route the external review named. Wrong result: /world.json?from=<commit> answers 200 with the content of a file beside the repository, which it does without the model rule. Gap: no test compares against a commit whose stored reference is invalid.
- test-bun/scanner-discovery.test.ts, 'a dependency resolves its version only from a package installed in the repository' (the pull request's test, changed so that it fails on main). Rule: discovery reports an installed version only for a package inside the repository (audit finding D-sc-09, kept by the owner). Wrong result: a package declared in the repository but installed only in a directory above it is reported as installed there. Gap: no other test resolves a dependency version; the original test kept a copy inside the repository, which main finds first, so it passed without the fix.
- test-bun/work-pins.test.ts, 'pins follow task ids with each dotted number compared as a number' (the pull request's test, reduced to dotted ids). Rule: pins and their colours follow Backlog task order, where a subtask number is a whole number (audit finding D-work-05, kept by the owner). Wrong result: TASK-416.10 comes before TASK-416.2, which main does by reading '416.10' as the decimal 416.1. Gap: every other pin test uses whole-number ids.
- test-bun/javascript-manifest.test.ts, 'one malformed manifest is skipped with a diagnostic while a sibling still declares its entry' (the pull request's test, unchanged). Rule: a manifest that is not JSON supplies no entry and does not stop the scan (audit finding D-sc-04, kept by the owner). Wrong result: the scan throws a SyntaxError, which main does. Gap: no other test scans beside a broken manifest.
- test-bun/file-diff.test.ts, 'an open task reads its modified files from the working tree, and never one named outside the repository' (review decision D1). Rule: a task's modified file is opened from the working tree only when it is a repository-relative path without a '..' segment, the rule isRepositoryRelativePath owns; anything else reads as absent, like a missing file. Wrong result: an open task whose modified files hold '../outside.txt' gets a row with status 'added' and that file's content, which main returns through /task-diff.json and the terminal viewer. Gap: no test called readTaskDiff.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
State after the review round, 2026-10-11. The pull request differs from main in 29 files. Audit findings by id:

Kept (19)
- D-sc-04: a manifest or workspace file that is not JSON supplies no entry and is reported as the warning JAVASCRIPT_MANIFEST_INVALID. Only the shared entry reader (plugins/scanners/entry-points/javascript.ts) needed it, and only for invalid JSON.
- D-sc-07, D-work-06: CONTRIBUTING.md no longer names a script and a test file that do not exist.
- D-sc-09: discovery reads an installed version only from a package inside the repository.
- D2-3, D2-4: one catch around program.parseAsync() prints a failed command's message and sets exit code 1. It covers groma, groma export, groma instructions, a failed welcome action and every command that had no catch.
- D2-8: a stop on SIGINT or SIGTERM whose close fails prints the message and exits 1.
- D2-5: groma draft help says --description and --technology are required for a relation.
- D2-7: the welcome status reads 'Scanners need attention' when the scanner notice is an error.
- D-work-01: readItem refuses a task id with characters outside letters, digits, '.', '_', '-', or one that starts with '-'. The shim's argument line is main's.
- D-work-05: pins follow dotted task ids number by number, through numeric collation with a fixed locale.
- D5-0, D5-1, D5-4: product-model.md, component-markdown.md and the inspect guide state what the code does.
- D5-5: every action reference in the three workflows is pinned by commit and labelled with the release upstream tags on that commit.
- WEB-01, WEB-02: the server listens on 127.0.0.1 only and answers 403 when the Host header does not name this machine, or when a request other than GET or HEAD carries an Origin or Referer that is not this viewer. A cross-site GET still runs but its page cannot read the answer; a GET route must never change anything. The binding also closes the audit's reported-only finding D-sc-06.
- WEB-03: one rule with one owner, isRepositoryRelativePath in src/code-reference.ts. The model rejects a stored code reference that breaks it, which covers the live map, a commit, a comparison and an export; the task diff reader does not open a task's modified file that breaks it.
- WEB-04: a Backlog task id and status name are appended to the work island as text.

Back to main's code (7)
- D-sc-02 relationship row escaping: another open pull request makes one function own table-text escaping. File names with '|', ']' or a line break stay an open follow-up.
- D-sc-03 dropping symlinks that leave the repository: main lists them on purpose. A symlink whose target is absent never stopped the listing; one test now says so.
- D-sc-08 Swift 256 MB output limit: evidence grows with the source, so main sets no limit.
- D-work-02, D-work-03, D-work-04 Backlog stream resync, field coercion and SIGKILL escalation: guards for a misbehaving Backlog CLI that nobody reproduced.
- D5-2 relationship-inference.md: a dated investigation record keeps the numbers it measured.

Already on main (2)
- D-sc-05: main reports an absent referenced TypeScript config (TASK-558). Skipping references that leave the repository, in the TypeScript and Angular readers, was not kept.
- D2-1: main replaces architecture files atomically (TASK-552, TASK-554).

Also removed: the tests on a hand-made DOM, the process-wide module mock with the two welcome status tests, the help-wording test, the two tests of main's atomic writer, the quoted shim arguments, and the Angular and React manifest catches, which could not run because typescript-project.ts selects a project only after parsing that same manifest.

Review round (one consolidated list, all applied)
- D1: readTaskDiff no longer opens a modified file that is absolute or has a '..' segment; the row reads as absent. Before, /task-diff.json and the terminal viewer returned the content of '../outside.txt' for an open task.
- The request gate is named forbidden and its comment states the three facts above; '[::1]' left the loopback names because the listener is IPv4; the comment on the printed address says what was checked.
- The model's message and the predicate's name describe the rule as spelling: a repository-relative path without a '..' segment.
- docs/product-model.md no longer says a static export reads tasks.
- The server tests are test-bun/web-server.test.ts: fetch with a Host header instead of a raw socket, the shared EMPTY_WORK_SOURCE, no setup-mode hook, and a comparison test whose title says it is the one route-level check of the model's rule.
- Not changed, as decided: the welcome status colour, the groma draft help wording, the assignee monogram in work/badge.ts, the skip of the network-address test on a machine without one.

Verification, all run in this worktree on macOS with Bun 1.4.3:
- bun run typecheck passes. bunx biome lint reports 1 warning and 2 infos, the same three as main and none in a changed file.
- Each of these tests was run against main's code for its fix and failed, then passed with it: task id, export failure, network address, Host and Origin gate, both model cases, comparison route, task diff reader, discovery, pin order, broken manifest.
- 120 tests in 21 focused Bun files pass, and the 18 Node tests in test/ pass. test-bun/web-server.test.ts passed 15 runs in a row.
- /task-diff.json, checked by script after the fix: the '../outside.txt' row is 'unchanged' with no lines.
- Headless Chromium, work island: with a task id and a status that carry an img tag with an error handler, main builds two img elements and runs the handler; this version builds none and shows the text.
- Headless Chromium, curl and Bun fetch reach the 127.0.0.1 listener through http://localhost:<port> although localhost resolves to ::1 first on this machine; a request to the machine's network address is refused. Not run on Linux or Windows.
- A terminal session (tui-test), with the single catch: choosing groma scan from the welcome with an unreadable groma/scanners.json prints the parse error alone and exits 1; quitting groma instructions exits 0.
- groma export and groma view --plain refuse a stored ../outside.txt reference with the model message and exit 1.
- bun src/cli.ts scan left groma/ unchanged.
- bun run check was not run here; the orchestrator runs it. test-bun/nested-scanners.test.ts timed out in one or two of its twelve concurrent tests on most runs, and did the same on an export of origin/main; each test passes alone.

Correction history: commit 0587db65 (loopback binding) also carries the removal of the per-route checks and containment.ts, which belongs to the next commit. Commit 660db60a describes the gate and document changes but holds only the renamed test file; 2cd82310 adds them. No commit was rewritten.

Orchestrator verification, 11 October 2026, on main with Bun 1.4.3 merged: bun run check exit 0 on macOS (18 Node tests; 791 Bun tests passed, 52 skipped for missing optional toolchains, 0 failed; lint shows main's one warning and two infos). All action pins were checked against the upstream tags and carry their exact release. Linux and Windows evidence comes from CI on the pull request; the loopback listener with the printed localhost address was run on macOS only before that. Left for the owner: the printed address (localhost over a 127.0.0.1 listener), symlinks that point outside the repository staying listed, file names with a pipe, bracket or line break in relationship rows, and the rule that a GET route must never change anything, which only a comment guards.
<!-- SECTION:NOTES:END -->
