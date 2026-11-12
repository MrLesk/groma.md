---
type: C4 Component
title: UI themes
status: stable
groma:
  id: themes
  parent: cli
  code:
    - scanner: typescript
      file: src/themes/configured.ts
    - scanner: typescript
      file: src/themes/definition.ts
    - scanner: typescript
      file: src/themes/bundled.ts
    - scanner: typescript
      file: src/themes/management.ts
description: Defines, loads and manages the UI themes a project enables
---

Holds the theme definition and its validator, the bundled Light, Dark and Blueprint themes, and the loader for the themes config.json lists. Enables, removes and clones themes for the plugin commands.
