---
type: C4 Component
title: Media client
status: stable
groma:
  id: media-client
  parent: media
  code:
    - scanner: typescript
      file: src/catalog/media/client.ts
      symbol: client
    - scanner: typescript
      file: src/catalog/media/client-1.ts
      symbol: client
    - scanner: typescript
      file: src/catalog/media/client-2.ts
      symbol: client
    - scanner: typescript
      file: src/catalog/media/client-3.ts
      symbol: client
    - scanner: typescript
      file: src/catalog/media/client-4.ts
      symbol: client
---

Media client of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [media-client](media-client.md) | [payments](../../../../../externals/payments.md) | Charges cards | HTTP |
