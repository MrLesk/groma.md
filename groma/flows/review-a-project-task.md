---
type: Groma Flow
title: Review a project task
groma:
  id: review-a-project-task
---

In the live browser map, a developer opens a selected Backlog task. The task panel requests its current details through the browser data source and local web host. The Backlog adapter reads the task through the public CLI, and the result is shown in the panel. Task placement uses modified source files and exact architecture IDs; an unlinked task has no map pin. File-diff loading is a separate request and is not part of this task-details flow.

## Steps

| From | To | Action |
| --- | --- | --- |
| [Developer](../actors/developer.md "developer") | [Task changes panel](../systems/groma-md/containers/export/components/task-diff-control.md "task-diff-control") | Open a selected task in the browser |
| [Task changes panel](../systems/groma-md/containers/export/components/task-diff-control.md "task-diff-control") | [Browser data](../systems/groma-md/containers/export/components/data.md "data") | Request the selected task details |
| [Browser data](../systems/groma-md/containers/export/components/data.md "data") | [Web host](../systems/groma-md/containers/cli/components/web-server.md "web-server") | Send the task ID to the local task endpoint |
| [Web host](../systems/groma-md/containers/cli/components/web-server.md "web-server") | [Backlog adapter](../systems/groma-md/containers/cli/components/backlog-src-index.md "backlog-src-index") | Ask the work-source adapter for the selected task |
| [Backlog adapter](../systems/groma-md/containers/cli/components/backlog-src-index.md "backlog-src-index") | [Backlog.md](../externals/backlog-md.md "backlog-md") | Read task details using backlog task view with JSON output |
