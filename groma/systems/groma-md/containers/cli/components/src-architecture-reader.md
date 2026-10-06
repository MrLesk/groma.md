---
type: C4 Component
title: Markdown storage
status: stable
groma:
  id: src-architecture-reader
  parent: cli
  code:
    - scanner: typescript
      file: src/architecture-reader.ts
    - scanner: typescript
      file: src/architecture-markdown.ts
    - scanner: typescript
      file: src/markdown-emitter.ts
    - scanner: typescript
      file: src/groma-filesystem.ts
  group: Architecture records
description: Reads and writes architecture Markdown in the project Groma folder
---

Reads and writes architecture records in the selected Groma folder. Keeps source links and authored sections in ordinary Markdown. The filesystem layer protects complete local read and write operations with one project lock and a bounded wait. It replaces each document atomically, and architecture readers wait for structural changes to finish. Storage mechanics stay here; authoring owns validation and conflict meaning.
