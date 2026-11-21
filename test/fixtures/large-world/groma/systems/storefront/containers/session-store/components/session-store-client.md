---
type: C4 Component
title: Session Store client
status: stable
groma:
  id: session-store-client
  parent: session-store
  code:
    - scanner: typescript
      file: src/storefront/session-store/client.ts
      symbol: client
    - scanner: typescript
      file: src/storefront/session-store/client-1.ts
      symbol: client
    - scanner: typescript
      file: src/storefront/session-store/client-2.ts
      symbol: client
    - scanner: typescript
      file: src/storefront/session-store/client-3.ts
      symbol: client
    - scanner: typescript
      file: src/storefront/session-store/client-4.ts
      symbol: client
---

Session Store client of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [Session Store client](session-store-client.md "session-store-client") | [Payments](../../../../../externals/payments.md "payments") | Charges cards | HTTP |
