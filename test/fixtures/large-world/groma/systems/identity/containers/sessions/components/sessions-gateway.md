---
type: C4 Component
title: Sessions gateway
status: stable
groma:
  id: sessions-gateway
  parent: sessions
  group: Core
  code:
    - scanner: typescript
      file: src/identity/sessions/gateway.ts
      symbol: gateway
---

Sessions gateway of Sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/sessions/gateway.ts](../../../../../../src/identity/sessions/gateway.ts) | [src/identity/sessions/router.ts](../../../../../../src/identity/sessions/router.ts) | Calls router | HTTP |
| [src/identity/sessions/gateway.ts](../../../../../../src/identity/sessions/gateway.ts) | [src/identity/sessions/session.ts](../../../../../../src/identity/sessions/session.ts) | Reads session | HTTP |
| [src/identity/sessions/gateway.ts](../../../../../../src/identity/sessions/gateway.ts) | [src/identity/audit/gateway.ts](../../../../../../src/identity/audit/gateway.ts) | Forwards requests | HTTP |
