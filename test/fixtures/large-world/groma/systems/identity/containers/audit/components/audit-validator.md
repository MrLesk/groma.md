---
type: C4 Component
title: Audit validator
status: stable
groma:
  id: audit-validator
  parent: audit
  group: Core
  code:
    - scanner: typescript
      file: src/identity/audit/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/audit/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/audit/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/audit/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/audit/validator-4.ts
      symbol: validator
---

Audit validator of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/validator.ts](../../../../../../src/identity/audit/validator.ts) | [src/identity/audit/mapper.ts](../../../../../../src/identity/audit/mapper.ts) | Calls mapper | HTTP |
| [src/identity/audit/validator.ts](../../../../../../src/identity/audit/validator.ts) | [src/identity/audit/reader.ts](../../../../../../src/identity/audit/reader.ts) | Reads reader | HTTP |
