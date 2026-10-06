---
type: C4 Component
title: Auth logger
status: stable
groma:
  id: auth-logger
  parent: auth
  code:
    - scanner: typescript
      file: src/identity/auth/logger.ts
      symbol: logger
    - scanner: typescript
      file: src/identity/auth/logger-1.ts
      symbol: logger
    - scanner: typescript
      file: src/identity/auth/logger-2.ts
      symbol: logger
    - scanner: typescript
      file: src/identity/auth/logger-3.ts
      symbol: logger
---

Auth logger of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/logger.ts](../../../../../../src/identity/auth/logger.ts) | [src/identity/auth/client.ts](../../../../../../src/identity/auth/client.ts) | Calls client | HTTP |
