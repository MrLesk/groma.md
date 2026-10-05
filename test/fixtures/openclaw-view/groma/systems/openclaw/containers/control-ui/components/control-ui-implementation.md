---
type: C4 Component
title: Implementation
status: stable
groma:
  id: control-ui-implementation
  parent: control-ui
  code:
    - scanner: typescript
      file: src/control-ui-implementation.ts
---

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/control-ui-implementation.ts](../../../../../../src/control-ui-implementation.ts) | [src/gateway-implementation.ts](../../../../../../src/gateway-implementation.ts) | Chats, reads status, and patches config | Gateway WebSocket |
