---
type: C4 Component
title: Architecture relationships
status: stable
groma:
  id: relationship-markdown
  parent: cli
  code:
    - scanner: typescript
      file: src/relationship-markdown.ts
      symbol: storedConnections
    - scanner: typescript
      file: src/source-relationships.ts
      symbol: sourceRelationships
    - scanner: typescript
      file: src/relation.ts
    - scanner: typescript
      file: src/relationship-storage.ts
  group: Architecture records
description: Stores directed interactions and resolves them to component owners
---

Reads and writes directed interactions. Resolves exact source files to their component owners for display on the map.
