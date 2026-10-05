---
type: C4 Component
title: Sessions cache
status: stable
groma:
  id: sessions-cache
  parent: sessions
  group: Core
  code:
    - scanner: typescript
      file: src/identity/sessions/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/sessions/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/sessions/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/sessions/cache-3.ts
      symbol: cache
---

Sessions cache of Sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/sessions/cache.ts](../../../../../../src/identity/sessions/cache.ts) | [src/identity/sessions/validator.ts](../../../../../../src/identity/sessions/validator.ts) | Calls validator | HTTP |
| [src/identity/sessions/cache.ts](../../../../../../src/identity/sessions/cache.ts) | [src/identity/sessions/mapper.ts](../../../../../../src/identity/sessions/mapper.ts) | Reads mapper | HTTP |
