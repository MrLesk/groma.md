---
type: C4 Component
title: Search gateway
status: stable
groma:
  id: search-gateway
  parent: search
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/search/gateway.ts
      symbol: gateway
---

Search gateway of Search.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/search/gateway.ts](../../../../../../src/storefront/search/gateway.ts) | [src/storefront/search/router.ts](../../../../../../src/storefront/search/router.ts) | Calls router | HTTP |
| [src/storefront/search/gateway.ts](../../../../../../src/storefront/search/gateway.ts) | [src/storefront/search/session.ts](../../../../../../src/storefront/search/session.ts) | Reads session | HTTP |
| [src/storefront/search/gateway.ts](../../../../../../src/storefront/search/gateway.ts) | [src/storefront/cdn-edge/gateway.ts](../../../../../../src/storefront/cdn-edge/gateway.ts) | Forwards requests | HTTP |
