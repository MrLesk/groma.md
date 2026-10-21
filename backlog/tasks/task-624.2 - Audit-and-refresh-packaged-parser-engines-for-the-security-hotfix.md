---
id: TASK-624.2
title: Audit and refresh packaged parser engines for the security hotfix
status: Done
assignee:
  - '@parser-engines'
created_date: '2026-10-21T10:53:00Z'
updated_date: '2026-10-21T17:52:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/scala/build.ts
  - plugins/scanners/kotlin/build.ts
  - plugins/scanners/jvm-package.ts
modified_files:
  - plugins/scanners/jvm-package.ts
  - plugins/scanners/java/build.ts
  - plugins/scanners/scala/build.ts
  - plugins/scanners/scala/worker/project/build.properties
  - plugins/scanners/scala/worker/project/plugins.sbt
  - plugins/scanners/scala/worker/build.sbt
  - plugins/scanners/kotlin/build.ts
  - plugins/scanners/scala/THIRD-PARTY-NOTICES.txt
  - plugins/scanners/kotlin/THIRD-PARTY-NOTICES.txt
  - docs/scanners/scala/index.md
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Scan.scala
  - test-bun/jvm-trust.test.ts
  - plugins/scanners/nasm/build.ts
  - plugins/scanners/cobol/build.ts
  - test-bun/java-scanner.test.ts
  - plugins/scanners/c/generate-parser.ts
  - plugins/scanners/cpp/generate-parser.ts
  - plugins/scanners/c/grammar/tree-sitter-c.wasm
  - plugins/scanners/cpp/grammar/tree-sitter-cpp.wasm
  - plugins/scanners/ada/assets/tree-sitter-ada.wasm
  - plugins/scanners/mojo/grammar/tree-sitter-mojo.wasm
  - plugins/scanners/mql5/assets/tree-sitter-mql5.wasm
  - docs/scanners/c/index.md
  - docs/scanners/cpp/index.md
  - plugins/scanners/ada/THIRD-PARTY-NOTICES.txt
  - plugins/scanners/mojo/grammar/README.md
  - plugins/scanners/mql5/assets/PROVENANCE.md
  - plugins/scanners/cobol/src/index.ts
  - plugins/scanners/cobol/THIRD-PARTY-NOTICES.txt
  - test-bun/cobol-scanner.test.ts
  - docs/scanners/cobol/index.md
parent_task_id: TASK-624
priority: high
type: chore
ordinal: 692000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The security hotfix requires checking the JVM and vendored parser build inputs, refreshing available stable releases, and rejecting modified executable downloads before scanner packaging.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 JVM, COBOL, NASM and vendored grammar versions are checked against upstream stable releases and upgrades or justified holds are recorded
- [x] #2 The Scala build verifies its pinned sbt launcher before execution
- [x] #3 Focused scanner build and regression checks pass or environment blockers are reported precisely
- [x] #4 Bundled JVM runtime dependencies have an OSV audit and confirmed vulnerable shipped libraries are patched or their blockers are reported precisely
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
