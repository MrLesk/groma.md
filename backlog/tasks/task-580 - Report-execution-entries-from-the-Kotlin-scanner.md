---
id: TASK-580
title: Report execution entries from the Kotlin scanner
status: Done
assignee:
  - '@claude'
created_date: '2026-10-13 08:32'
updated_date: '2026-10-13 12:47'
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
modified_files:
  - plugins/scanners/kotlin/worker/md/groma/scanner/Entries.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Scan.kt
  - plugins/scanners/kotlin/src/index.ts
  - plugins/scanners/kotlin/package.json
  - test/fixtures/kotlin-spring/pom.xml
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/Application.kt
  - test/fixtures/kotlin-spring/worker/build.gradle.kts
  - test/fixtures/kotlin-spring/worker/src/main/kotlin/jobs/Job.kt
  - test-bun/kotlin-scanner.test.ts
  - docs/scanners/kotlin/index.md
  - docs/scanners/evidence.md
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
- [x] #1 A Kotlin file with a top-level main function is reported as an execution entry whose name, declaration and member files follow the entryPoints contract in docs/scanners/evidence.md
- [x] #2 The entry's files are the selected .kt files of its own Maven or Gradle build unit, found without evaluating the build, and exclude the files of separately declared units
- [x] #3 Scanning the supported example, a single-module Maven Spring Boot project in Kotlin, places its Kotlin components in one backend container instead of directly under the system
- [x] #4 A Kotlin project with no main function reports no execution entry and its components stay under the system as before
- [x] #5 docs/scanners/kotlin/index.md states what is reported as an entry, how its unit is found, and what is not read
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Select build declarations: add **/pom.xml, **/build.gradle and **/build.gradle.kts to the package include list. They are never parsed or listed as source; their paths only mark where a build unit lives.
2. src/index.ts passes every selected path to the worker; Scan.kt parses the .kt paths and hands the rest to the new Entries.kt.
3. Entries.kt: a file with a top-level main (no receiver; no parameter, Array<String> or vararg String) is an entry named after its file. Its unit is the nearest directory above it holding a build declaration; its files are the selected .kt files with that same nearest directory. A main under no build declaration reports no entry, because nothing bounds its unit.
4. Document entries, unit rule and limits in docs/scanners/kotlin/index.md and the producer table in docs/scanners/evidence.md.
5. Test (rule: AC #1, #2, #4 and the entryPoints contract in docs/scanners/evidence.md). Wrong results detected: a main reported with another unit's files, or with no entry; an entry invented for a project without main. Gap: no Kotlin entry coverage exists. Smallest test: one new fixture test/fixtures/kotlin-spring with a pom.xml unit and a nested Gradle unit, asserted in test-bun/kotlin-scanner.test.ts; the existing kotlin-source scan asserts no entry.
6. Verify AC #3 by scanning a scratch single-module Maven Spring Boot project with bun src/cli.ts scan and reading the written container.
7. bun run check.

8. Review fixes for PR 136, requested by the user on 2026-10-13. (a) A private main or one with type parameters is not the function the JVM starts and reports no entry. (b) A main under no selected build declaration reports the warning kotlin-main-without-build-declaration on its file, so a project whose include list selects no build declaration learns why it has no container; no include list is migrated. (c) Document two limits that follow from the entryPoints contract rather than from the scanner: several mains in one unit share its files, which core leaves under the system, and a library module with its own build declaration is a separate unit. (d) Tests (rule: AC 1 and the diagnostics contract in docs/scanners/creating-a-plugin.md). Wrong results detected: an entry for a private main, silence for a main without a unit. Gap: neither case is covered. Smallest test: one private main file in the fixture's nested unit and one assertion on the existing kotlin-source scan of a main-less project plus a main scanned without its pom.xml.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: unit membership uses only the paths of pom.xml, build.gradle and build.gradle.kts; no build file is opened. A main under no build declaration reports no entry, because a one-file container would misplace the rest of the application. Only a top-level main is an entry; object and companion mains are documented as not reported.
Verification: test-bun/kotlin-scanner.test.ts scans test/fixtures/kotlin-spring and expects exactly one entry, Application, with the two files of the Maven unit and without the file of the nested Gradle unit, which has no main and no entry (AC 1, 2, 4). A scratch single-module Maven Spring Boot project scanned with bun src/cli.ts scan wrote container shop-application holding the three Kotlin components (AC 3). bun run check: 774 pass, 6 fail; the 6 failures are the Swift scanner tests, which need a Swift toolchain this machine lacks and fail the same way on main.

Review fixes for PR 136 (2026-10-13). Decisions: a private main or one with type parameters reports no entry. A main under no selected build declaration reports the warning kotlin-main-without-build-declaration, which also tells a project with an older include list why it has no container; include lists are not migrated. Left as documented limits because they follow from the entryPoints contract and core's rule, not from the scanner: several mains in one unit share its files, which core leaves under the system, and a library module with its own build declaration is a separate unit that joins no entry. The fixture test expects no entry for a private main and the warning for a main scanned without its pom.xml. Verification: test-bun/kotlin-scanner.test.ts passes on JDK 21 and 25. bun run check: 769 pass, 11 fail on JDK 21; the 5 Java scanner failures are 'release version 25 not supported' and pass on JDK 25, and the 6 Swift failures need a Swift toolchain this machine lacks, as on main.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Kotlin scanner reports a file with a top-level main as an execution entry with the selected .kt files of the nearest Maven or Gradle build declaration above it, so core places a Kotlin backend in its own container. Build declarations are selected for their paths only and never read. Verified by the kotlin-spring fixture test and a scratch Spring Boot scan that produced the container.
<!-- SECTION:FINAL_SUMMARY:END -->
