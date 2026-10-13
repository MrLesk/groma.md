---
id: TASK-581
title: Report Spring HTTP endpoints from the Kotlin scanner
status: To Do
assignee: []
created_date: '2026-10-13 08:33'
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
- [ ] #1 A Spring MVC or WebFlux annotated controller in Kotlin reports one HTTP endpoint per mapped function, with its method and its path joined from the class-level and function-level mappings, linked to that function's operation
- [ ] #2 Path parameters and literal segments are reported as the HTTP facts contract in docs/scanners/evidence.md defines them
- [ ] #3 A mapping whose path or method is not literal text in the source reports no endpoint for that function, and the documentation says so
- [ ] #4 Scanning the supported example, a frontend whose scanner reports a request to a path served by a Kotlin Spring controller, produces the frontend-to-backend relationship on the map
- [ ] #5 A Kotlin file with no Spring controller reports no HTTP facts and scans as before
- [ ] #6 docs/scanners/kotlin/index.md lists the supported annotations and the cases that report nothing
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
