---
type: C4 Component
title: Stock page
status: stable
groma:
  id: stock-page
  parent: stock-viewer
  code:
    - scanner: typescript
      file: src/stock-page.ts
---

Draws the shelf counts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/stock-page.ts](../../../../../../src/stock-page.ts) | [src/pricing.ts](../../../../../../src/pricing.ts) | Reads the price list | In-process data |
