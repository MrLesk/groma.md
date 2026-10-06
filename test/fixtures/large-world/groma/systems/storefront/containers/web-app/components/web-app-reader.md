---
type: C4 Component
title: Web App reader
status: stable
groma:
  id: web-app-reader
  parent: web-app
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/web-app/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/storefront/web-app/reader-1.ts
      symbol: reader
---

Web App reader of Web App.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/web-app/reader.ts](../../../../../../src/storefront/web-app/reader.ts) | [src/storefront/web-app/writer.ts](../../../../../../src/storefront/web-app/writer.ts) | Calls writer | HTTP |
| [src/storefront/web-app/reader.ts](../../../../../../src/storefront/web-app/reader.ts) | [src/storefront/web-app/queue.ts](../../../../../../src/storefront/web-app/queue.ts) | Reads queue | HTTP |
