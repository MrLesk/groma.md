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
| [developer](developer.md) | [src-cli](../systems/groma-md/containers/cli/components/src-cli.md) | Runs Groma commands | Groma CLI |
| [developer](developer.md) | [task-diff-control](../systems/groma-md/containers/export/components/task-diff-control.md) | Reviews task changes | Browser UI |
| [developer](developer.md) | [revision-control](../systems/groma-md/containers/export/components/revision-control.md) | Browses past revisions | Browser UI |
