---
type: C4 Component
title: Pricing mapper
status: stable
groma:
  id: pricing-mapper
  parent: pricing
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/pricing/mapper.ts
      symbol: mapper
---

Pricing mapper of Pricing.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/pricing/mapper.ts](../../../../../../src/catalog/pricing/mapper.ts) | [src/catalog/pricing/reader.ts](../../../../../../src/catalog/pricing/reader.ts) | Calls reader | HTTP |
| [src/catalog/pricing/mapper.ts](../../../../../../src/catalog/pricing/mapper.ts) | [src/catalog/pricing/writer.ts](../../../../../../src/catalog/pricing/writer.ts) | Reads writer | HTTP |
