---
id: TASK-581
title: Report Spring HTTP endpoints from the Kotlin scanner
status: Done
assignee:
  - '@claude'
created_date: '2026-10-13 08:33'
updated_date: '2026-10-13 12:47'
labels: []
dependencies: []
references:
  - kotlin-src-index
  - plugins/scanners/kotlin/worker/md/groma/scanner/Scan.kt
documentation:
  - docs/scanners/evidence.md
  - docs/relationship-inference.md
  - docs/scanners/kotlin/index.md
  - docs/scanners/java/index.md
modified_files:
  - plugins/scanners/kotlin/worker/md/groma/scanner/Endpoints.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Scan.kt
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/OrderController.kt
  - test-bun/kotlin-scanner.test.ts
  - docs/scanners/kotlin/index.md
  - plugins/scanners/kotlin/worker/md/groma/scanner/Types.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Visibility.kt
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/InvoiceApi.kt
  - test/fixtures/kotlin-spring/src/main/kotlin/shop/InvoiceController.kt
type: feature
ordinal: 657000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
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
1. New worker file Endpoints.kt: for each class (not interface) annotated @RestController or @Controller, each function with a body and a @GetMapping, @PostMapping, @PutMapping, @DeleteMapping, @PatchMapping or @RequestMapping reports one endpoint per method and path, under each class-level @RequestMapping path, linked to the function's operation id.
2. Paths are read only from literal strings (positional, value= or path=, single or in [..]/arrayOf(..)); methods only from RequestMethod.X. Anything else is unreadable and that function, or the whole class for an unreadable class-level mapping, reports nothing.
3. Segments follow the Java scanner's Spring rules: {name} and * are parameters; {name:regex} and mixed text are constrained parameters; {*name}, **, a ${..} placeholder or text outside URL path characters end the route with a constrained optional catch-all. No order, because Spring prefers the most specific route.
4. Scan.kt adds httpEndpoints to the observation.
5. Document supported annotations, the producer checklist answers and the cases that report nothing in docs/scanners/kotlin/index.md.
6. Test (rule: AC #1, #2, #3, #5 and the HTTP facts contract in docs/scanners/evidence.md). Wrong results detected: a missing class prefix, a parameter reported as a literal or unconstrained, an endpoint guessed for a non-literal route, an endpoint linked to no operation. Gap: no Kotlin HTTP coverage exists. Smallest test: one controller in the kotlin-spring fixture asserted in test-bun/kotlin-scanner.test.ts; the existing kotlin-source scan asserts no HTTP endpoints.
7. Verify AC #4 by scanning a scratch project with a TypeScript fetch and a Kotlin controller and reading the derived relationship row.
8. bun run check.

9. Review fixes for PR 136, requested by the user on 2026-10-13. (a) Blockers: an unreadable path keeps its literal text up to the unreadable part, which ends the route with a constrained optional catch-all; an unreadable method reports method * under the same catch-all. This replaces 'reports nothing' and follows the Java scanner. (b) Inherited prefix: Types.kt takes the source type lookup out of Visibility.kt, Scan.kt parses every file before reporting, and Endpoints.kt searches a controller's supertypes in the sources for a class-level mapping, interfaces first as Spring does; a supertype outside the sources declares none. (c) A method is the last name of the expression, so RequestMethod.GET, the fully qualified form and an imported GET all read as GET. (d) Tests (rule: AC 3 and 7 and the producer checklist). Wrong results detected: an unreadable route dropped or reported as a readable one, an unreadable method reported as a certain match, an inherited prefix missing from the path, an imported GET unread. Gap: the fixture asserts 'nothing' for unreadable routes and has no inherited prefix. Smallest test: change the fixture controller's expectations and add one controller implementing an interface declared in another file.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: annotations are matched by simple name because the parser resolves nothing. Paths are read only from strings without interpolation and methods only from RequestMethod.X; any other mapping reports no endpoint, as AC 3 requires. This differs from the producer checklist in docs/scanners/evidence.md, which asks for a blocker in place of a route a scanner sees but cannot read; the difference is documented on the Kotlin page and left for the maintainer to decide. Segment rules are ported from the Java scanner's Spring rules.
Verification: test-bun/kotlin-scanner.test.ts expects the exact endpoints of the fixture controller: class prefix joined, a plain and two constrained parameters, two methods from one @RequestMapping, a catch-all ending its route, and nothing for a computed route, a constant route, an unmapped function, a client interface and a file without a controller (AC 1, 2, 3, 5). A scratch project with a TypeScript fetch of /api/orders/${id} and a Kotlin controller scanned with bun src/cli.ts scan wrote the derived row 'Calls HTTP endpoint: GET /api/orders/:id' from frontend/src/orders.ts to OrderController.kt (AC 4). bun run check: 774 pass, 6 fail; the 6 failures are the Swift scanner tests, which need a Swift toolchain this machine lacks and fail the same way on main.

Review fixes for PR 136 (2026-10-13). Decisions: an unreadable path or method is now a blocker as the producer checklist asks, replacing 'reports nothing' (AC 3 rewritten). A class-level mapping is searched on supertypes found in the scanned sources through Types.kt, taken out of Visibility.kt; Scan.kt therefore parses every file before reporting. A method is read by the last name of its expression. A function mapping inherited from a supertype is still not reported. AC 4 was verified on the scratch project before these fixes; its literal GET /api/orders/:id route is read unchanged. The fixture test expects blockers for a computed route, a constant route and an unreadable method, an imported GET, and the prefix an interface in another file declares (AC 3, 7). Verification: test-bun/kotlin-scanner.test.ts passes on JDK 21 and 25. bun run check: 769 pass, 11 fail on JDK 21; the 5 Java scanner failures are 'release version 25 not supported' and pass on JDK 25, and the 6 Swift failures need a Swift toolchain this machine lacks, as on main.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Kotlin scanner reports one HTTP endpoint per mapped function of a Spring annotated controller, joined under the class-level mapping of the class or of a supertype in the scanned sources and linked to the function's operation, so core derives frontend-to-backend relationships. A route or method that is not literal text is reported as a blocker. Verified by the kotlin-spring fixture test and a scratch frontend plus controller scan that produced the relationship row.
<!-- SECTION:FINAL_SUMMARY:END -->
