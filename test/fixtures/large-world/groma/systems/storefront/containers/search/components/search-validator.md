---
type: C4 Component
title: Search validator
status: stable
groma:
  id: search-validator
  parent: search
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/search/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/search/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/search/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/search/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/search/validator-4.ts
      symbol: validator
---

Search validator of Search.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/search/validator.ts](../../../../../../src/storefront/search/validator.ts) | [src/storefront/search/mapper.ts](../../../../../../src/storefront/search/mapper.ts) | Calls mapper | HTTP |
| [src/storefront/search/validator.ts](../../../../../../src/storefront/search/validator.ts) | [src/storefront/search/reader.ts](../../../../../../src/storefront/search/reader.ts) | Reads reader | HTTP |
