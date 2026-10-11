---
id: TASK-564
title: Rate how critical each component is and review critical parts first
status: Done
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-11 20:27'
labels:
  - senior
dependencies: []
references:
  - src-architecture-model
  - src-authoring
  - src-cli
  - organisms-details
  - organisms-hierarchy
  - map
  - tree
  - control
  - task-diff-control
  - source-diff
  - instructions
  - src-architecture-findings
  - src-lint-command
  - src-work-pins
  - screen
  - docs/component-markdown.md
  - docs/agent-instructions/index.md
  - src/curate.ts
  - src/history/comparison.ts
  - src/viewers/tui/panes/details.ts
  - src/viewers/web/comparison/details.ts
  - src/viewers/web/comparison/tree.ts
  - src/viewers/web/task-diff/view.ts
modified_files:
  - src/criticality.ts
  - src/types.ts
  - src/architecture-model.ts
  - src/markdown-emitter.ts
  - src/authoring-conflict.ts
  - src/edit.ts
  - src/write-commands.ts
  - src/core.ts
  - src/history/comparison.ts
  - src/viewers/web/organisms/writes.ts
  - src/plain-world.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/tui/panes/details.ts
  - src/sheet/types.ts
  - src/sheet/place.ts
  - src/viewers/web/iso/painting/buildings.ts
  - src/viewers/tui/tree.ts
  - src/viewers/web/organisms/hierarchy.ts
  - src/viewers/web/comparison/tree.ts
  - src/viewers/web/comparison/control.ts
  - src/viewers/web/comparison/details.ts
  - src/viewers/web/task-diff/priority.ts
  - src/viewers/web/task-diff/view.ts
  - src/agent-instructions.ts
  - src/cli.ts
  - src/architecture-findings.ts
  - src/lint-command.ts
  - docs/component-markdown.md
  - docs/agent-instructions/index.md
  - docs/agent-instructions/describe.md
  - docs/agent-instructions/backlog.md
  - src/instructions.ts
  - groma/systems/groma-md/containers/cli/components/history-revisions.md
  - groma/systems/groma-md/containers/cli/components/src-core.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - groma/systems/groma-md/containers/export/components/task-diff-control.md
  - groma/systems/groma-md/containers/cli/components/src-lint-command.md
  - test-bun/revision-comparison.test.ts
  - test-bun/system-curation.test.ts
  - test-bun/tui-criticality.test.ts
  - src/curate.ts
  - docs/agent-instructions/structure.md
  - src/viewers/web/organisms/code-lists.ts
  - src/viewers/web/duplicates/model.ts
  - src/viewers/web/duplicates/control.ts
  - test-bun/web-duplicates.test.ts
  - test-bun/architecture-findings.test.ts
  - docs/architecture-findings.md
  - src/viewers/tui/projection-sheet.ts
  - docs/agent-instructions/inspect.md
  - src/welcome/model.ts
  - test-bun/criticality.test.ts
  - test-bun/editing.test.ts
  - test-bun/lint-command.test.ts
type: feature
ordinal: 4
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An architect's judgment of how much damage a mistake in a part would do, written on the element and used to decide where a review starts. Four levels: low, normal, high, critical. Normal is the default, so a raw scan needs nothing set. Critical means read-only for agents: do not change it, ask a person. The level is human meaning: people and agents set it during curation, Groma.md never derives it. Groma.md may later suggest a level from structure, but it never writes one. An element without a level takes its parent's, so marking a container critical covers its components. Every source file has one owning component, so every file gets the level of its owner without a second list.

