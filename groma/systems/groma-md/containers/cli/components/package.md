---
type: C4 Component
title: Plugin packages
status: stable
groma:
  id: package
  parent: cli
  code:
    - scanner: typescript
      file: src/scanner/modules/package.ts
    - scanner: typescript
      file: src/scanner/modules/inventory.ts
    - scanner: typescript
      file: src/scanner/modules/config.ts
    - scanner: typescript
      file: src/scanner/modules/published.ts
    - scanner: typescript
      file: src/plugin-management.ts
  group: Scanner management
description: Selects, resolves, installs and restores project plugins by kind
---

Reads explicit plugin selections from plugins.json and manages their package lifecycle. Resolves npm, Git and local sources for scanners, work sources and icon packs; stores pinned sources and scanner defaults. Plugin commands, scanner commands and settings share one add, remove, update and restore operation addressed by plugin id. Resolving a package never runs plugin code; work-source loading checks host compatibility before it imports the adapter and asks its readiness. An icon pack has no code to run: its package resolves to the SVG file of each icon it declares.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/scanner/modules/published.ts](../../../../../../src/scanner/modules/published.ts) | [scanner-package-registry](../../../../../externals/scanner-package-registry.md) | Reads scanner releases | HTTP registry API |
| [src/scanner/modules/package.ts](../../../../../../src/scanner/modules/package.ts) | [scanner-package-registry](../../../../../externals/scanner-package-registry.md) | Downloads scanner packages | Bun install and npm registry protocol |
