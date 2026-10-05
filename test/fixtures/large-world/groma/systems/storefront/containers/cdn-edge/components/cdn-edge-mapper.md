---
type: C4 Component
title: Cdn Edge mapper
status: stable
groma:
  id: cdn-edge-mapper
  parent: cdn-edge
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/cdn-edge/mapper.ts
      symbol: mapper
---

Cdn Edge mapper of Cdn Edge.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/cdn-edge/mapper.ts](../../../../../../src/storefront/cdn-edge/mapper.ts) | [src/storefront/cdn-edge/reader.ts](../../../../../../src/storefront/cdn-edge/reader.ts) | Calls reader | HTTP |
| [src/storefront/cdn-edge/mapper.ts](../../../../../../src/storefront/cdn-edge/mapper.ts) | [src/storefront/cdn-edge/writer.ts](../../../../../../src/storefront/cdn-edge/writer.ts) | Reads writer | HTTP |
