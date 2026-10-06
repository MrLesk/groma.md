---
type: C4 Component
title: Directory cache
status: stable
groma:
  id: directory-cache
  parent: directory
  group: Core
  code:
    - scanner: typescript
      file: src/identity/directory/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/directory/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/directory/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/directory/cache-3.ts
      symbol: cache
---

Directory cache of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/cache.ts](../../../../../../src/identity/directory/cache.ts) | [src/identity/directory/validator.ts](../../../../../../src/identity/directory/validator.ts) | Calls validator | HTTP |
| [src/identity/directory/cache.ts](../../../../../../src/identity/directory/cache.ts) | [src/identity/directory/mapper.ts](../../../../../../src/identity/directory/mapper.ts) | Reads mapper | HTTP |
