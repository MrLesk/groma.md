---
id: TASK-564
title: Rate how critical each component is and review critical parts first
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-11 16:22'
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
  - groma/systems/groma-md/components/criticality.md
  - groma/systems/groma-md/components/priority.md
  - groma/systems/groma-md/containers/cli/components/criticality.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - groma/systems/groma-md/containers/export/components/priority.md
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
1. Correct the four review failures within existing owners: readable terminal level, refusal to combine authored criticality, declared-only own-content changes, and concrete inherited-versus-explicit reasons. Keep effective levels for priority, counts, marks, instructions and lint. 2. Build comparison rows directly and render sorted task file objects directly. 3. Extend focused fixture coverage for the reproduced failures, run native TUI validation and bun run check. 4. Run one cold simplicity review, implementer specification/quality reviews, then one full-context complexity review; curate task-caused architecture and make a local task commit.

Regression coverage: (a) Comparison contract says ancestor edits do not propagate status. Existing comparison fixtures omit criticality; extend revision-comparison tests with a parent-only effective-level change and assert unchanged child status, empty Changes order and zero critical changes. (b) Same effective level with a newly declared override must produce a concrete reason and before/after field; existing reasons coverage omits criticality. Extend that fixture test for inherited-to-explicit normal and critical. (c) Combine contract refuses authored human metadata. Existing system-curation tests cover concept references but not criticality-only sources; add the smallest scanned sibling combine refusal and assert unchanged architecture/ownership. (d) AC5 requires readable terminal level. Existing tests do not render criticality into the fixed-width details pane; add one native renderer test at 28 content columns asserting the complete level for all four values.

Maintainability pass (2026-10-11), reviewer findings A to F. A: show the critical and high count summary only when one count is above zero, and the level in the web meta line and the terminal details head only when it is not normal; groma view --plain keeps printing it. B: ArchitectureFinding becomes a union discriminated on kind, each kind with its own fields. C: every new import follows its file's import style. D: each documented rule keeps one owner (field contract in docs/component-markdown.md, agent rule in the agent guide index); the other places keep one sentence with a pointer. E: delete what the flat Changes list left redundant and say plainly what comparisonTree returns. F: name the in-progress-or-done rule in criticalTaskFindings.

Test coverage for this pass. (a) Rule: the terminal details pane shows the level only when it is not normal, and shows it complete at 28 columns (reviewer decision A, AC5). Wrong result caught: a Criticality line on every normal element, or a missing or cut-off non-normal level. Gap: the existing terminal test expects all four levels to be shown; change only its normal case. (b) Rule: the details cursor rests on the row of the action cursor (existing behaviour). Wrong result caught: the cursor row is off by one when the level line is absent or present. Gap: no test reads the cursor of detailsLines; add one comparison of the cursor row for a normal and a critical element. (c) Rule: AC4, groma lint reports an in-progress or done task once per critical component its modified files belong to. Wrong result caught: a to-do task reported, an in-progress or done task missed, one task reported once per file, or a component that overrides the level with normal reported. Gap: nothing calls criticalTaskFindings and B and F rewrite it; add one unit test over a hand-built minimum model. (d) Rule: the count summary is empty unless a critical or high component changed (reviewer decision A). Wrong result caught: 0 critical · 0 high is shown again. Gap: nothing covers criticalitySummary; add two assertions.
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
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Authored low/normal/high/critical metadata stays separate from effective inheritance. Corrected review defects: full terminal level, refusal to combine authored criticality, no child Modified status from parent-only changes, and a concrete criticality reason with Inherit/level comparison. Simplified flat comparison rows and direct sorted task-file rendering. Added four regression behaviors; all failed before fixes and pass afterward. Native TUI root/container/neighbor/200x60 checks and bun run check pass (16 Node; 780 Bun passed, 51 optional-toolchain skips). Both required external reviews and implementer specification/quality reviews found no blockers. Scan created 0 and left groma/ unchanged. Separate PR #117 configured-work-source integration remains a non-blocking integration note.
<!-- SECTION:FINAL_SUMMARY:END -->
