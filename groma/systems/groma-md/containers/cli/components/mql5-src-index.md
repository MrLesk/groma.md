---
type: C4 Component
title: MQL5 source scanner
status: stable
tags:
  - scanning
groma:
  id: mql5-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/mql5/src/index.ts
    - scanner: typescript
      file: plugins/scanners/mql5/src/declarations.ts
    - scanner: typescript
      file: plugins/scanners/mql5/src/evidence.ts
      symbol: evidence
    - scanner: typescript
      file: plugins/scanners/mql5/src/syntax.ts
    - scanner: typescript
      file: plugins/scanners/mql5/src/preprocessing.ts
  technology: TypeScript, Tree-sitter, WebAssembly
description: Supplies MQL5 declarations, Code outlines and unresolved call evidence without MetaTrader or a compiler.
---

The experimental MQL5 plugin reads selected .mq5, .mqh and .h files; only .mq5 signals discovery. Its packaged Tree-sitter parser runs locally as WebAssembly. It lists top-level functions, classes, structures, interfaces and enums; the preprocessing module reads macro definitions only to find source boundaries and never evaluates them.

Calls stay unresolved evidence. Core owns architecture identity, component ownership, placement and relationships. Scanning needs no MetaTrader, MetaEditor, compiler, project dependencies or network, and never runs trading code.
