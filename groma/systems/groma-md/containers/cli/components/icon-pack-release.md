---
type: C4 Component
title: Official icon pack
status: stable
groma:
  id: icon-pack-release
  parent: cli
  code:
    - scanner: typescript
      file: plugins/icons/architecture/build.ts
      symbol: buildPackage
description: Stages the twelve generic architecture SVG icons for publication
---

Copies the official architecture icon package manifest, SVG artwork and licence into the shared release staging directory. The scanner release workflow carries the platform-independent package through assembly and npm publication.
