---
type: C4 Component
title: Backlog adapter
status: stable
groma:
  id: backlog-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/work-sources/backlog/src/index.ts
  group: Project work
description: Reads and watches Backlog.md tasks through its CLI
---

Reads tasks through the Backlog CLI. Watches the CLI output and reports task changes without reading Backlog storage files.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [plugins/work-sources/backlog/src/index.ts](../../../../../../plugins/work-sources/backlog/src/index.ts) | [backlog-md](../../../../../externals/backlog-md.md) | Reads and watches tasks | Backlog CLI and JSON |
