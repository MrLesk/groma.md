---
type: C4 Component
title: Session Store config
status: stable
groma:
  id: session-store-config
  parent: session-store
  code:
    - scanner: typescript
      file: src/storefront/session-store/config.ts
      symbol: config
    - scanner: typescript
      file: src/storefront/session-store/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/storefront/session-store/config-2.ts
      symbol: config
---

Session Store config of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/config.ts](../../../../../../src/storefront/session-store/config.ts) | [src/storefront/session-store/logger.ts](../../../../../../src/storefront/session-store/logger.ts) | Calls logger | HTTP |
| [src/storefront/session-store/config.ts](../../../../../../src/storefront/session-store/config.ts) | [src/storefront/session-store/client.ts](../../../../../../src/storefront/session-store/client.ts) | Reads client | HTTP |
