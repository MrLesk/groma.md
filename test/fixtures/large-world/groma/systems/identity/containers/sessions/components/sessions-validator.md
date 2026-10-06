---
type: C4 Component
title: Sessions validator
status: stable
groma:
  id: sessions-validator
  parent: sessions
  group: Core
  code:
    - scanner: typescript
      file: src/identity/sessions/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/sessions/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/sessions/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/sessions/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/sessions/validator-4.ts
      symbol: validator
---

Sessions validator of Sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/sessions/validator.ts](../../../../../../src/identity/sessions/validator.ts) | [src/identity/sessions/mapper.ts](../../../../../../src/identity/sessions/mapper.ts) | Calls mapper | HTTP |
| [src/identity/sessions/validator.ts](../../../../../../src/identity/sessions/validator.ts) | [src/identity/sessions/reader.ts](../../../../../../src/identity/sessions/reader.ts) | Reads reader | HTTP |
