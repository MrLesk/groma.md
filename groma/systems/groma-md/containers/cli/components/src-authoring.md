---
type: C4 Component
title: Architecture changes
status: stable
groma:
  id: src-authoring
  parent: cli
  code:
    - scanner: typescript
      file: src/authoring.ts
    - scanner: typescript
      file: src/add.ts
    - scanner: typescript
      file: src/edit.ts
    - scanner: typescript
      file: src/draft.ts
    - scanner: typescript
      file: src/accept.ts
    - scanner: typescript
      file: src/remove.ts
    - scanner: typescript
      file: src/removable.ts
    - scanner: typescript
      file: src/authoring-conflict.ts
  group: Architecture records
description: Validates and applies explicit architecture write commands
---

Applies add, edit, draft, accept, and remove actions through the shared write API. Checks each change before it writes the affected records. CLI edits replace requested fields on the current architecture. Web edits compare the original values of changed fields and report conflicts without saving part of the request. The filesystem layer protects the operation; field comparison and validation remain storage-independent.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/edit.ts](../../../../../../src/edit.ts) | [src/markdown-emitter.ts](../../../../../../src/markdown-emitter.ts) | Writes architecture records | Function call |
