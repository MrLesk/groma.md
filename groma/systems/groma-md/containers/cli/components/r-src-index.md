---
type: C4 Component
title: R source scanner
status: stable
groma:
  id: r-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/r/src/index.ts
  group: Language scanners
  technology: TypeScript, R, tree-sitter
description: Reads selected R source and returns direct named functions and outlines.
---

Receives selected UTF-8 R source and DESCRIPTION metadata. Groups source under its nearest package declaration, parses direct top-level named function assignments with the bundled tree-sitter grammar, and returns inventory or source outlines without executing R or installing project dependencies. Each scan and outline owns its parser and releases its syntax trees. Package exports, dynamic binding, class dispatch, calls and runtime boundaries remain unverified. Core and human curation own architecture placement and relationships.
