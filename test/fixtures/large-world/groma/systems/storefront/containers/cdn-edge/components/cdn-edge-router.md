---
type: C4 Component
title: Cdn Edge router
status: stable
groma:
  id: cdn-edge-router
  parent: cdn-edge
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/cdn-edge/router.ts
      symbol: router
    - scanner: typescript
      file: src/storefront/cdn-edge/router-1.ts
      symbol: router
---

Cdn Edge router of Cdn Edge.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/cdn-edge/router.ts](../../../../../../src/storefront/cdn-edge/router.ts) | [src/storefront/cdn-edge/session.ts](../../../../../../src/storefront/cdn-edge/session.ts) | Calls session | HTTP |
| [src/storefront/cdn-edge/router.ts](../../../../../../src/storefront/cdn-edge/router.ts) | [src/storefront/cdn-edge/cache.ts](../../../../../../src/storefront/cdn-edge/cache.ts) | Reads cache | HTTP |
