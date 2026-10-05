---
type: C4 Component
title: Directory validator
status: stable
groma:
  id: directory-validator
  parent: directory
  group: Core
  code:
    - scanner: typescript
      file: src/identity/directory/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/directory/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/directory/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/directory/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/directory/validator-4.ts
      symbol: validator
---

Directory validator of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/validator.ts](../../../../../../src/identity/directory/validator.ts) | [src/identity/directory/mapper.ts](../../../../../../src/identity/directory/mapper.ts) | Calls mapper | HTTP |
| [src/identity/directory/validator.ts](../../../../../../src/identity/directory/validator.ts) | [src/identity/directory/reader.ts](../../../../../../src/identity/directory/reader.ts) | Reads reader | HTTP |
