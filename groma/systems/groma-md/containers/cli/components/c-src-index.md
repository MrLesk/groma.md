---
type: C4 Component
title: C source scanner
status: stable
tags:
  - scanning
groma:
  id: c-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/c/src/index.ts
    - scanner: typescript
      file: plugins/scanners/c/src/macros.ts
    - scanner: typescript
      file: plugins/scanners/c/src/parser.ts
    - scanner: typescript
      file: plugins/scanners/c/src/source.ts
  technology: TypeScript, tree-sitter-c, WebAssembly
description: Supplies C declarations, Code outlines and unresolved call evidence without a compiler or project build.
---

The experimental C plugin reads the selected .c and .h files with the official Tree-sitter C grammar and a small extension for macro syntax, bundled as WebAssembly. The index coordinates parsing, macro reading and the shared scanner observation; macros are read only to find boundaries, never expanded.

Calls stay unresolved evidence. Core owns architecture identity, component ownership, placement and relationships. Scanning needs no C compiler, system headers, build tools, project dependencies or network access.
