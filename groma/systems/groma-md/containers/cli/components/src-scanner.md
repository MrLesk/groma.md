---
type: C4 Component
title: Scan results
status: stable
groma:
  id: src-scanner
  parent: cli
  code:
    - scanner: typescript
      file: src/scanner.ts
    - scanner: typescript
      file: src/scan-reconciler.ts
    - scanner: typescript
      file: src/scan-component-naming.ts
    - scanner: typescript
      file: src/scan-source-units.ts
      symbol: sourceUnitGroups
    - scanner: typescript
      file: src/scan-entrypoints.ts
  group: Source scanning
description: Folds successful scanner results into stored ownership and records
---

Updates architecture records from successful scanner results. Preserves authored meaning and the assigned owner of each source file.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/scanner.ts](../../../../../../src/scanner.ts) | [src/scanner/registry.ts](../../../../../../src/scanner/registry.ts) | Collects scanner results | Function call |
| [src/scanner.ts](../../../../../../src/scanner.ts) | [src/scan-reconciler.ts](../../../../../../src/scan-reconciler.ts) | Reconciles scan results | Function call |
| [src/scan-reconciler.ts](../../../../../../src/scan-reconciler.ts) | [src/markdown-emitter.ts](../../../../../../src/markdown-emitter.ts) | Writes architecture records | Function call |
| [src/scan-reconciler.ts](../../../../../../src/scan-reconciler.ts) | [src/relationship-inference.ts](../../../../../../src/relationship-inference.ts) | Derives relationships | Function call |
| [src/scan-reconciler.ts](../../../../../../src/scan-reconciler.ts) | [src/architecture-findings.ts](../../../../../../src/architecture-findings.ts) | Finds possible duplicates | Function call |

## Derived relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/scanner.ts](../../../../../../src/scanner.ts) | [src/cli.ts](../../../../../../src/cli.ts) | Invokes supplied callback: onFold | typescript |