Build on the groma.technology field (src/architecture-model.ts, src/markdown-emitter.ts, groma edit and the web details form), ownership (src/source-index.ts), the comparison tree and its changes bar (src/viewers/web/comparison/), task changes (src/viewers/web/task-diff/, src/viewers/source/diff.ts), agent instructions (src/agent-instructions.ts, docs/agent-instructions/), findings (src/architecture-findings.ts, src/lint-command.ts), and the hierarchy and details panes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An element can carry groma.criticality with one of low, normal, high or critical, set with groma edit <id> --criticality <level> and in the web details form, validated like the other groma fields, documented in docs/component-markdown.md and preserved by scans. An element without a level takes its parent's level, and normal when no ancestor has one.
- [x] #2 In a comparison between two revisions and in a task's changes, changed components are ordered by criticality first and by the size of the change second. The changes bar and the task summary say how many critical and how many high components changed before anything else.
- [x] #3 groma agent-instructions prints the critical elements with their files and the rule not to change them without a person's go, and the high elements with the rule to explain every change in the task's implementation notes. groma view <id> --plain prints the level.
- [x] #4 groma lint reports a finding when the modified files of an in-progress or done task belong to a critical component, naming the task and the component, using the existing finding type.
- [x] #5 The web map marks high and critical buildings and their hierarchy rows with a distinct mark that reads the same in light, dark and blueprint. The details pane shows the level and lets a person change it. The terminal details pane shows it.
- [x] #6 docs/component-markdown.md and the agent guides document the four levels, inheritance down the tree and the rule for critical elements.
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
1. Level on the element. groma.criticality holds low, normal, high or critical. groma edit <id> --criticality <level> and the web details form write it, an empty value removes it, and the model validates it like the other groma fields. The model keeps the written level as declaredCriticality. Core resolves the effective level through parents, normal when no ancestor declares one, and annotates every element with both values. Scans never write a level, and a combine refuses a source that declares one. The level sits beside icon and colour in the model, the emitter, groma edit, the combine guard, the comparison and the panes, because this work is stacked on the plugins.json and icon branches.
2. Review order. One comparator ranks by effective level first and by added plus deleted lines second. The Changes list of a comparison is a flat ranked list of the changed components. The task summary lists the loaded file diffs in the same order and keeps recorded files the diff has not loaded yet as pending rows. The changes bar and the task summary start with the critical and high counts when either is above zero. A comparison compares declared levels only, so an edit on a parent does not mark its components changed.
3. Guidance and lint. groma agent-instructions prints the elements whose effective level is critical or high, with their files and rule, above the guide it prints. groma lint reads tasks once through the work source that plugins.json selects and reports each in-progress or done task, meaning any status except the default one, once for every critical component that owns one of its modified files. Without a selected and ready work source there are no tasks; a selected source that cannot be read is an error. That finding is the critical-change kind of ArchitectureFinding; duplicated logic is the other kind, and lint prints unknown icon names after both.
4. Display. High and critical buildings carry ! and !! on the first line of their title in the web map and the terminal map, and on their hierarchy rows. Both marks are ASCII so a terminal card keeps its borders in line, and an icon keeps its own row above the title. The web meta line and the terminal details pane name the level unless it is normal. groma view <id> --plain always prints it.
5. Documentation. docs/component-markdown.md owns the field contract. The agent guide index owns the agent rule and the lint finding. The other guides and instructions point to them.
6. Verification. Type check, lint, the focused tests with the repository's test flags, tui-test for the terminal and a headless browser for the web views. The orchestrator runs the full repository check.

