---
type: C4 Component
title: Session Store scheduler
status: stable
groma:
  id: session-store-scheduler
  parent: session-store
  code:
    - scanner: typescript
      file: src/storefront/session-store/scheduler.ts
      symbol: scheduler
---

Session Store scheduler of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/scheduler.ts](../../../../../../src/storefront/session-store/scheduler.ts) | [src/storefront/session-store/metrics.ts](../../../../../../src/storefront/session-store/metrics.ts) | Calls metrics | HTTP |
| [src/storefront/session-store/scheduler.ts](../../../../../../src/storefront/session-store/scheduler.ts) | [src/storefront/session-store/config.ts](../../../../../../src/storefront/session-store/config.ts) | Reads config | HTTP |
