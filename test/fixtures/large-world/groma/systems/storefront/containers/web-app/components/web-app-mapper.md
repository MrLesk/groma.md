---
type: C4 Component
title: Web App mapper
status: stable
groma:
  id: web-app-mapper
  parent: web-app
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/web-app/mapper.ts
      symbol: mapper
---

Web App mapper of Web App.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/web-app/mapper.ts](../../../../../../src/storefront/web-app/mapper.ts) | [src/storefront/web-app/reader.ts](../../../../../../src/storefront/web-app/reader.ts) | Calls reader | HTTP |
| [src/storefront/web-app/mapper.ts](../../../../../../src/storefront/web-app/mapper.ts) | [src/storefront/web-app/writer.ts](../../../../../../src/storefront/web-app/writer.ts) | Reads writer | HTTP |
