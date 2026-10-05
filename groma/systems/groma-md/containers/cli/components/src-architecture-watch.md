---
type: C4 Component
title: Architecture watch
status: stable
groma:
  id: src-architecture-watch
  parent: cli
  code:
    - scanner: typescript
      file: src/architecture-watch.ts
      symbol: watchArchitecture
  group: Architecture records
description: Notifies open viewers when architecture files change
---

Watches the architecture records. Tells open viewers when these records change.

## Derived relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/architecture-watch.ts](../../../../../../src/architecture-watch.ts) | [src/view-host.ts](../../../../../../src/view-host.ts) | Invokes supplied callback: onChange | typescript |
| [src/architecture-watch.ts](../../../../../../src/architecture-watch.ts) | [src/viewers/tui/scanner-settings.ts](../../../../../../src/viewers/tui/scanner-settings.ts) | Invokes supplied callback: onChange | typescript |
| [src/architecture-watch.ts](../../../../../../src/architecture-watch.ts) | [src/viewers/web/export.ts](../../../../../../src/viewers/web/export.ts) | Invokes supplied callback: onChange | typescript |
| [src/architecture-watch.ts](../../../../../../src/architecture-watch.ts) | [src/viewers/web/map-session.ts](../../../../../../src/viewers/web/map-session.ts) | Invokes supplied callback: onChange | typescript |
