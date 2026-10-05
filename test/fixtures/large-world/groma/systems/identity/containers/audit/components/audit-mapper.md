---
type: C4 Component
title: Audit mapper
status: stable
groma:
  id: audit-mapper
  parent: audit
  group: Support
  code:
    - scanner: typescript
      file: src/identity/audit/mapper.ts
      symbol: mapper
---

Audit mapper of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/mapper.ts](../../../../../../src/identity/audit/mapper.ts) | [src/identity/audit/reader.ts](../../../../../../src/identity/audit/reader.ts) | Calls reader | HTTP |
| [src/identity/audit/mapper.ts](../../../../../../src/identity/audit/mapper.ts) | [src/identity/audit/writer.ts](../../../../../../src/identity/audit/writer.ts) | Reads writer | HTTP |
