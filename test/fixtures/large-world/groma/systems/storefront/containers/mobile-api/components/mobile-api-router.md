---
type: C4 Component
title: Mobile Api router
status: stable
groma:
  id: mobile-api-router
  parent: mobile-api
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/mobile-api/router.ts
      symbol: router
    - scanner: typescript
      file: src/storefront/mobile-api/router-1.ts
      symbol: router
---

Mobile Api router of Mobile Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/mobile-api/router.ts](../../../../../../src/storefront/mobile-api/router.ts) | [src/storefront/mobile-api/session.ts](../../../../../../src/storefront/mobile-api/session.ts) | Calls session | HTTP |
| [src/storefront/mobile-api/router.ts](../../../../../../src/storefront/mobile-api/router.ts) | [src/storefront/mobile-api/cache.ts](../../../../../../src/storefront/mobile-api/cache.ts) | Reads cache | HTTP |
