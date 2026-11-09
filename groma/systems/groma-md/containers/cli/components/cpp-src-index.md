---
type: C4 Component
title: C++ source scanner
status: stable
tags:
  - scanning
groma:
  id: cpp-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/cpp/src/index.ts
    - scanner: typescript
      file: plugins/scanners/cpp/src/declarations.ts
    - scanner: typescript
      file: plugins/scanners/cpp/src/macros.ts
    - scanner: typescript
      file: plugins/scanners/cpp/src/syntax.ts
    - scanner: typescript
      file: plugins/scanners/cpp/src/outline.ts
  group: Language scanners
  technology: TypeScript, tree-sitter-cpp, WebAssembly
description: Supplies C++ declarations, Code outlines and unresolved call evidence without a compiler or build system.
---

The experimental C++ plugin reads selected C++ sources and headers with the Tree-sitter C++ grammar plus local syntax rules, bundled with web-tree-sitter as WebAssembly. The index coordinates parsing, macros and declarations; the outline module lists a file's members only where the selected source proves them.

Calls stay unresolved evidence. Core owns architecture identity, component ownership, placement and relationships. Scanning needs no Clang, GCC, MSVC, CMake, project dependencies or network connection.
