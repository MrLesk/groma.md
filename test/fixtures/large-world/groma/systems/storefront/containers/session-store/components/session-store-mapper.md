---
type: C4 Component
title: Session Store mapper
status: stable
groma:
  id: session-store-mapper
  parent: session-store
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/session-store/mapper.ts
      symbol: mapper
---

Session Store mapper of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/mapper.ts](../../../../../../src/storefront/session-store/mapper.ts) | [src/storefront/session-store/reader.ts](../../../../../../src/storefront/session-store/reader.ts) | Calls reader | HTTP |
| [src/storefront/session-store/mapper.ts](../../../../../../src/storefront/session-store/mapper.ts) | [src/storefront/session-store/writer.ts](../../../../../../src/storefront/session-store/writer.ts) | Reads writer | HTTP |
