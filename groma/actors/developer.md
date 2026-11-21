---
type: C4 Actor
title: Developer
status: stable
groma:
  id: developer
description: A person who inspects, scans and curates a project architecture
---

Inspects and maintains the architecture of a software project. Runs scans and architecture commands, reviews source evidence and task changes, and uses the terminal or browser map to understand and curate the system.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [Developer](developer.md "developer") | [Command interface](../systems/groma-md/containers/cli/components/src-cli.md "src-cli") | Runs Groma commands | Groma CLI |
| [Developer](developer.md "developer") | [Task changes panel](../systems/groma-md/containers/export/components/task-diff-control.md "task-diff-control") | Reviews task changes | Browser UI |
| [Developer](developer.md "developer") | [Revision selector](../systems/groma-md/containers/export/components/revision-control.md "revision-control") | Browses past revisions | Browser UI |
