---
type: C4 Component
title: Web App worker
status: stable
groma:
  id: web-app-worker
  parent: web-app
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/web-app/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/web-app/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/web-app/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/web-app/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/web-app/worker-4.ts
      symbol: worker
---

Web App worker of Web App.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/web-app/worker.ts](../../../../../../src/storefront/web-app/worker.ts) | [src/storefront/web-app/scheduler.ts](../../../../../../src/storefront/web-app/scheduler.ts) | Calls scheduler | HTTP |
| [src/storefront/web-app/worker.ts](../../../../../../src/storefront/web-app/worker.ts) | [src/storefront/web-app/metrics.ts](../../../../../../src/storefront/web-app/metrics.ts) | Reads metrics | HTTP |
