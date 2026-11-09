---
type: C4 Component
title: Dart source scanner
status: stable
tags:
  - scanning
groma:
  id: dart-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/dart/src/index.ts
    - scanner: typescript
      file: plugins/scanners/dart/src/parts.ts
      symbol: sourceUnits
    - scanner: typescript
      file: plugins/scanners/dart/src/worker.ts
  group: Language scanners
  technology: TypeScript, Dart analyzer, native executable
description: Supplies Dart, Flutter and Serverpod declarations, Code outlines and bounded call evidence without a Dart SDK.
---

The experimental Dart plugin reads Dart source, including Flutter applications and Serverpod backends. The index passes the selected files to a bundled worker, the Dart analyzer compiled into a standalone executable, and returns source inventory, Code outlines, operations, unresolved calls and main entries. A library and its parts form one source unit only when both sides declare it.

Core owns architecture identity, component ownership, placement and relationships. Scanning needs no installed Dart or Flutter SDK, project dependencies, package download, pub get, build or code generation.
