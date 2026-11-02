---
type: C4 Component
title: Mojo source scanner
status: stable
groma:
  id: mojo-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/mojo/src/index.ts
    - scanner: typescript
      file: plugins/scanners/mojo/src/parser.ts
    - scanner: typescript
      file: plugins/scanners/mojo/src/source.ts
  group: Language scanners
  technology: TypeScript, tree-sitter-mojo, WebAssembly
description: Supplies Mojo source inventory, Code outlines, named operations and unresolved call evidence without Mojo.
---

The experimental Mojo plugin is a syntax scanner, not a compiler. It reads selected .mojo and .🔥 files with tree-sitter-mojo and a small documented syntax patch, bundled with web-tree-sitter as WebAssembly.

Core owns architecture identity, component ownership, placement and relationships. Scanning needs no Mojo, Python, Pixi, compiler or project build, and never downloads or runs project code.
