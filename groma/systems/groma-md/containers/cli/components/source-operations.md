---
type: C4 Component
title: TypeScript operations
status: stable
tags:
  - scanning
groma:
  id: source-operations
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/typescript/src/source-operations.ts
      symbol: sourceOperations
description: Reads TypeScript operations and their tokens for copy comparison
---

Reads TypeScript operations and their source positions. Supplies call evidence and tokens for the review of possible copies.