Test coverage. Each entry names the rule and its authority, the wrong result the test catches, and the gap it closes.
(a) Rule: a comparison never propagates a change to ancestors or from them (documented comparison contract). Wrong result: an edit of a parent's level marks its unchanged components Modified and lists them. Gap: comparison fixtures had no level. Test: revision-comparison, a parent-only change of the effective level.
(b) Rule: declaring or clearing a level on an element is that element's own change and shows a criticality reason (AC1, comparison details). Wrong result: the element stays unchanged or shows no reason. Gap: the reasons test had no level. Test: revision-comparison, inherited to explicit and back.
(c) Rule: a combine refuses a source with authored metadata (curation contract). Wrong result: a combine silently drops a declared level. Gap: no source that declares only a level. Test: system-curation, one refused combine with unchanged architecture.
(d) Rule: the terminal details pane names every level except normal on one line that fits 28 content columns (AC5, reviewer decision). Wrong result: a level line on normal elements, or a level joined to the kind line where the pane cuts it. Gap: nothing read the level in detailsLines. Test: tui-criticality, on the lines detailsLines returns.
(e) Rule: the details cursor rests on the row of the action cursor (existing behaviour). Wrong result: the cursor row is off by one when the level line is absent or present. Gap: no test read the cursor of detailsLines. Test: tui-criticality, the cursor row for a normal and a critical element.
(f) Rule: AC4, groma lint reports an in-progress or done task once per critical component that owns one of its modified files. Wrong result: a to-do task reported, an in-progress or done task missed, one task reported once per file, or a component that overrides the level with normal reported. Gap: nothing called criticalTaskFindings. Test: criticality, one hand-built minimum model.
(g) Rule: the count summary is empty unless a critical or high component changed (reviewer decision). Wrong result: 0 critical · 0 high is shown again. Gap: nothing covered criticalitySummary. Test: revision-comparison, two assertions.
(h) Rule: AC2, changed components are ordered by criticality first and by the size of the change second, in a comparison and in a task's changes. Wrong result: the rank ignored or inverted. Gap: the comparison test only checked an order that size alone gives, and nothing called taskReviewFiles. Tests: revision-comparison marks the smallest changed fixture component critical and asserts the row ids; criticality orders one hand-built file list.
(i) Rule: AC5, a high or critical building carries its mark with its title in both maps. Wrong result: the mark alone on the first line of a one-word title, or the terminal map dropping the mark when it rewraps a long title. Gap: no test read the laid lines of a marked building. Test: criticality, one hand-built world read through the sheet and the terminal placement.
(j) Rule: an edit is checked against the value each changed field had when editing began, and the level is one of those fields (edit conflict contract). Wrong result: a stale level edit from the web form overwrites a newer level without a conflict. Gap: the web edit conflict test covered title, overview, description and technology only. Test: editing, one accepted and one stale level edit in the existing test.
(k) Rule: groma lint reads tasks through the work source that plugins.json selects, and a selected source that cannot be read is an error lint reports (reviewer decision at the restack). Wrong result: lint reads the Backlog adapter whatever is selected, or treats a failing source as no tasks and exits 0. Gap: no test runs lint with a work source. Test: lint-command, one project that selects a fixture adapter, read once with a task on a critical component and once failing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented authored criticality and shared inheritance; explicit values remain separate from effective values in the web editor. Changes view uses global criticality/changed-line order; All retains containment. Task files remain grouped by owner and counts deduplicate changed owners. Critical findings resolve files through existing ownership and load the configured work source. Cold simplicity review accepted the design after correcting direct Backlog access. Manual CLI inspection: source CLI help exposes --criticality; plain details prints normal; agent describe guide loads updated rules. groma scan completed (2 created, 111 refreshed); new helpers folded into Architecture model and Task changes panel. git diff --check passes. Builds, tests, and installation were not run at the user’s instruction; visual behavior and non-normal runtime scenarios remain untested.

Specification review traced all six requested behaviors through their entry points and existing owners. Final full-context complexity review found no blocking defects or material simplifications. Acceptance checkboxes record implementation completion supported by static review and CLI inspection, not full runtime verification. Definition of Done verification/check items remain unchecked because builds, tests, and visual exercise were prohibited. A second scan retained both new helpers under their curated owners; unrelated agents’ generated components were left untouched.

Review fixes authorized on 2026-10-09 supersede the earlier no-install/no-test restriction. Criticality remains supporting groma metadata on an existing OKF/C4 element, not a new architecture element. History compares declared values; Groma resolves effective values for review priority and guidance. The metadata guard belongs to curation; presentation belongs to existing terminal and web details.

The new regression tests failed on all four old behaviors: truncated normal level in the native frame, a resolved combine instead of refusal, parent-only edits marking checkout Modified, and an empty reason list for inherited/explicit changes. After the source fixes all 17 focused tests pass. The Changes list now builds flat rows directly; task summaries render sorted TaskFileDiff objects directly. The curation guide now names criticality among authored fields that prevent a combine.

Cold simplicity review (GPT-6.1 Sol, xhigh, no conversation history) found no blockers or further simplifications. Implementer specification review: terminal row satisfies AC5; combine rejects authored criticality before writes; declared-only comparison respects the documented no-ancestor-propagation rule; inherited/explicit changes have a What-tab reason and an Inherit/level field. Existing effective values still drive priority/counts/marks/guidance/lint. Implementer quality review traced curation -> model -> annotated values -> History -> web/TUI presentation, checked test failures against the old implementation, cursor offsets, pending task rows, counts/former context and domain ownership. No blocking finding or new abstraction. All changed source/test files stay below 500 lines; repository lint reports no new complexity warning. Native tui-test root/container/Down-neighbor/200x60 checks passed with full critical level and fixed map positions; screenshots are under /private/tmp/pr122-tui/. Branch CLI scan created 0 and refreshed 103 with no Git changes under groma/. Existing review reproduction now preserves b and its critical lint finding after the refused combine, while inheritance/override/clear, two preserving scans, guidance and priority still work. Integration note: this branch lint reads backlogPlugin directly; after separate PR #117 integration, its configured WorkSource snapshot should feed criticalTaskFindings. No #117 loader was imported.

