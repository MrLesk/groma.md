---
type: C4 Component
title: Directory mapper
status: stable
groma:
  id: directory-mapper
  parent: directory
  group: Support
  code:
    - scanner: typescript
      file: src/identity/directory/mapper.ts
      symbol: mapper
---

Directory mapper of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/mapper.ts](../../../../../../src/identity/directory/mapper.ts) | [src/identity/directory/reader.ts](../../../../../../src/identity/directory/reader.ts) | Calls reader | HTTP |
| [src/identity/directory/mapper.ts](../../../../../../src/identity/directory/mapper.ts) | [src/identity/directory/writer.ts](../../../../../../src/identity/directory/writer.ts) | Reads writer | HTTP |
