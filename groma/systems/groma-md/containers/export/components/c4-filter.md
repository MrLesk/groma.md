---
type: C4 Component
title: Map filters
status: stable
groma:
  id: c4-filter
  parent: export
  code:
    - scanner: typescript
      file: src/viewers/web/chrome/c4-filter.ts
  group: Browser controls
description: Shows or hides element kinds and relationships on the browser map
---

Owns the map visibility filters. Restores the selected element kinds and relationship visibility from the browser session, then applies the same choices to buttons and every projected scene. Filtering preserves layout, camera, selection, and stored architecture; showing relationships restores only routes whose endpoints are visible.