Final full-context complexity review (GPT-6.1 Sol, xhigh, full relevant user scope/context) found no blocking findings, material simplifications or architecture changes. Full bun run check passed with exit 0: Biome lint and scrollbar check, TypeScript 7.1.0-dev.20260924.1, 16 Node tests, and 780 Bun tests passed; 51 existing optional-toolchain tests skipped, 0 failed. Existing unrelated lint output is one warning and two infos. git diff --check passes. The four new regressions each failed before the fix and the focused group passes 17/17. No architecture paths changed after scanning. Local-only commit authorized; no push, publish or release.

Maintainability pass 2026-10-11, reviewer findings A to F. A: criticalitySummary returns an empty string when no changed component is critical or high; the changes bar hides its summary and the task summary omits the line. The web meta line and the terminal details head name the level only when it is not normal (reviewer decision, which narrows how AC5 shows the level); groma view --plain still prints every level. The bar counts the rows of the Changes list instead of filtering the comparison a second time. B: ArchitectureFinding is the union DuplicatedLogicFinding | CriticalChangeFinding; a critical change carries id, kind and title only. Scans remember and viewers read DuplicatedLogicFinding, so architectureFindingItems is the one place that narrows on kind. C: new imports follow each file's own order; the inline type imports and the dynamic import in src/cli.ts are ordinary imports. src/sheet/place.ts and src/viewers/web/iso/painting/buildings.ts were already in their alphabetical order and did not change. D: docs/component-markdown.md owns the field contract; the agent guide index owns the agent rule and the lint finding, which stays for as long as the task is on the board; describe.md, backlog.md, src/instructions.ts and docs/architecture-findings.md keep one pointer sentence each. E: comparisonTree documents every returned field; the changed set repeated the keys of priorities and is gone; counts and former stay because the All tree and the map filter read them. F: the status filter is named inProgressOrDone; the component-kind check is gone because only a component declares code.

Verification of the 2026-10-11 pass. bun run typecheck passes. bunx biome lint reports 1 warning and 2 infos, the same as before the pass and none in a changed file. Focused Bun tests with the repository flags (--parallel=2 --max-concurrency 1): 99 pass, 1 skip, 0 fail across 18 files; without those flags two unrelated tests hit the 5000 ms project-lock wait under load and pass when rerun alone. Four related Node test files: 16 pass. Each new or changed test failed against a deliberate mutation of its rule and passes on the real code. A headless Chromium harness over the real web modules showed the summary hidden for normal and low and shown for high and critical in the changes bar and the task summary, the meta line for every level, the flat ranked Changes list, and the change counts on the All tree. tui-test on a scratch copy of the edit fixture showed Criticality · critical for the critical component and no level line for the normal one at 150x36 and 200x60. groma lint on that scratch project reported the in-progress and the done task, not the to-do one, and stopped reporting the done task after backlog task complete. groma scan created 0, refreshed 104 and left groma/ unchanged. Not run: the full bun run check and the real page in a browser. Finding X (groma lint reads Backlog directly) waits for the restack on the plugins.json branch.

Review round 2026-10-11, one consolidated list of 20 items, all applied. The model field is declaredCriticality, so criticality always means the effective level; the edit conflict check reads the declared level explicitly. The map mark is added after the title wraps: it joins the first laid line with a no-break space, and the terminal map rewraps from the laid lines, so the mark is never alone on a line and never dropped. renderArchitectureDocument lost its unused criticality parameter, so no writer of new documents can emit a level. criticalTaskFindings moved to src/criticality.ts, lost the unread finding id and the extra configured-status clause, and the Architecture model record says so through groma edit. groma agent-instructions loads and annotates the stored architecture once, under the policy that an unreadable architecture prints only the guide. comparisonTree is now comparisonChanges. The task summary shows every recorded file again: loaded diffs in review order, then pending rows. The building label tests the level, the hierarchy tooltip reads criticality: critical, the lint comment and its empty message describe both kinds of finding, and inspect.md, the human instructions and the welcome text name both lint rules. The task record lost four recorded groma paths that do not exist, and the plan is the final approach.

