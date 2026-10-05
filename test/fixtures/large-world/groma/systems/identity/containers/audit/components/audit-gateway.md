---
type: C4 Component
title: Audit gateway
status: stable
groma:
  id: audit-gateway
  parent: audit
  group: Core
  code:
    - scanner: typescript
      file: src/identity/audit/gateway.ts
      symbol: gateway
---

Audit gateway of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/gateway.ts](../../../../../../src/identity/audit/gateway.ts) | [src/identity/audit/router.ts](../../../../../../src/identity/audit/router.ts) | Calls router | HTTP |
| [src/identity/audit/gateway.ts](../../../../../../src/identity/audit/gateway.ts) | [src/identity/audit/session.ts](../../../../../../src/identity/audit/session.ts) | Reads session | HTTP |
| [src/identity/audit/gateway.ts](../../../../../../src/identity/audit/gateway.ts) | [src/storefront/web-app/gateway.ts](../../../../../../src/storefront/web-app/gateway.ts) | Forwards requests | HTTP |
