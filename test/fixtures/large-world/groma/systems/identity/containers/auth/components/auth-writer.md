---
type: C4 Component
title: Auth writer
status: stable
groma:
  id: auth-writer
  parent: auth
  group: Support
  code:
    - scanner: typescript
      file: src/identity/auth/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/identity/auth/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/identity/auth/writer-2.ts
      symbol: writer
---

Auth writer of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/writer.ts](../../../../../../src/identity/auth/writer.ts) | [src/identity/auth/queue.ts](../../../../../../src/identity/auth/queue.ts) | Calls queue | HTTP |
| [src/identity/auth/writer.ts](../../../../../../src/identity/auth/writer.ts) | [src/identity/auth/worker.ts](../../../../../../src/identity/auth/worker.ts) | Reads worker | HTTP |
