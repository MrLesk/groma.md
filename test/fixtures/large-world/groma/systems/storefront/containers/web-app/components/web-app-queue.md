---
type: C4 Component
title: Web App queue
status: stable
groma:
  id: web-app-queue
  parent: web-app
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/web-app/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/storefront/web-app/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/storefront/web-app/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/storefront/web-app/queue-3.ts
      symbol: queue
---

Web App queue of Web App.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/web-app/queue.ts](../../../../../../src/storefront/web-app/queue.ts) | [src/storefront/web-app/worker.ts](../../../../../../src/storefront/web-app/worker.ts) | Calls worker | HTTP |
| [src/storefront/web-app/queue.ts](../../../../../../src/storefront/web-app/queue.ts) | [src/storefront/web-app/scheduler.ts](../../../../../../src/storefront/web-app/scheduler.ts) | Reads scheduler | HTTP |
