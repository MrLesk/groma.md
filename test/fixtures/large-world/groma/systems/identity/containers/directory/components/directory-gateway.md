---
type: C4 Component
title: Directory gateway
status: stable
groma:
  id: directory-gateway
  parent: directory
  group: Core
  code:
    - scanner: typescript
      file: src/identity/directory/gateway.ts
      symbol: gateway
---

Directory gateway of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/gateway.ts](../../../../../../src/identity/directory/gateway.ts) | [src/identity/directory/router.ts](../../../../../../src/identity/directory/router.ts) | Calls router | HTTP |
| [src/identity/directory/gateway.ts](../../../../../../src/identity/directory/gateway.ts) | [src/identity/directory/session.ts](../../../../../../src/identity/directory/session.ts) | Reads session | HTTP |
| [src/identity/directory/gateway.ts](../../../../../../src/identity/directory/gateway.ts) | [src/identity/sessions/gateway.ts](../../../../../../src/identity/sessions/gateway.ts) | Forwards requests | HTTP |
