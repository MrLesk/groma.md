---
type: C4 Component
title: Cdn Edge config
status: stable
groma:
  id: cdn-edge-config
  parent: cdn-edge
  code:
    - scanner: typescript
      file: src/storefront/cdn-edge/config.ts
      symbol: config
    - scanner: typescript
      file: src/storefront/cdn-edge/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/storefront/cdn-edge/config-2.ts
      symbol: config
---

Cdn Edge config of Cdn Edge.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/cdn-edge/config.ts](../../../../../../src/storefront/cdn-edge/config.ts) | [src/storefront/cdn-edge/logger.ts](../../../../../../src/storefront/cdn-edge/logger.ts) | Calls logger | HTTP |
| [src/storefront/cdn-edge/config.ts](../../../../../../src/storefront/cdn-edge/config.ts) | [src/storefront/cdn-edge/client.ts](../../../../../../src/storefront/cdn-edge/client.ts) | Reads client | HTTP |
