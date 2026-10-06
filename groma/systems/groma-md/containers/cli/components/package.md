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
  group: Scanner management
description: Installs scanner packages from npm, Git or a local folder
---

Resolves and installs scanner packages from npm, Git, or a local folder. Saves the selected sources and restores missing packages.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/scanner/modules/published.ts](../../../../../../src/scanner/modules/published.ts) | [scanner-package-registry](../../../../../externals/scanner-package-registry.md) | Reads scanner releases | HTTP registry API |
| [src/scanner/modules/package.ts](../../../../../../src/scanner/modules/package.ts) | [scanner-package-registry](../../../../../externals/scanner-package-registry.md) | Downloads scanner packages | Bun install and npm registry protocol |
