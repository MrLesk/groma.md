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
    - scanner: typescript
      file: plugins/icons/architecture/build.ts
      symbol: buildPackage
description: Loads selected SVG icon packs and resolves element icons for maps and lint
---

Reads the icon packs selected in plugins.json through the shared package resolver and reports what this computer has of each. Resolves qualified or unqualified names to embedded SVG images, leaves an emoji as text for each viewer to draw, and reports unresolved names to lint. Plugin management adds, updates, removes and restores packs like every other plugin kind. Element metadata remains in ordinary architecture Markdown; image data exists only in the loaded view. The build script of the official architecture pack copies its manifest, SVG artwork and licence into the release staging directory.
