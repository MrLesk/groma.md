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
      file: src/scanner/modules/published.ts
    - scanner: typescript
      file: src/scanner/modules/package-manager.ts
    - scanner: typescript
      file: src/config.ts
    - scanner: typescript
      file: src/plugins/management.ts
  group: Plugins
description: Reads config.json, owns the plugins it lists and restores them by kind
---

Reads and writes config.json, the project's one groma.md configuration, and resolves, installs and restores scanner packages from exact npm, Git and local sources. plugin-management.ts is the one owner of the plugins config.json lists: it reports whether this computer has each of them and adds, updates, removes and restores them by kind, downloading a scanner package or installing the Backlog.md CLI. The plugin commands, groma init, the plugins screen and the groma web restore view all use it. Resolving a package never runs plugin code.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/scanner/modules/package.ts](../../../../../../src/scanner/modules/package.ts) | [scanner-package-registry](../../../../../externals/scanner-package-registry.md) | Downloads scanner packages | Bun install and npm registry protocol |
| [src/scanner/modules/published.ts](../../../../../../src/scanner/modules/published.ts) | [scanner-package-registry](../../../../../externals/scanner-package-registry.md) | Reads scanner releases | Bun package manager and npm registry protocol |
