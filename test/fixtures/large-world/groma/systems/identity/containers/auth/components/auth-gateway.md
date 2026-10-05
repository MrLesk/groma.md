---
type: C4 Component
title: Auth gateway
status: stable
groma:
  id: auth-gateway
  parent: auth
  group: Core
  code:
    - scanner: typescript
      file: src/identity/auth/gateway.ts
      symbol: gateway
---

Auth gateway of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/gateway.ts](../../../../../../src/identity/auth/gateway.ts) | [src/identity/auth/router.ts](../../../../../../src/identity/auth/router.ts) | Calls router | HTTP |
| [src/identity/auth/gateway.ts](../../../../../../src/identity/auth/gateway.ts) | [src/identity/auth/session.ts](../../../../../../src/identity/auth/session.ts) | Reads session | HTTP |
| [src/identity/auth/gateway.ts](../../../../../../src/identity/auth/gateway.ts) | [src/identity/directory/gateway.ts](../../../../../../src/identity/directory/gateway.ts) | Forwards requests | HTTP |
