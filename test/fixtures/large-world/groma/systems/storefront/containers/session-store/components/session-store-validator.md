---
type: C4 Component
title: Session Store validator
status: stable
groma:
  id: session-store-validator
  parent: session-store
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/session-store/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/session-store/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/session-store/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/session-store/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/session-store/validator-4.ts
      symbol: validator
---

Session Store validator of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/validator.ts](../../../../../../src/storefront/session-store/validator.ts) | [src/storefront/session-store/mapper.ts](../../../../../../src/storefront/session-store/mapper.ts) | Calls mapper | HTTP |
| [src/storefront/session-store/validator.ts](../../../../../../src/storefront/session-store/validator.ts) | [src/storefront/session-store/reader.ts](../../../../../../src/storefront/session-store/reader.ts) | Reads reader | HTTP |
