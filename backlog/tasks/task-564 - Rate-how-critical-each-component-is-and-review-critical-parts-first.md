---
id: TASK-564
title: Rate how critical each component is and review critical parts first
status: To Do
assignee: []
created_date: '2026-10-07 23:16'
updated_date: '2026-10-08 15:47'
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
- [ ] #1 An element can carry groma.criticality with one of low, normal, high or critical, set with groma edit <id> --criticality <level> and in the web details form, validated like the other groma fields, documented in docs/component-markdown.md and preserved by scans. An element without a level takes its parent's level, and normal when no ancestor has one.
- [ ] #2 In a comparison between two revisions and in a task's changes, changed components are ordered by criticality first and by the size of the change second. The changes bar and the task summary say how many critical and how many high components changed before anything else.
- [ ] #3 groma agent-instructions prints the critical elements with their files and the rule not to change them without a person's go, and the high elements with the rule to explain every change in the task's implementation notes. groma view <id> --plain prints the level.
- [ ] #4 groma lint reports a finding when the modified files of an in-progress or done task belong to a critical component, naming the task and the component, using the existing finding type.
- [ ] #5 The web map marks high and critical buildings and their hierarchy rows with a distinct mark that reads the same in light, dark and blueprint. The details pane shows the level and lets a person change it. The terminal details pane shows it.
- [ ] #6 docs/component-markdown.md and the agent guides document the four levels, inheritance down the tree and the rule for critical elements.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
