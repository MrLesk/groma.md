---
type: C4 Component
title: Session Store metrics
status: stable
groma:
  id: session-store-metrics
  parent: session-store
  code:
    - scanner: typescript
      file: src/storefront/session-store/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/storefront/session-store/metrics-1.ts
      symbol: metrics
---

Session Store metrics of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/metrics.ts](../../../../../../src/storefront/session-store/metrics.ts) | [src/storefront/session-store/config.ts](../../../../../../src/storefront/session-store/config.ts) | Calls config | HTTP |
| [src/storefront/session-store/metrics.ts](../../../../../../src/storefront/session-store/metrics.ts) | [src/storefront/session-store/logger.ts](../../../../../../src/storefront/session-store/logger.ts) | Reads logger | HTTP |
