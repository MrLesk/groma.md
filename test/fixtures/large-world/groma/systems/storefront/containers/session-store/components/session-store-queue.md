---
type: C4 Component
title: Session Store queue
status: stable
groma:
  id: session-store-queue
  parent: session-store
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/session-store/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/storefront/session-store/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/storefront/session-store/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/storefront/session-store/queue-3.ts
      symbol: queue
---

Session Store queue of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/queue.ts](../../../../../../src/storefront/session-store/queue.ts) | [src/storefront/session-store/worker.ts](../../../../../../src/storefront/session-store/worker.ts) | Calls worker | HTTP |
| [src/storefront/session-store/queue.ts](../../../../../../src/storefront/session-store/queue.ts) | [src/storefront/session-store/scheduler.ts](../../../../../../src/storefront/session-store/scheduler.ts) | Reads scheduler | HTTP |
