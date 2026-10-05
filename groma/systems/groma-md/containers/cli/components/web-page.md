---
type: C4 Component
title: Web page builder
status: stable
groma:
  id: web-page
  parent: cli
  code:
    - scanner: typescript
      file: src/viewers/web/page.ts
      symbol: renderPage
    - scanner: typescript
      file: src/viewers/web/runtime.ts
    - scanner: typescript
      file: src/viewers/web/payload.ts
  group: Browser delivery
description: Builds the browser page, script and initial architecture payload
---

Builds the browser script and the initial page. Loads the architecture model and map layout for delivery.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/viewers/web/runtime.ts](../../../../../../src/viewers/web/runtime.ts) | [src/sheet/scene.ts](../../../../../../src/sheet/scene.ts) | Lays out the map | Function call |
| [src/viewers/web/page.ts](../../../../../../src/viewers/web/page.ts) | [src/viewers/web/sharing/metadata.ts](../../../../../../src/viewers/web/sharing/metadata.ts) | Embeds sharing metadata | Function call |
