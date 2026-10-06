---
type: C4 Component
title: Directory writer
status: stable
groma:
  id: directory-writer
  parent: directory
  group: Support
  code:
    - scanner: typescript
      file: src/identity/directory/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/identity/directory/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/identity/directory/writer-2.ts
      symbol: writer
---

Directory writer of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/writer.ts](../../../../../../src/identity/directory/writer.ts) | [src/identity/directory/queue.ts](../../../../../../src/identity/directory/queue.ts) | Calls queue | HTTP |
| [src/identity/directory/writer.ts](../../../../../../src/identity/directory/writer.ts) | [src/identity/directory/worker.ts](../../../../../../src/identity/directory/worker.ts) | Reads worker | HTTP |
