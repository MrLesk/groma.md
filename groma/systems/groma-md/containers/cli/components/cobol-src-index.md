---
type: C4 Component
title: COBOL source scanner
status: stable
groma:
  id: cobol-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/cobol/src/index.ts
  group: Language scanners
  technology: TypeScript, Java, Eclipse COBOL
description: Reads IBM fixed-format source with local data copybooks.
---

The scanner receives Groma’s selected source files and sends their contents to a bundled Eclipse COBOL worker. It returns the file inventory, program declarations, and CALL candidates with original source locations. Local COPY paths belong to scanner settings. Runtime calls remain uncertain, and core retains ownership of architecture boundaries and relationships.
