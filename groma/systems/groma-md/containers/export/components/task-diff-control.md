---
type: C4 Component
title: Task changes panel
status: stable
groma:
  id: task-diff-control
  parent: export
  code:
    - scanner: typescript
      file: src/viewers/web/task-diff/control.ts
    - scanner: typescript
      file: src/viewers/web/task-diff/view.ts
    - scanner: typescript
      file: src/viewers/web/task-diff/updates.ts
    - scanner: typescript
      file: src/viewers/web/task-diff/priority.ts
      symbol: taskReviewFiles
  group: Project work
description: Shows a selected task and the source lines it changed
---

Shows the selected task details and file differences. Groups files by their owning component and orders review by criticality, then added and deleted lines. Leads the summary with counts of critical and high components changed. Opens the affected source lines for review.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/viewers/web/task-diff/control.ts](../../../../../../src/viewers/web/task-diff/control.ts) | [src/viewers/web/data.ts](../../../../../../src/viewers/web/data.ts) | Loads task changes | Bound function calls |

## Derived relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/viewers/web/task-diff/control.ts](../../../../../../src/viewers/web/task-diff/control.ts) | [src/viewers/web/render.ts](../../../../../../src/viewers/web/render.ts) | Invokes supplied callbacks: repaint, world | typescript |
