---
type: C4 Component
title: Catalog Api gateway
status: stable
groma:
  id: catalog-api-gateway
  parent: catalog-api
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/catalog-api/gateway.ts
      symbol: gateway
---

Catalog Api gateway of Catalog Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/catalog-api/gateway.ts](../../../../../../src/catalog/catalog-api/gateway.ts) | [src/catalog/catalog-api/router.ts](../../../../../../src/catalog/catalog-api/router.ts) | Calls router | HTTP |
| [src/catalog/catalog-api/gateway.ts](../../../../../../src/catalog/catalog-api/gateway.ts) | [src/catalog/catalog-api/session.ts](../../../../../../src/catalog/catalog-api/session.ts) | Reads session | HTTP |
| [src/catalog/catalog-api/gateway.ts](../../../../../../src/catalog/catalog-api/gateway.ts) | [src/catalog/pricing/gateway.ts](../../../../../../src/catalog/pricing/gateway.ts) | Forwards requests | HTTP |
