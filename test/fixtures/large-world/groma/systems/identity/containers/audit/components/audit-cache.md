---
type: C4 Component
title: Audit cache
status: stable
groma:
  id: audit-cache
  parent: audit
  group: Core
  code:
    - scanner: typescript
      file: src/identity/audit/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/audit/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/audit/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/audit/cache-3.ts
      symbol: cache
---

Audit cache of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/cache.ts](../../../../../../src/identity/audit/cache.ts) | [src/identity/audit/validator.ts](../../../../../../src/identity/audit/validator.ts) | Calls validator | HTTP |
| [src/identity/audit/cache.ts](../../../../../../src/identity/audit/cache.ts) | [src/identity/audit/mapper.ts](../../../../../../src/identity/audit/mapper.ts) | Reads mapper | HTTP |
