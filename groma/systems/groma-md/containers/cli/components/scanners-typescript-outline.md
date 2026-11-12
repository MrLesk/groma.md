---
type: C4 Component
title: Shared source outlines
status: stable
tags:
  - scanning
groma:
  id: scanners-typescript-outline
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/typescript-outline.ts
description: Reads TypeScript declarations for language and framework scanners
---

Reads declarations and visibility from TypeScript syntax trees. Supplies source outlines to the language and framework scanners.
