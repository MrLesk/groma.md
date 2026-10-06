---
type: C4 Component
title: Browser data
status: stable
groma:
  id: data
  parent: export
  code:
    - scanner: typescript
      file: src/viewers/web/data.ts
    - scanner: typescript
      file: src/viewers/web/authoring.ts
  group: Browser session
description: Loads live or exported architecture data into the browser
---

Reads live updates from the local server or saved data from a static export. Sends permitted write and scanner actions to the server.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/viewers/web/data.ts](../../../../../../src/viewers/web/data.ts) | [src/viewers/web/map-session.ts](../../../../../../src/viewers/web/map-session.ts) | Reads and writes live data | HTTP and server events |

## Derived relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/viewers/web/authoring.ts](../../../../../../src/viewers/web/authoring.ts) | [src/viewers/web/render.ts](../../../../../../src/viewers/web/render.ts) | Invokes supplied callbacks: live, world | typescript |
