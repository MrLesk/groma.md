---
type: C4 Component
title: Mobile Api worker
status: stable
groma:
  id: mobile-api-worker
  parent: mobile-api
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/mobile-api/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/mobile-api/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/mobile-api/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/mobile-api/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/mobile-api/worker-4.ts
      symbol: worker
---

Mobile Api worker of Mobile Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/mobile-api/worker.ts](../../../../../../src/storefront/mobile-api/worker.ts) | [src/storefront/mobile-api/scheduler.ts](../../../../../../src/storefront/mobile-api/scheduler.ts) | Calls scheduler | HTTP |
| [src/storefront/mobile-api/worker.ts](../../../../../../src/storefront/mobile-api/worker.ts) | [src/storefront/mobile-api/metrics.ts](../../../../../../src/storefront/mobile-api/metrics.ts) | Reads metrics | HTTP |
