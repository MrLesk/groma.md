---
type: C4 Component
title: Media gateway
status: stable
groma:
  id: media-gateway
  parent: media
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/media/gateway.ts
      symbol: gateway
---

Media gateway of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/gateway.ts](../../../../../../src/catalog/media/gateway.ts) | [src/catalog/media/router.ts](../../../../../../src/catalog/media/router.ts) | Calls router | HTTP |
| [src/catalog/media/gateway.ts](../../../../../../src/catalog/media/gateway.ts) | [src/catalog/media/session.ts](../../../../../../src/catalog/media/session.ts) | Reads session | HTTP |
| [src/catalog/media/gateway.ts](../../../../../../src/catalog/media/gateway.ts) | [src/identity/accounts/gateway.ts](../../../../../../src/identity/accounts/gateway.ts) | Forwards requests | HTTP |