Verification of the round. bun run typecheck passes. bunx biome lint reports 1 warning and 2 infos, the count from before the first pass, none in a changed file. Focused Bun tests with --parallel=2 --max-concurrency 1: 222 pass, 1 skip, 0 fail across 35 files. Four related Node test files: 16 pass. Every new or changed test failed against a deliberate mutation of its rule: the mark joined with an ordinary space, the terminal rewrap from the title, the mark joined before wrapping, the rank ignored and inverted, the level line always shown and joined to the kind line, and the conflict check without the declared level. Headless Chromium on a groma export of a scratch fixture showed one roof line with the critical mark and a one-word title, the high mark on the first of two lines of a long title, and the labels Orders · critical and Stock reservation and availability · high. The headless harness over the web modules showed ranked loaded rows followed by a pending row and the tooltip criticality: critical. tui-test at 120x36 showed both marks on the first line of their cards. groma lint on the scratch project printed the in-progress task and, with no critical component, the reworded empty message with exit 0. groma scan created 0 and refreshed 104; the only groma change is the curated overview of the Architecture model component. Not run: the full bun run check. Open observation: the terminal draws the critical mark two cells wide while card widths count characters, so a critical card has no padding cell on the right; the text is complete.

Restack 2026-10-11. remediate/118 (plugins.json, then icons and colours) is merged into this branch; 25 files conflicted and each keeps both sides: the level sits beside icon and colour in the model and its validation, the emitter, the edit guards (one helper, hasElementOnlyField, for the three fields only an element takes), the combine guard, ownContent and the comparison reasons, the sheet item, the building label, both details panes, the write commands and the documents. The two conflicted architecture records took the lower branch's text; the scan then created a stand-alone component for src/criticality.ts, which was folded into Architecture model with groma edit, and both overviews were written again through the CLI. groma lint now reads tasks once through workSourceSession, so the selected work source supplies them, no selection means no tasks, and a source that cannot be read ends the command with its message and exit 1; lint prints task findings, duplicates and unknown icons, and its description, comment and empty message name all three. The critical mark is !! (high stays !), both ASCII, so terminal cards keep their borders in line; an icon keeps its own row above the title lines.

Verification of the restack. bun install after the merge changed nothing further. bun run typecheck passes. bunx biome lint reports 1 warning and 2 infos, the unchanged baseline. Focused Bun tests with --parallel=2 --max-concurrency 1: 354 pass, 1 skip, 0 fail across 58 files, including work-source-selection, icon-packs, criticality, the comparison and curation tests and every test that mentions icons, colours, plugins.json or work sources. Four related Node test files: 16 pass. The new lint test failed with the failing source swallowed and with the selection ignored. groma lint on a scratch project that selects a fixture work source and the architecture icon pack printed the in-progress and the done task, not the to-do one, then one unknown icon; --count printed 3; a source whose read throws printed its message with exit 1; without a selected source and with all icons resolved it printed the empty message with exit 0. Headless Chromium on a groma export of that project showed the pack icon on its own row above !! Orders on one line and above ! Stock reservation over and availability, with the labels Orders · critical and Stock reservation and availability · high. tui-test at 150x36 showed the critical card with one padding cell on each side and its three right border cells in one column, the high mark kept on the rewrapped card, and Criticality, Icon and Colour lines in the details pane. groma scan created 0 after the fold; git status for groma/ shows only the Architecture model and Lint command records. Not run: the full bun run check.

Orchestrator verification, 11 October 2026, as the top of the stack plugins.json, icons and colours, criticality, with main merged: bun run check exit 0 (16 Node tests; 808 Bun tests passed, 52 skipped for missing optional toolchains, 0 failed). The implementer's terminal and headless checks cover the mark with and without an icon, the details panes, and groma lint with a selected work source. Kept as the acceptance criteria ask, for the owner to know: the comparison's Changes list is a flat list ranked by level and size (the All view keeps the tree), and groma lint keeps reporting an in-progress or done task that touches a critical component for as long as the task is on the board, with exit code 1. The critical mark is '!!' (two plain characters) because the single wide glyph pushed terminal card borders out of line.

CI correction, 11 October 2026: test-bun/tui-criticality.test.ts located its fixture with a URL pathname, which is not a file path on Windows, so both tests failed there with 'Groma is not initialized here'. The test now copies the fixture into its own temporary directory through path.resolve, as the editing tests do.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Authored low/normal/high/critical metadata stays separate from effective inheritance. Corrected review defects: full terminal level, refusal to combine authored criticality, no child Modified status from parent-only changes, and a concrete criticality reason with Inherit/level comparison. Simplified flat comparison rows and direct sorted task-file rendering. Added four regression behaviors; all failed before fixes and pass afterward. Native TUI root/container/neighbor/200x60 checks and bun run check pass (16 Node; 780 Bun passed, 51 optional-toolchain skips). Both required external reviews and implementer specification/quality reviews found no blockers. Scan created 0 and left groma/ unchanged. Separate PR #117 configured-work-source integration remains a non-blocking integration note.
<!-- SECTION:FINAL_SUMMARY:END -->
