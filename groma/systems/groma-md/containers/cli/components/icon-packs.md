---
type: C4 Component
title: Icon packs
status: stable
groma:
  id: icon-packs
  parent: cli
  code:
    - scanner: typescript
      file: src/icon-packs.ts
description: Loads selected SVG icon packs and resolves element icons for maps and lint
---

Reads the icon packs selected in plugins.json through the shared package resolver. Resolves qualified or unqualified names to embedded SVG images, converts emoji to SVG artwork for export, reports unresolved names to lint, and supplies pack inventory and restoration to plugin management. Element metadata remains in ordinary architecture Markdown; image data exists only in the loaded view.
