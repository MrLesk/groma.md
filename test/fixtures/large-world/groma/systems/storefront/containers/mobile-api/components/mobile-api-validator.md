---
type: C4 Component
title: Mobile Api validator
status: stable
groma:
  id: mobile-api-validator
  parent: mobile-api
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/mobile-api/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/mobile-api/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/mobile-api/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/mobile-api/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/mobile-api/validator-4.ts
      symbol: validator
---

Mobile Api validator of Mobile Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/mobile-api/validator.ts](../../../../../../src/storefront/mobile-api/validator.ts) | [src/storefront/mobile-api/mapper.ts](../../../../../../src/storefront/mobile-api/mapper.ts) | Calls mapper | HTTP |
| [src/storefront/mobile-api/validator.ts](../../../../../../src/storefront/mobile-api/validator.ts) | [src/storefront/mobile-api/reader.ts](../../../../../../src/storefront/mobile-api/reader.ts) | Reads reader | HTTP |
