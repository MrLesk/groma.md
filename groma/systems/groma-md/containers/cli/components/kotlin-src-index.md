---
type: C4 Component
title: Kotlin source scanner
status: stable
groma:
  id: kotlin-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/kotlin/src/index.ts
    - scanner: typescript
      file: plugins/scanners/kotlin/src/adapter.ts
  group: Language scanners
  technology: TypeScript, Kotlin, Kotlin compiler
description: Reads selected Kotlin declarations, outlines and uncertain call evidence.
---

Receives Groma's selected .kt paths and runs the bundled Kotlin worker with its bundled Java runtime. The worker parses original source with the Kotlin compiler's parser and reports declarations, operations and unresolved call sites, or rejects the observation when a selected file cannot be read or parsed. The same parser supplies Code outlines. Scanning never evaluates Gradle or Maven builds or needs project dependencies. Core and human curation own architecture boundaries and relationships.
