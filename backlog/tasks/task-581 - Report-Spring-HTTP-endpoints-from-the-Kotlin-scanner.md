---
id: TASK-581
title: Report Kotlin backend entries and Spring HTTP endpoints
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 08:33'
updated_date: '2026-10-19T15:55:00Z'
labels: []
dependencies: []
references:
  - docs/scanners/evidence.md
  - docs/scanners/kotlin/index.md
  - plugins/scanners/kotlin/package.json
  - plugins/scanners/kotlin/src/index.ts
  - plugins/scanners/kotlin/worker/md/groma/scanner/Endpoints.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Entries.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Scan.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Types.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Visibility.kt
  - test-bun/kotlin-scanner.test.ts
  - test/fixtures/kotlin-spring/pom.xml
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/Application.kt
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/InvoiceApi.kt
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/InvoiceController.kt
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/OrderController.kt
  - test/fixtures/kotlin-spring/worker/build.gradle.kts
  - test/fixtures/kotlin-spring/worker/src/main/kotlin/jobs/Job.kt
documentation:
  - docs/scanners/evidence.md
  - docs/relationship-inference.md
  - docs/scanners/kotlin/index.md
  - docs/scanners/java/index.md
modified_files:
  - docs/scanners/evidence.md
  - docs/scanners/kotlin/index.md
  - plugins/scanners/kotlin/package.json
  - plugins/scanners/kotlin/src/index.ts
  - plugins/scanners/kotlin/worker/md/groma/scanner/Endpoints.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Entries.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Scan.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Types.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Visibility.kt
  - test-bun/kotlin-scanner.test.ts
  - test/fixtures/kotlin-spring/pom.xml
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/Application.kt
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/InvoiceApi.kt
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/InvoiceController.kt
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/OrderController.kt
  - test/fixtures/kotlin-spring/worker/build.gradle.kts
  - test/fixtures/kotlin-spring/worker/src/main/kotlin/jobs/Job.kt
  - >-
    backlog/tasks/task-581 -
    Report-Spring-HTTP-endpoints-from-the-Kotlin-scanner.md
  - backlog/tasks/task-580 - Report-execution-entries-from-the-Kotlin-scanner.md
  - bun.lock
type: feature
ordinal: 657000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On a real Maven Spring Boot project in Kotlin, every scanned Kotlin component sits directly under the system and the map shows no backend container. Core creates a C4 container only from an execution entry (`entryPoints`): the file that starts a program, with the analyzed files of its own build unit. Roots, directories, packages and Maven modules alone cannot establish one. The Kotlin scanner reports no execution entries, so core has nothing to place the backend with.

The scanner parses syntax only and must stay that way: no build evaluation, no classpath, no installed tools. The Java scanner already reads a `pom.xml` or Gradle script as a declaration of where a build unit lives without running the build, and reports `main` signatures as entries; that is the precedent for the unit boundary.

In C4 the result is one container for the running application. Spring Modulith modules inside that application are not containers and are out of scope here; grouping them stays authored curation.

On a real project with a web frontend and a Spring backend in Kotlin, the map shows no relationship between the two. Core derives a relationship from a frontend HTTP request only when a scanner reports the matching endpoint (`httpEndpoints`). The Kotlin scanner supplies no HTTP facts, so every request to the Kotlin backend stays unmatched.

Resolving Kotlin calls would not help: core derives relationships from HTTP facts and supplied named callbacks, not from ordinary calls, and resolution would need a classpath the scanner deliberately does not have. Endpoints are the smallest evidence that puts frontend-to-backend relationships on the map.

The scanner parses syntax only. An endpoint may therefore be reported only where the source text proves it: an annotated controller whose route is literal text. A route the scanner cannot read must not be guessed. The Java scanner reports the same Spring constructs with compiler resolution; its documented rules are the reference for meaning, not a requirement to match its coverage.

