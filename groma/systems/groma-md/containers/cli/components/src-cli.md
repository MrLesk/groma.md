---
type: C4 Component
title: Command interface
status: stable
groma:
  id: src-cli
  parent: cli
  code:
    - scanner: typescript
      file: src/cli.ts
    - scanner: typescript
      file: src/scanner/cli.ts
      symbol: registerScannerCommands
    - scanner: typescript
      file: src/write-commands.ts
      symbol: registerWriteCommands
  group: Project commands
description: Reads CLI commands and starts the requested Groma action
---

Reads commands and options. Starts the selected project action and reports its result.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/cli.ts](../../../../../../src/cli.ts) | [src/scanner.ts](../../../../../../src/scanner.ts) | Starts scans | Function call |
| [src/cli.ts](../../../../../../src/cli.ts) | [src/viewers/web/server.ts](../../../../../../src/viewers/web/server.ts) | Starts the browser map | Function call |
| [src/cli.ts](../../../../../../src/cli.ts) | [src/view-host.ts](../../../../../../src/view-host.ts) | Starts the terminal map | Function call |
| [src/cli.ts](../../../../../../src/cli.ts) | [src/viewers/web/export.ts](../../../../../../src/viewers/web/export.ts) | Exports static maps | Function call |
| [src/cli.ts](../../../../../../src/cli.ts) | [src/authoring.ts](../../../../../../src/authoring.ts) | Dispatches architecture edits | Function call |
| [src/scanner/cli.ts](../../../../../../src/scanner/cli.ts) | [src/scanner/modules/inventory.ts](../../../../../../src/scanner/modules/inventory.ts) | Installs and updates scanners | Function call |
| [src/cli.ts](../../../../../../src/cli.ts) | [src/lint-command.ts](../../../../../../src/lint-command.ts) | Registers the lint command | Function call |
