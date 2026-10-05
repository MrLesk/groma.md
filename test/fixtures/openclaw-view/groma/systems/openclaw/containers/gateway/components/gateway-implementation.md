---
type: C4 Component
title: Implementation
status: stable
groma:
  id: gateway-implementation
  parent: gateway
  code:
    - scanner: typescript
      file: src/gateway-implementation.ts
---

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/gateway-implementation.ts](../../../../../../src/gateway-implementation.ts) | [src/channels-implementation.ts](../../../../../../src/channels-implementation.ts) | Maintains linked chat sessions and routes inbound messages and replies | In-process channel connections |
| [src/gateway-implementation.ts](../../../../../../src/gateway-implementation.ts) | [src/agent-runtime-implementation.ts](../../../../../../src/agent-runtime-implementation.ts) | Starts an assistant turn and streams agent events | Gateway agent RPC |
