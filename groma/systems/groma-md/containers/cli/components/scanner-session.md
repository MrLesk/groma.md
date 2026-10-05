---
type: C4 Component
title: Live scanner session
status: stable
groma:
  id: scanner-session
  parent: cli
  code:
    - scanner: typescript
      file: src/scanner/session.ts
  group: Source scanning
description: Owns live scanner state for an open terminal or browser viewer
---

Owns the scanner state for an open viewer. Applies settings changes and connects source updates to architecture updates.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/scanner/session.ts](../../../../../../src/scanner/session.ts) | [src/scanner/source-watch.ts](../../../../../../src/scanner/source-watch.ts) | Watches source changes | Function call |
| [src/scanner/session.ts](../../../../../../src/scanner/session.ts) | [src/scanner/modules/settings.ts](../../../../../../src/scanner/modules/settings.ts) | Manages scanner settings | Function call |

## Derived relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/scanner/session.ts](../../../../../../src/scanner/session.ts) | [src/view-host.ts](../../../../../../src/view-host.ts) | Invokes supplied callbacks: onFold, onSettings | typescript |
| [src/scanner/session.ts](../../../../../../src/scanner/session.ts) | [src/viewers/web/map-session.ts](../../../../../../src/viewers/web/map-session.ts) | Invokes supplied callbacks: onFold, onSettings, watchesFile | typescript |
