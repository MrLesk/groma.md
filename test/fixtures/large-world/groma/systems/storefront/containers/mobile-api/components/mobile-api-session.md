---
type: C4 Component
title: Mobile Api session
status: stable
groma:
  id: mobile-api-session
  parent: mobile-api
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/mobile-api/session.ts
      symbol: session
    - scanner: typescript
      file: src/storefront/mobile-api/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/storefront/mobile-api/session-2.ts
      symbol: session
---

Mobile Api session of Mobile Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/mobile-api/session.ts](../../../../../../src/storefront/mobile-api/session.ts) | [src/storefront/mobile-api/cache.ts](../../../../../../src/storefront/mobile-api/cache.ts) | Calls cache | HTTP |
| [src/storefront/mobile-api/session.ts](../../../../../../src/storefront/mobile-api/session.ts) | [src/storefront/mobile-api/validator.ts](../../../../../../src/storefront/mobile-api/validator.ts) | Reads validator | HTTP |
