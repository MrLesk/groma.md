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
  group: Project work
description: Shows a selected task and the source lines it changed
---

Shows the selected task details and file differences. Opens the affected source lines for review.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/viewers/web/task-diff/control.ts](../../../../../../src/viewers/web/task-diff/control.ts) | [src/viewers/web/data.ts](../../../../../../src/viewers/web/data.ts) | Loads task changes | Bound function calls |

## Derived relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/viewers/web/task-diff/control.ts](../../../../../../src/viewers/web/task-diff/control.ts) | [src/viewers/web/render.ts](../../../../../../src/viewers/web/render.ts) | Invokes supplied callbacks: repaint, world | typescript |
