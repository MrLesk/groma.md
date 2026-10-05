---
type: C4 Component
title: Talks
status: stable
groma:
  id: talks
  parent: pages
  code:
    - scanner: typescript
      file: src/talks.ts
---

Lists talks.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/talks.ts](../../../../../../src/talks.ts) | [src/sessions.ts](../../../../../../src/sessions.ts) | Loads sessions | HTTPS |
| [src/talks.ts](../../../../../../src/talks.ts) | [src/people.ts](../../../../../../src/people.ts) | Loads people | HTTPS |
