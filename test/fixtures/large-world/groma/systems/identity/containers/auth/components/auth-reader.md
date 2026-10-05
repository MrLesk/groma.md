---
type: C4 Component
title: Auth reader
status: stable
groma:
  id: auth-reader
  parent: auth
  group: Support
  code:
    - scanner: typescript
      file: src/identity/auth/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/identity/auth/reader-1.ts
      symbol: reader
---

Auth reader of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/reader.ts](../../../../../../src/identity/auth/reader.ts) | [src/identity/auth/writer.ts](../../../../../../src/identity/auth/writer.ts) | Calls writer | HTTP |
| [src/identity/auth/reader.ts](../../../../../../src/identity/auth/reader.ts) | [src/identity/auth/queue.ts](../../../../../../src/identity/auth/queue.ts) | Reads queue | HTTP |
