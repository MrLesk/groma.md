---
type: C4 Component
title: Mobile Api config
status: stable
groma:
  id: mobile-api-config
  parent: mobile-api
  code:
    - scanner: typescript
      file: src/storefront/mobile-api/config.ts
      symbol: config
    - scanner: typescript
      file: src/storefront/mobile-api/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/storefront/mobile-api/config-2.ts
      symbol: config
---

Mobile Api config of Mobile Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/mobile-api/config.ts](../../../../../../src/storefront/mobile-api/config.ts) | [src/storefront/mobile-api/logger.ts](../../../../../../src/storefront/mobile-api/logger.ts) | Calls logger | HTTP |
| [src/storefront/mobile-api/config.ts](../../../../../../src/storefront/mobile-api/config.ts) | [src/storefront/mobile-api/client.ts](../../../../../../src/storefront/mobile-api/client.ts) | Reads client | HTTP |
