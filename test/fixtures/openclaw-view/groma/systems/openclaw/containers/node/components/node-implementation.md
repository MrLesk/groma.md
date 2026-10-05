---
type: C4 Component
title: Implementation
status: stable
groma:
  id: node-implementation
  parent: node
  code:
    - scanner: typescript
      file: src/node-implementation.ts
---

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/node-implementation.ts](../../../../../../src/node-implementation.ts) | [src/gateway-implementation.ts](../../../../../../src/gateway-implementation.ts) | Connects as a paired device and serves canvas, camera, and local exec | Gateway WebSocket |
