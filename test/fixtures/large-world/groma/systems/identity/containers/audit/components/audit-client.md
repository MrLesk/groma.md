---
type: C4 Component
title: Audit client
status: stable
groma:
  id: audit-client
  parent: audit
  code:
    - scanner: typescript
      file: src/identity/audit/client.ts
      symbol: client
    - scanner: typescript
      file: src/identity/audit/client-1.ts
      symbol: client
    - scanner: typescript
      file: src/identity/audit/client-2.ts
      symbol: client
    - scanner: typescript
      file: src/identity/audit/client-3.ts
      symbol: client
    - scanner: typescript
      file: src/identity/audit/client-4.ts
      symbol: client
---

Audit client of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [Audit client](audit-client.md "audit-client") | [Payments](../../../../../externals/payments.md "payments") | Charges cards | HTTP |
