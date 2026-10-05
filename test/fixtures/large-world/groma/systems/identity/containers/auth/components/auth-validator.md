---
type: C4 Component
title: Auth validator
status: stable
groma:
  id: auth-validator
  parent: auth
  group: Core
  code:
    - scanner: typescript
      file: src/identity/auth/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/auth/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/auth/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/auth/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/auth/validator-4.ts
      symbol: validator
---

Auth validator of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/validator.ts](../../../../../../src/identity/auth/validator.ts) | [src/identity/auth/mapper.ts](../../../../../../src/identity/auth/mapper.ts) | Calls mapper | HTTP |
| [src/identity/auth/validator.ts](../../../../../../src/identity/auth/validator.ts) | [src/identity/auth/reader.ts](../../../../../../src/identity/auth/reader.ts) | Reads reader | HTTP |
