---
type: C4 Component
title: Cdn Edge gateway
status: stable
groma:
  id: cdn-edge-gateway
  parent: cdn-edge
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/cdn-edge/gateway.ts
      symbol: gateway
---

Cdn Edge gateway of Cdn Edge.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/cdn-edge/gateway.ts](../../../../../../src/storefront/cdn-edge/gateway.ts) | [src/storefront/cdn-edge/router.ts](../../../../../../src/storefront/cdn-edge/router.ts) | Calls router | HTTP |
| [src/storefront/cdn-edge/gateway.ts](../../../../../../src/storefront/cdn-edge/gateway.ts) | [src/storefront/cdn-edge/session.ts](../../../../../../src/storefront/cdn-edge/session.ts) | Reads session | HTTP |
| [src/storefront/cdn-edge/gateway.ts](../../../../../../src/storefront/cdn-edge/gateway.ts) | [src/storefront/session-store/gateway.ts](../../../../../../src/storefront/session-store/gateway.ts) | Forwards requests | HTTP |
