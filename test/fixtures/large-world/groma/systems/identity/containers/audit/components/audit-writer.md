---
type: C4 Component
title: Audit writer
status: stable
groma:
  id: audit-writer
  parent: audit
  group: Support
  code:
    - scanner: typescript
      file: src/identity/audit/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/identity/audit/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/identity/audit/writer-2.ts
      symbol: writer
---

Audit writer of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/writer.ts](../../../../../../src/identity/audit/writer.ts) | [src/identity/audit/queue.ts](../../../../../../src/identity/audit/queue.ts) | Calls queue | HTTP |
| [src/identity/audit/writer.ts](../../../../../../src/identity/audit/writer.ts) | [src/identity/audit/worker.ts](../../../../../../src/identity/audit/worker.ts) | Reads worker | HTTP |
