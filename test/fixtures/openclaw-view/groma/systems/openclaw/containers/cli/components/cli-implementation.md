---
type: C4 Component
title: Implementation
status: stable
groma:
  id: cli-implementation
  parent: cli
  code:
    - scanner: typescript
      file: src/cli-implementation.ts
---

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/cli-implementation.ts](../../../../../../src/cli-implementation.ts) | [src/gateway-implementation.ts](../../../../../../src/gateway-implementation.ts) | Starts, inspects, and calls the control plane | openclaw gateway / Gateway WebSocket |
