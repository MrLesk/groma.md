---
id: TASK-564
title: Rate how critical each component is and review critical parts first
status: Done
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-09 08:03'
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
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Store and validate authored criticality; resolve inherited levels through existing containment and ownership. 2. Extend element editing, plain/TUI details, and matching map/tree marks. 3. Prioritize comparison and task changes by level and changed lines, with critical/high counts first. 4. Print agent rules and affected files; report critical task changes through architecture findings. 5. Document semantics, inspect diffs, and scan/curate task-owned architecture. No installs, builds, or tests per user instruction.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented authored criticality and shared inheritance; explicit values remain separate from effective values in the web editor. Changes view uses global criticality/changed-line order; All retains containment. Task files remain grouped by owner and counts deduplicate changed owners. Critical findings resolve files through existing ownership and load the configured work source. Cold simplicity review accepted the design after correcting direct Backlog access. Manual CLI inspection: source CLI help exposes --criticality; plain details prints normal; agent describe guide loads updated rules. groma scan completed (2 created, 111 refreshed); new helpers folded into Architecture model and Task changes panel. git diff --check passes. Builds, tests, and installation were not run at the user’s instruction; visual behavior and non-normal runtime scenarios remain untested.

Specification review traced all six requested behaviors through their entry points and existing owners. Final full-context complexity review found no blocking defects or material simplifications. Acceptance checkboxes record implementation completion supported by static review and CLI inspection, not full runtime verification. Definition of Done verification/check items remain unchecked because builds, tests, and visual exercise were prohibited. A second scan retained both new helpers under their curated owners; unrelated agents’ generated components were left untouched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added low/normal/high/critical metadata, inheritance, CLI/web editing, map/tree marks, plain and terminal detail levels, priority-ordered comparisons and task changes, critical/high counts, agent guidance, and critical-task lint findings. Updated the Markdown contract, agent guides, and architecture ownership. Static reviews, CLI help/details/guide inspection, scans, and whitespace review completed. Builds and tests were not run per instruction; no commit or status change.
<!-- SECTION:FINAL_SUMMARY:END -->
