---
id: TASK-576
title: Add an experimental Kotlin scanner
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-09 15:00'
updated_date: '2026-10-09 15:35'
labels: []
dependencies: []
references:
  - modules-discovery
  - kotlin-src-index
documentation:
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/evidence.md
  - docs/scanners/scala/index.md
modified_files:
  - backlog/tasks/task-576 - Add-an-experimental-Kotlin-scanner.md
  - plugins/scanners/kotlin/worker/md/groma/scanner/Parse.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Declarations.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Symbols.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Operations.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Calls.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Outline.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Json.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Scan.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Main.kt
  - plugins/scanners/kotlin/package.json
  - plugins/scanners/kotlin/.gitignore
  - plugins/scanners/kotlin/src/index.ts
  - plugins/scanners/kotlin/src/adapter.ts
  - plugins/scanners/kotlin/THIRD-PARTY-NOTICES.txt
  - plugins/scanners/kotlin/build.ts
  - test/fixtures/kotlin-source/src/main/kotlin/shop/Orders.kt
  - test/fixtures/kotlin-source/src/test/kotlin/shop/Broken.kt
  - bun.lock
  - test-bun/kotlin-scanner.test.ts
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - test-bun/scanner-release.test.ts
  - test-bun/scanner-fresh-checkout.test.ts
  - docs/scanners/kotlin/index.md
  - docs/scanners/index.md
  - docs/scanners/discovery.md
  - README.md
  - docs/scanners/creating-a-plugin.md
  - groma/systems/groma-md/containers/cli/components/kotlin-src-index.md
type: feature
ordinal: 653000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Groma has official scanners for Java and Scala but none for Kotlin, so a Kotlin repository scans to an empty map and its files are reported as read by no enabled scanner. An external contributor requested a Kotlin scanner with the same evidence surface as the experimental Scala scanner: source inventory, declarations, the Code outline, and bounded call evidence. The contributor chose the Kotlin compiler PSI (kotlin-compiler-embeddable) in a bundled JVM worker, following the Scala and Java scanner delivery, and a small authored fixture under test/fixtures as the approved example. HTTP endpoint and request extraction, Gradle or Maven module discovery, Kotlin scripts (.kts) and Kotlin Multiplatform source-set semantics are out of scope for this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The installed Kotlin scanner inventories the selected `.kt` files and reports their top-level declarations as symbols, without a project build, dependency installation, scan-time download, or a separately installed JDK, Kotlin compiler, Gradle or Maven.
- [x] #2 Functions, methods, secondary constructors and extension functions are reported as operations with original UTF-16 positions; call expressions inside them are reported with call-site positions and stay unresolved because syntax alone does not prove a target.
- [x] #3 The source outline lists top-level types, objects and functions with their members and Kotlin visibility (public by default, protected, internal, private) as the source-outline contract defines, and marks entries named by Code links.
- [x] #4 A parse or read failure of a selected file rejects the whole observation and names that file; no partial observation is returned.
- [x] #5 Discovery, the official catalog, scanner release assembly, source listing and scanner documentation agree on the supported Kotlin scope and use the existing scanner delivery flow.
- [ ] #6 The isolated-package scanner test, the shared fresh-checkout and release tests, and `bun run check` pass.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Package `plugins/scanners/kotlin` mirrors the Scala scanner: `src/index.ts` filters the host-selected `.kt` paths, `src/adapter.ts` runs the bundled worker with the bundled Java runtime in `scan` or `outline` mode (paths on stdin, JSON on stdout) and marks outline entries. Manifest: include `**/*.kt`; default exclude `build/`, `.gradle/`, `src/test/`, `src/*Test/`; one `file` discovery rule for technology `kotlin`.
2. Worker in Kotlin under `plugins/scanners/kotlin/worker/`, parsing with kotlin-compiler-embeddable 2.4.21 PSI (parse only: no analysis, classpath, Gradle or Maven). One file per responsibility as in Scala: Main, Parse, Symbols, Operations, Calls, Outline, Visibility, Json. A PSI error element or read failure fails the run naming `file:line`.
3. Evidence rules. Symbols: top-level classes, interfaces, objects, enum classes, functions (extension functions by bare name) and properties initialised directly with a lambda or anonymous function. Operations: functions with a body, secondary constructors, such properties; members are `Type.name`, companion-object functions belong to the enclosing type. Position is the UTF-16 offset of the declaration start after KDoc and comments. Invocations: every call expression in an operation body, with `member` when the callee is a name, always unresolved with no targets. No body tokens, no HTTP facts. One source root.
4. Outline rules: top-level types and functions; members are functions, declared primary and secondary constructors (named `constructor`), and companion-object functions. Properties, type aliases and nested types are omitted. Visibility: `public` (default or explicit), `protected`, `internal`, `private`.
5. `build.ts` (maintainer build): download pinned jars from Maven Central, compile the worker with that same compiler jar (no installed kotlinc or Gradle), write `dist/worker.jar` and `dist/lib/*.jar`, jlink a runtime to `dist/<host>/runtime`, bundle the entry, write notices. Register in `official-catalog.ts` and `scripts/scanner-release.ts` beside Scala.
6. Docs: `docs/scanners/kotlin/index.md`, links in `docs/scanners/index.md` and README, the Kotlin row of the visibility table and discovery table.
7. Tests (authority: TASK-576 AC 1-4 and the scanner contract requiring a fixture proving deterministic output, atomic files, root membership, operation evidence and failure without partial output). No Kotlin coverage exists. Add one isolated-package test `test-bun/kotlin-scanner.test.ts` over fixture `test/fixtures/kotlin-source`: it fails if a selected file or declaration is missing, a position ignores the non-BMP character or includes KDoc, a call is reported resolved, a visibility or companion or constructor rule is wrong, a broken file yields a partial observation, or default selection reads `src/test/`. Add `kotlin` to the existing fresh-checkout and release-assembly tests instead of new harnesses.
8. Run the focused test, cold simplicity review, `bun run check`, implementer specification and quality reviews, full-context complexity review; fold scanner-written `groma/` components into the language-scanner owner.

