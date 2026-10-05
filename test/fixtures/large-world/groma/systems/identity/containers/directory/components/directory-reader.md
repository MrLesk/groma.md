---
type: C4 Component
title: Directory reader
status: stable
groma:
  id: directory-reader
  parent: directory
  group: Support
  code:
    - scanner: typescript
      file: src/identity/directory/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/identity/directory/reader-1.ts
      symbol: reader
---

Directory reader of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/reader.ts](../../../../../../src/identity/directory/reader.ts) | [src/identity/directory/writer.ts](../../../../../../src/identity/directory/writer.ts) | Calls writer | HTTP |
| [src/identity/directory/reader.ts](../../../../../../src/identity/directory/reader.ts) | [src/identity/directory/queue.ts](../../../../../../src/identity/directory/queue.ts) | Reads queue | HTTP |
