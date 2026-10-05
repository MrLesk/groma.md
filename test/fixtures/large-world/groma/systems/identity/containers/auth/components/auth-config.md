---
type: C4 Component
title: Auth config
status: stable
groma:
  id: auth-config
  parent: auth
  code:
    - scanner: typescript
      file: src/identity/auth/config.ts
      symbol: config
    - scanner: typescript
      file: src/identity/auth/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/identity/auth/config-2.ts
      symbol: config
---

Auth config of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/config.ts](../../../../../../src/identity/auth/config.ts) | [src/identity/auth/logger.ts](../../../../../../src/identity/auth/logger.ts) | Calls logger | HTTP |
| [src/identity/auth/config.ts](../../../../../../src/identity/auth/config.ts) | [src/identity/auth/client.ts](../../../../../../src/identity/auth/client.ts) | Reads client | HTTP |
