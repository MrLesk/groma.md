---
type: C4 Component
title: Cdn Edge metrics
status: stable
groma:
  id: cdn-edge-metrics
  parent: cdn-edge
  code:
    - scanner: typescript
      file: src/storefront/cdn-edge/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/storefront/cdn-edge/metrics-1.ts
      symbol: metrics
---

Cdn Edge metrics of Cdn Edge.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/cdn-edge/metrics.ts](../../../../../../src/storefront/cdn-edge/metrics.ts) | [src/storefront/cdn-edge/config.ts](../../../../../../src/storefront/cdn-edge/config.ts) | Calls config | HTTP |
| [src/storefront/cdn-edge/metrics.ts](../../../../../../src/storefront/cdn-edge/metrics.ts) | [src/storefront/cdn-edge/logger.ts](../../../../../../src/storefront/cdn-edge/logger.ts) | Reads logger | HTTP |
