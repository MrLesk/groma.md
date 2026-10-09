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

Reads and writes directed interactions. Planned internal relationships may name architecture concepts before source exists, while current code interactions name exact source files. Editing and removal preserve planned concept links. Explicit acceptance transfers planned text only to one existing current file pair between the same component owners; missing or ambiguous evidence leaves the plan unchanged. Source ownership projects each stored claim onto its current component pair for the map.
