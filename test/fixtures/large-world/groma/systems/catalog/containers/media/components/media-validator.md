---
type: C4 Component
title: Media validator
status: stable
groma:
  id: media-validator
  parent: media
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/media/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/media/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/media/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/media/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/media/validator-4.ts
      symbol: validator
---

Media validator of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/validator.ts](../../../../../../src/catalog/media/validator.ts) | [src/catalog/media/mapper.ts](../../../../../../src/catalog/media/mapper.ts) | Calls mapper | HTTP |
| [src/catalog/media/validator.ts](../../../../../../src/catalog/media/validator.ts) | [src/catalog/media/reader.ts](../../../../../../src/catalog/media/reader.ts) | Reads reader | HTTP |
