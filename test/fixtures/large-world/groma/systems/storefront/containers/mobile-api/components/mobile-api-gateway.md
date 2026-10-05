---
type: C4 Component
title: Mobile Api gateway
status: stable
groma:
  id: mobile-api-gateway
  parent: mobile-api
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/mobile-api/gateway.ts
      symbol: gateway
---

Mobile Api gateway of Mobile Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/mobile-api/gateway.ts](../../../../../../src/storefront/mobile-api/gateway.ts) | [src/storefront/mobile-api/router.ts](../../../../../../src/storefront/mobile-api/router.ts) | Calls router | HTTP |
| [src/storefront/mobile-api/gateway.ts](../../../../../../src/storefront/mobile-api/gateway.ts) | [src/storefront/mobile-api/session.ts](../../../../../../src/storefront/mobile-api/session.ts) | Reads session | HTTP |
| [src/storefront/mobile-api/gateway.ts](../../../../../../src/storefront/mobile-api/gateway.ts) | [src/storefront/search/gateway.ts](../../../../../../src/storefront/search/gateway.ts) | Forwards requests | HTTP |