In OKF the result is ordinary relationship rows in Markdown; in C4 it is a relationship between existing elements. The scanner adds no new architecture kind or metadata.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A Spring MVC or WebFlux annotated controller in Kotlin reports one HTTP endpoint per mapped function, with its method and its path joined from the class-level and function-level mappings, linked to that function's operation
- [x] #2 Path parameters and literal segments are reported as the HTTP facts contract in docs/scanners/evidence.md defines them
- [x] #3 A mapping whose path or method is not literal text in the source reports the blocker the producer checklist in docs/scanners/evidence.md asks for: its readable literal prefix followed by a constrained optional catch-all, with method * when the method is unreadable, and the documentation says so
- [x] #4 Scanning the supported example, a frontend whose scanner reports a request to a path served by a Kotlin Spring controller, produces the frontend-to-backend relationship on the map
- [x] #5 A Kotlin file with no Spring controller reports no HTTP facts and scans as before
- [x] #6 docs/scanners/kotlin/index.md lists the supported annotations and the cases that report nothing
- [x] #7 A controller without its own class-level mapping takes the one declared by a supertype found in the selected sources
- [x] #8 A Kotlin file with a top-level main function is reported as an execution entry whose name, declaration and member files follow the entryPoints contract in docs/scanners/evidence.md
- [x] #9 The entry's files are the selected .kt files of its own Maven or Gradle build unit, found without evaluating the build, and exclude the files of separately declared units
- [x] #10 Scanning the supported example, a single-module Maven Spring Boot project in Kotlin, places its Kotlin components in one backend container instead of directly under the system
- [x] #11 A Kotlin project with no main function reports no execution entry and its components stay under the system as before
- [x] #12 docs/scanners/kotlin/index.md states what is reported as an entry, how its unit is found, and what is not read
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
Trace the selected-source Kotlin scan from its TypeScript entry through parser, build-unit entry evidence and Spring endpoint facts to the existing container/relationship inference. Preserve the source-only scanner contract: no project execution, installed Kotlin tools or classpath. Consolidate the PR task records and repair the conflicting TASK-580 identity. Verify the supported Spring backend and frontend example, then source-scan real Kotlin Spring projects. Extend only existing coverage for reproduced contract failures, recording each test gap before editing. Run the complete repository check, one cold simplicity review, implementer specification/quality reviews and a final full-context complexity review. Push the updated contributor branch, align the PR title/body to this task and require green Windows/Linux/macOS CI. Stage only Kotlin work and its architecture changes.

Quality review found a concrete HTTP contract failure: import RequestMethod.GET as POST followed by method=[POST] reports POST, although the application serves GET. The endpoint contract requires the method the handler serves. Existing coverage checks qualified names and an unaliased GET but cannot detect this wrong method. Extend the current Spring fixture and endpoint expectation with one alias mapping, prove it fails, then resolve explicit import aliases before reading the constant name. Keep the parser-only scope and existing blocker behavior.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: annotations are matched by simple name because the parser resolves nothing. Paths are read only from strings without interpolation and methods only from RequestMethod.X; any other mapping reports no endpoint, as AC 3 requires. This differs from the producer checklist in docs/scanners/evidence.md, which asks for a blocker in place of a route a scanner sees but cannot read; the difference is documented on the Kotlin page and left for the maintainer to decide. Segment rules are ported from the Java scanner's Spring rules.
Verification: test-bun/kotlin-scanner.test.ts expects the exact endpoints of the fixture controller: class prefix joined, a plain and two constrained parameters, two methods from one @RequestMapping, a catch-all ending its route, and nothing for a computed route, a constant route, an unmapped function, a client interface and a file without a controller (AC 1, 2, 3, 5). A scratch project with a TypeScript fetch of /api/orders/${id} and a Kotlin controller scanned with bun src/cli.ts scan wrote the derived row 'Calls HTTP endpoint: GET /api/orders/:id' from frontend/src/orders.ts to OrderController.kt (AC 4). bun run check: 774 pass, 6 fail; the 6 failures are the Swift scanner tests, which need a Swift toolchain this machine lacks and fail the same way on main.

Review fixes for PR 136 (2026-10-13). Decisions: an unreadable path or method is now a blocker as the producer checklist asks, replacing 'reports nothing' (AC 3 rewritten). A class-level mapping is searched on supertypes found in the scanned sources through Types.kt, taken out of Visibility.kt; Scan.kt therefore parses every file before reporting. A method is read by the last name of its expression. A function mapping inherited from a supertype is still not reported. AC 4 was verified on the scratch project before these fixes; its literal GET /api/orders/:id route is read unchanged. The fixture test expects blockers for a computed route, a constant route and an unreadable method, an imported GET, and the prefix an interface in another file declares (AC 3, 7). Verification: test-bun/kotlin-scanner.test.ts passes on JDK 21 and 25. bun run check: 769 pass, 11 fail on JDK 21; the 5 Java scanner failures are 'release version 25 not supported' and pass on JDK 25, and the 6 Swift failures need a Swift toolchain this machine lacks, as on main.

PR preparation requested by Alex on 2026-10-19. The contributor branch was merged with main at 79823fdc (including PR161). Main already owns TASK-580 for npm registry configuration, so the introduced Kotlin entry-task record is consolidated into this one task. The prior execution-entry implementation plan and evidence are retained below; this task now owns both entry and HTTP evidence for the same Kotlin backend example. Original contributor entry notes:

