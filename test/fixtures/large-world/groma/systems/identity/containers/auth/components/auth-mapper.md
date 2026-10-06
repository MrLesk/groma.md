---
type: C4 Component
title: Auth mapper
status: stable
groma:
  id: auth-mapper
  parent: auth
  group: Support
  code:
    - scanner: typescript
      file: src/identity/auth/mapper.ts
      symbol: mapper
---

Auth mapper of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/mapper.ts](../../../../../../src/identity/auth/mapper.ts) | [src/identity/auth/reader.ts](../../../../../../src/identity/auth/reader.ts) | Calls reader | HTTP |
| [src/identity/auth/mapper.ts](../../../../../../src/identity/auth/mapper.ts) | [src/identity/auth/writer.ts](../../../../../../src/identity/auth/writer.ts) | Reads writer | HTTP |
