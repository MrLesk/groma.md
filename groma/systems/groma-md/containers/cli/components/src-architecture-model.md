---
type: C4 Component
title: Architecture model
status: stable
groma:
  id: src-architecture-model
  parent: cli
  code:
    - scanner: typescript
      file: src/architecture-model.ts
    - scanner: typescript
      file: src/okf-profile.ts
    - scanner: typescript
      file: src/code-reference.ts
      symbol: codeReferencesOf
    - scanner: typescript
      file: src/types.ts
    - scanner: typescript
      file: src/architecture-path.ts
    - scanner: typescript
      file: src/naming.ts
    - scanner: typescript
      file: src/source-index.ts
      symbol: sourceIndex
    - scanner: typescript
      file: src/element-appearance.ts
  group: Architecture records
description: Builds the in-memory C4 model from stored Markdown records
---

Checks element identity, status, and C4 parent rules. Builds the shared architecture model from stored records. Owns the derived source index for each loaded elements snapshot: exact element IDs and repository-relative source files resolve to their current owners. Repeated lookups reuse it; replacement snapshots build their own index. Filesystem reads and watch updates remain in the delivery code.
