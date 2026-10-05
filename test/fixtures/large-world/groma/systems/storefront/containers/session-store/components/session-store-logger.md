---
type: C4 Component
title: Session Store logger
status: stable
groma:
  id: session-store-logger
  parent: session-store
  code:
    - scanner: typescript
      file: src/storefront/session-store/logger.ts
      symbol: logger
    - scanner: typescript
      file: src/storefront/session-store/logger-1.ts
      symbol: logger
    - scanner: typescript
      file: src/storefront/session-store/logger-2.ts
      symbol: logger
    - scanner: typescript
      file: src/storefront/session-store/logger-3.ts
      symbol: logger
---

Session Store logger of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/logger.ts](../../../../../../src/storefront/session-store/logger.ts) | [src/storefront/session-store/client.ts](../../../../../../src/storefront/session-store/client.ts) | Calls client | HTTP |
