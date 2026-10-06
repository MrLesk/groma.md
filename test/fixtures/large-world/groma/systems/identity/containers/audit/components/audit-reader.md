---
type: C4 Component
title: Audit reader
status: stable
groma:
  id: audit-reader
  parent: audit
  group: Support
  code:
    - scanner: typescript
      file: src/identity/audit/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/identity/audit/reader-1.ts
      symbol: reader
---

Audit reader of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/reader.ts](../../../../../../src/identity/audit/reader.ts) | [src/identity/audit/writer.ts](../../../../../../src/identity/audit/writer.ts) | Calls writer | HTTP |
| [src/identity/audit/reader.ts](../../../../../../src/identity/audit/reader.ts) | [src/identity/audit/queue.ts](../../../../../../src/identity/audit/queue.ts) | Reads queue | HTTP |
