---
type: C4 Component
title: Session Store worker
status: stable
groma:
  id: session-store-worker
  parent: session-store
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/session-store/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/session-store/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/session-store/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/session-store/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/storefront/session-store/worker-4.ts
      symbol: worker
---

Session Store worker of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/worker.ts](../../../../../../src/storefront/session-store/worker.ts) | [src/storefront/session-store/scheduler.ts](../../../../../../src/storefront/session-store/scheduler.ts) | Calls scheduler | HTTP |
| [src/storefront/session-store/worker.ts](../../../../../../src/storefront/session-store/worker.ts) | [src/storefront/session-store/metrics.ts](../../../../../../src/storefront/session-store/metrics.ts) | Reads metrics | HTTP |
