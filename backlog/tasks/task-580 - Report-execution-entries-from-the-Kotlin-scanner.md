---
id: TASK-580
title: Report execution entries from the Kotlin scanner
status: To Do
assignee: []
created_date: '2026-10-13 08:32'
labels: []
dependencies: []
references:
  - kotlin-src-index
  - plugins/scanners/kotlin/worker/md/groma/scanner/Scan.kt
documentation:
  - docs/scanners/evidence.md
  - docs/scanners/kotlin/index.md
  - docs/scanners/java/index.md
  - docs/scanners/creating-a-plugin.md
type: feature
ordinal: 656000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On a real Maven Spring Boot project in Kotlin, every scanned Kotlin component sits directly under the system and the map shows no backend container. Core creates a C4 container only from an execution entry (`entryPoints`): the file that starts a program, with the analyzed files of its own build unit. Roots, directories, packages and Maven modules alone cannot establish one. The Kotlin scanner reports no execution entries, so core has nothing to place the backend with.

The scanner parses syntax only and must stay that way: no build evaluation, no classpath, no installed tools. The Java scanner already reads a `pom.xml` or Gradle script as a declaration of where a build unit lives without running the build, and reports `main` signatures as entries; that is the precedent for the unit boundary.

In C4 the result is one container for the running application. Spring Modulith modules inside that application are not containers and are out of scope here; grouping them stays authored curation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A Kotlin file with a top-level main function is reported as an execution entry whose name, declaration and member files follow the entryPoints contract in docs/scanners/evidence.md
- [ ] #2 The entry's files are the selected .kt files of its own Maven or Gradle build unit, found without evaluating the build, and exclude the files of separately declared units
- [ ] #3 Scanning the supported example, a single-module Maven Spring Boot project in Kotlin, places its Kotlin components in one backend container instead of directly under the system
- [ ] #4 A Kotlin project with no main function reports no execution entry and its components stay under the system as before
- [ ] #5 docs/scanners/kotlin/index.md states what is reported as an entry, how its unit is found, and what is not read
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
