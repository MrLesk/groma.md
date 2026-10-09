---
type: C4 Component
title: Revision selector
status: stable
groma:
  id: revision-control
  parent: export
  code:
    - scanner: typescript
      file: src/viewers/web/revision/control.ts
      symbol: createRevisionControl
    - scanner: typescript
      file: src/viewers/web/revision/view.ts
    - scanner: typescript
      file: src/viewers/web/revision/playback.ts
      symbol: createRevisionPlayback
  group: Architecture panels
description: Browses, compares and plays readable Git architecture revisions
---

Owns the selected revision or comparison and the commit search fields. Plays a selected commit range in Git order with speed and Stop controls, shows the current commit, preloads upcoming frames, and finishes on the full-range comparison. The browser keeps the selected range in its URL and uses the existing map motion for each step.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/viewers/web/revision/control.ts](../../../../../../src/viewers/web/revision/control.ts) | [src/viewers/web/data.ts](../../../../../../src/viewers/web/data.ts) | Loads past revisions | Function call |
