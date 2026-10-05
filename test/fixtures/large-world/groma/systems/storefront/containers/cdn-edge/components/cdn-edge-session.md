---
type: C4 Component
title: Cdn Edge session
status: stable
groma:
  id: cdn-edge-session
  parent: cdn-edge
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/cdn-edge/session.ts
      symbol: session
    - scanner: typescript
      file: src/storefront/cdn-edge/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/storefront/cdn-edge/session-2.ts
      symbol: session
---

Cdn Edge session of Cdn Edge.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/cdn-edge/session.ts](../../../../../../src/storefront/cdn-edge/session.ts) | [src/storefront/cdn-edge/cache.ts](../../../../../../src/storefront/cdn-edge/cache.ts) | Calls cache | HTTP |
| [src/storefront/cdn-edge/session.ts](../../../../../../src/storefront/cdn-edge/session.ts) | [src/storefront/cdn-edge/validator.ts](../../../../../../src/storefront/cdn-edge/validator.ts) | Reads validator | HTTP |
