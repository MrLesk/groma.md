---
type: C4 Component
title: Scala source scanner
status: stable
groma:
  id: scala-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/scala/src/index.ts
    - scanner: typescript
      file: plugins/scanners/scala/src/adapter.ts
  group: Language scanners
  technology: TypeScript, Scala, Scalameta
description: Reads selected Scala 3 declarations, outlines and uncertain call evidence.
---

Receives Groma's selected .scala paths and runs the bundled Scalameta worker with its bundled Java runtime. The worker parses original source and reports declarations, operations and unresolved call sites, or rejects the observation when a selected file cannot be read or parsed. The same parser supplies Code outlines. Scanning never evaluates sbt builds or needs project dependencies. Core and human curation own architecture boundaries and relationships.
