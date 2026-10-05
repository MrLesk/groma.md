---
type: C4 Component
title: Cdn Edge validator
status: stable
groma:
  id: cdn-edge-validator
  parent: cdn-edge
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/cdn-edge/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/cdn-edge/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/cdn-edge/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/cdn-edge/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/storefront/cdn-edge/validator-4.ts
      symbol: validator
---

Cdn Edge validator of Cdn Edge.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/cdn-edge/validator.ts](../../../../../../src/storefront/cdn-edge/validator.ts) | [src/storefront/cdn-edge/mapper.ts](../../../../../../src/storefront/cdn-edge/mapper.ts) | Calls mapper | HTTP |
| [src/storefront/cdn-edge/validator.ts](../../../../../../src/storefront/cdn-edge/validator.ts) | [src/storefront/cdn-edge/reader.ts](../../../../../../src/storefront/cdn-edge/reader.ts) | Reads reader | HTTP |
