---
type: C4 Component
title: Ada source scanner
status: stable
tags:
  - scanning
groma:
  id: ada-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/ada/src/index.ts
    - scanner: typescript
      file: plugins/scanners/ada/src/declarations.ts
    - scanner: typescript
      file: plugins/scanners/ada/src/evidence.ts
      symbol: operationEvidence
    - scanner: typescript
      file: plugins/scanners/ada/src/syntax.ts
  technology: TypeScript, Tree-sitter, WebAssembly
description: Supplies Ada declarations, package units and bounded procedure-call evidence without GNAT or a project build.
---

The experimental Ada plugin reads selected .ads and .adb files with a parser it carries as WebAssembly. It lists declarations and package units, reports named subprogram bodies, expression functions and null procedures as operations, and keeps procedure-call evidence bounded.

Core owns architecture identity, component ownership, placement and relationships. Scanning needs no GNAT, Alire, GPRbuild, application dependencies or network connection.
