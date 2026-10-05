---
type: C4 Component
title: NASM source scanner
status: stable
groma:
  id: nasm-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/nasm/src/index.ts
    - scanner: typescript
      file: plugins/scanners/nasm/src/evidence.ts
    - scanner: typescript
      file: plugins/scanners/nasm/src/preprocess.ts
  group: Language scanners
  technology: TypeScript, NASM
description: Reads one NASM x86-64 assembly configuration.
---

The scanner copies the selected assembly sources into a temporary snapshot and preprocesses the configured entry with bundled NASM. It reads labels and direct calls while retaining physical source locations, including macro invocations. The same evidence supplies Code outlines using context from other source owners. Ordinary calls and includes do not choose architecture boundaries or relationships; those remain with core and human curation.
