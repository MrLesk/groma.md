---
type: C4 Component
title: Map grid
status: stable
tags:
  - map
groma:
  id: grid
  parent: export
  code:
    - scanner: typescript
      file: src/viewers/web/iso/grid.ts
description: Draws the graph-paper grid under the browser map
---

Paints a camera-aligned grid in the map viewport. The pattern stays on the ground plane as the view pans, zooms or switches projection.