9. Final worker layout differs from step 2: Main, Scan, Parse, Symbols, Operations, Calls, Outline, Json, and Declarations (the one rule shared by symbols, operations and outline: a property initialised with a function literal is a function). Visibility lives in Outline and operation naming and start position in Operations, each beside its only user.
10. CRLF: the compiler parser reports a syntax error at the first carriage return (reproduced in the spike on a CRLF file, and Windows hosts ship). Parse replaces each carriage return with a space, a same-length change, so offsets and lines still refer to the file on disk. Test authority: reproduced failure in the supported flow; wrong result detected: a CRLF file fails the scan or shifts positions; gap: no fixture can carry CRLF reliably through Git, so the isolated-package test writes one temporary CRLF file.
11. Architecture: the two TypeScript sources form one component `kotlin-src-index` (Kotlin source scanner) under container `cli`, group Language scanners, like the Scala scanner. No new C4 level or OKF metadata.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Feasibility spike outside the repository (JDK 21, kotlin-compiler-embeddable 2.4.21): a Kotlin worker compiled by the embeddable compiler itself parses source through KotlinCoreEnvironment + KtPsiFactory in about 0.3 s, reports syntax errors as PsiErrorElement, and needs opt-ins CoreEnvironmentDeprecation, CompilerConfiguration.Internals and ExperimentalCompilerApi (extension storage must be registered). Runtime classpath needs the compiler, kotlin-stdlib and kotlinx-coroutines-core-jvm. The IntelliJ core references javax.swing.Icon, so the jlinked runtime needs java.desktop: 77 MB (23.6 MB gzip) per host versus 44 MB (13.1 MB gzip) for the Scala-sized runtime; the jars add about 57 MB gzip. A stub javax.swing.Icon on the small runtime also parsed correctly but is not adopted without maintainer approval.

Implemented as planned. Cold simplicity review (separate agent, no conversation history) found no blockers; accepted: single carriage-return replacement, helpers moved beside their only users, dropped the type-name guard on member entries, the top-level-companion guard, the -Werror build flag and the headless flag (class-load trace shows only the javax.swing.Icon interface is loaded, no AWT toolkit), and one doc example the fixture does not exhibit. Kept the `src/*Test/` default exclusion: the user approved the listed defaults.

Verification on macOS arm64 with Bun 1.4.2 and JDK 25 (Temurin): test-bun/kotlin-scanner.test.ts passes (14 assertions: selection, symbols, operation positions after KDoc and a non-BMP character, unresolved calls, repeat equality, atomic failure naming Broken.kt, outline visibility/constructors/companion/entries, default exclusion of src/test, CRLF). Shared fresh-checkout test passes for kotlin with an empty home and only git on PATH (7 assertions); release-assembly test passes including kotlin (86 assertions). bun run check: lint has only the existing findings, typecheck passes, Node 16/16, Bun 771 pass, 52 skip, 6 fail. All 6 failures are Swift scanner tests failing at `swiftc` with "no such module SwiftParser" on this machine (Command Line Tools without swift-syntax); none involves Kotlin. The machine default Bun 1.3.14 is below the declared 1.4.1 minimum and fails unrelated tests, so the declared version was used. Package size: worker.jar 36 KB, dist/lib 59 MB, runtime 78 MB per host.

Final full-context complexity review (separate agent): no simpler approach; one blocking defect fixed: a file that is not valid UTF-8 failed without naming itself (AC 4), now reported with its path and covered by one assertion. Also applied: default exclusions written as `**/src/test/` and `**/src/*Test/` because an inner-slash pattern is anchored at the repository root and would have scanned tests in every Gradle module (verified with the selection helper on a nested module); two doc clarifications about nested-type operations and constructor delegation. Re-verified: Kotlin test 15 assertions pass, fresh-checkout kotlin passes, bun run check unchanged (Node 16/16, Bun 771 pass, 52 skip, 6 Swift toolchain failures unrelated to this task). AC 6 stays unchecked on this machine because of those 6 Swift failures; CI has the Swift toolchain. Third-party notices copy the Kotlin NOTICE, the Apache 2.0 text and the upstream third-party list; the individual third-party license texts are referenced by URL at the v2.4.21 tag, not copied.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the experimental Kotlin scanner `@groma/scanner-kotlin` (plugins/scanners/kotlin): a TypeScript entry and adapter run a bundled Kotlin worker on a bundled Java runtime; the worker parses selected `.kt` files with kotlin-compiler-embeddable 2.4.21 and reports symbols, operations with UTF-16 positions, unresolved call sites and source outlines, failing atomically with the file name on a parse or read error. Registered in the official catalog and scanner release assembly, documented in docs/scanners/kotlin/index.md and the shared scanner docs, and recorded as component `kotlin-src-index` in the CLI container. Verified by test-bun/kotlin-scanner.test.ts (15 assertions), the shared fresh-checkout test with no JDK on PATH, the release-assembly test, and bun run check on Bun 1.4.2 (771 pass; 6 failures are Swift tests that need a Swift toolchain missing on the development machine). Cold simplicity and full-context complexity reviews passed after their accepted fixes. Not pushed or published.
<!-- SECTION:FINAL_SUMMARY:END -->