Decisions: unit membership uses only the paths of pom.xml, build.gradle and build.gradle.kts; no build file is opened. A main under no build declaration reports no entry, because a one-file container would misplace the rest of the application. Only a top-level main is an entry; object and companion mains are documented as not reported.
Verification: test-bun/kotlin-scanner.test.ts scans test/fixtures/kotlin-spring and expects exactly one entry, Application, with the two files of the Maven unit and without the file of the nested Gradle unit, which has no main and no entry (AC 1, 2, 4). A scratch single-module Maven Spring Boot project scanned with bun src/cli.ts scan wrote container shop-application holding the three Kotlin components (AC 3). bun run check: 774 pass, 6 fail; the 6 failures are the Swift scanner tests, which need a Swift toolchain this machine lacks and fail the same way on main.

Review fixes for PR 136 (2026-10-13). Decisions: a private main or one with type parameters reports no entry. A main under no selected build declaration reports the warning kotlin-main-without-build-declaration, which also tells a project with an older include list why it has no container; include lists are not migrated. Left as documented limits because they follow from the entryPoints contract and core's rule, not from the scanner: several mains in one unit share its files, which core leaves under the system, and a library module with its own build declaration is a separate unit that joins no entry. The fixture test expects no entry for a private main and the warning for a main scanned without its pom.xml. Verification: test-bun/kotlin-scanner.test.ts passes on JDK 21 and 25. bun run check: 769 pass, 11 fail on JDK 21; the 5 Java scanner failures are 'release version 25 not supported' and pass on JDK 25, and the 6 Swift failures need a Swift toolchain this machine lacks, as on main.

The packaged Kotlin fixture passes after merging latest main. Three pinned real projects were scanned with PATH empty during scans/outlines and every selected file hash preserved: spring-guides/tut-spring-boot-kotlin a599cbd44f5ec108c402e9967309ead7008b2212 (8 source files,1 entry,6 endpoints); spring-petclinic/spring-petclinic-kotlin c77f77ba5d43c2dbff7fa777c40be1d7ec321e40 (24 sources,1 entry,18 endpoints); hantsy/spring-kotlin-coroutines-sample85bb5f379aa78a45bccee86cc5ac29cd632121c9 (7 source files,7 module entries,37 endpoints). Entry member sets respect the separate build units. Selected entry/controller Code outlines load in each project. Preparing Kotlin scanner0.1.2 because0.1.1 is already published.

Quality review reproduced an imported HTTP method alias returning the wrong method: RequestMethod.GET as POST was emitted as POST. The added fixture assertion failed before the fix. Endpoints.kt now follows the explicit alias to the declared enum constant using the parsed import directive, with no classpath or project execution. Kotlin docs describe the same source-only rule.

Cold simplicity review passed with no blocking findings or required simplifications. The reviewer traced index.ts -> Scan.kt -> Entries.kt/Endpoints.kt/Types.kt -> existing core placement and HTTP relationship inference and found clear responsibility boundaries, no unnecessary abstraction or new architecture concept. Implementer specification review verified all12 acceptance criteria using packaged fixtures, the three pinned Spring projects and the CLI-created mixed TypeScript/Kotlin example: one Kotlin application container owns Application and OrderController and the frontend stores Calls HTTP endpoint: GET /api/orders/:id. Quality review fixed the concrete imported-method alias error; the regression showed POST before and GET after the fix. Full bun run check passes after the fix: Node suite,900 Bun tests,62 optional skips,0 failures. Changed source/test files stay below500 lines and git diff --check passes. No groma/ files changed; the configured repository scanners do not select Kotlin worker source. The full-context complexity review is the remaining local review gate; Windows/Linux/macOS CI will validate the pushed head.

Final full-context complexity review passed with no blocking findings or material architecture recommendations. The reviewer confirmed clear ownership from selected files through Kotlin evidence to core containers and relationships, and no unnecessary architecture concepts. The version-only bun.lock update passes a frozen install. All local gates are complete; final pushed-head CI is the remaining delivery gate.

Alex approved merging PR136 and PR172 and publishing0.7.1 after the platform checks pass. All12 acceptance criteria and4 Definition of Done items have verified local evidence. The combined Kotlin/Python candidate also passes the complete repository check:901 Bun tests,62 optional skips,0 failures, plus the Node suite. PR136 Linux and macOS CI have passed; Windows CI remains a merge gate on the PR. This completion record changes task metadata only; it does not alter scanner code.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Kotlin scanner reports top-level main entries within selected Maven or Gradle build units and Spring controller HTTP endpoints, including inherited source prefixes and explicit HTTP-method import aliases. Core uses those facts to place Kotlin applications in containers and connect frontend requests to backend handlers. The scanner runs without project tools and does not execute source. Packaged fixtures, three pinned public Spring projects, an end-to-end frontend/backend map, full repository checks and both required external reviews passed. The conflicting entry task was consolidated into this unique task.
<!-- SECTION:FINAL_SUMMARY:END -->
