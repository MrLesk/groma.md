---
type: C4 Component
title: Scanner execution
status: stable
tags:
  - scanning
groma:
  id: scanner-registry
  parent: cli
  code:
    - scanner: typescript
      file: src/scanner/registry.ts
description: Loads selected scanner plugins and collects their results
---

Loads selected scanner plugins and collects their results. Keeps successful results when another scanner fails.
