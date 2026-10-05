---
type: C4 Component
title: Sessions writer
status: stable
groma:
  id: sessions-writer
  parent: sessions
  group: Support
  code:
    - scanner: typescript
      file: src/identity/sessions/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/identity/sessions/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/identity/sessions/writer-2.ts
      symbol: writer
---

Sessions writer of Sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/sessions/writer.ts](../../../../../../src/identity/sessions/writer.ts) | [src/identity/sessions/queue.ts](../../../../../../src/identity/sessions/queue.ts) | Calls queue | HTTP |
| [src/identity/sessions/writer.ts](../../../../../../src/identity/sessions/writer.ts) | [src/identity/sessions/worker.ts](../../../../../../src/identity/sessions/worker.ts) | Reads worker | HTTP |
