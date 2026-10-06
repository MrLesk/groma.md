---
type: C4 Component
title: Import gateway
status: stable
groma:
  id: import-gateway
  parent: import
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/import/gateway.ts
      symbol: gateway
---

Import gateway of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/gateway.ts](../../../../../../src/catalog/import/gateway.ts) | [src/catalog/import/router.ts](../../../../../../src/catalog/import/router.ts) | Calls router | HTTP |
| [src/catalog/import/gateway.ts](../../../../../../src/catalog/import/gateway.ts) | [src/catalog/import/session.ts](../../../../../../src/catalog/import/session.ts) | Reads session | HTTP |
| [src/catalog/import/gateway.ts](../../../../../../src/catalog/import/gateway.ts) | [src/catalog/media/gateway.ts](../../../../../../src/catalog/media/gateway.ts) | Forwards requests | HTTP |
