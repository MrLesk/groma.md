---
id: TASK-624.2
title: Audit and refresh packaged parser engines for the security hotfix
status: In Progress
assignee:
  - '@parser-engines'
created_date: '2026-10-21T10:53:00Z'
updated_date: '2026-10-21T11:21:00Z'
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
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Check upstream stable engine releases and trust-store behavior. 2. Refresh supported engine inputs and record source/hash evidence. 3. Pin Scala launcher integrity before execution and exercise a mismatched-download regression. 4. Run focused packaging/scanner checks and report holds and validation.

The concrete security regression is a build accepting a modified sbt launcher or a packaged JVM retaining a compromised CA. Existing scanner tests exercise parsing but not download rejection or trust-store filtering. Add one focused launcher rejection test and one real keytool trust-store test, preserving unrelated certificates.

The transitive audit found three OSV advisories in logback-core 1.3.16 bundled by current COBOL 2.5.1. Repackage that engine without its old Logback/SLF4J classes and ship latest stable checksum-pinned replacement JARs on the worker class path. Extend the existing packaged COBOL test to prove the vulnerable classes are absent, replacement JAR hashes are correct and parsing still works. Audit the actual resolved Scala runtime and build graph, distinguishing unused cached versions.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified current upstream releases: sbt 2.0.11, sbt-assembly 2.5.0, Scala 3.10.0, Scalameta 4.17.4, coroutines 1.11.0, annotations 26.1.0. sbt launcher SHA-256 derived from GitHub release archive verified against independent release asset metadata. Maven JARs fetched with the sanitized bootstrap CA bundle. Kotlin 2.4.21, COBOL 2.5.1, NASM 3.02, CPP 0.23.4 and Mojo current upstream snapshot are already current. MQL5 HEAD equals its pinned revision. C0.24.2 changes generated bindings/parser but leaves grammar unchanged; npm stable is still0.24.1, so the custom checked-in grammar is retained.

Completed engine upgrades: sbt 1.11.7→2.0.11; sbt-assembly 2.2.0→2.5.0; Scala 3.9.0→3.10.0; Scalameta 4.17.3→4.17.4; Kotlin coroutines 1.8.0→1.11.0; build annotations 13.0→26.1.0. The sbt2 output-layout break is handled by an explicit assemblyOutputPath. Kotlin 2.4.21, COBOL 2.5.1 and NASM 3.02 are current stable upstream engines. Ada retains its qualified a45fd9c snapshot because newer HEAD has no stable release; Mojo e5905c4 and MQL5 dfbd597 remain upstream HEAD. CPP 0.23.4 is current. C0.24.2 leaves grammar.js unchanged; retain qualified custom source over npm0.24.1.

Upgraded maintainer Tree-sitter CLI0.26.3→0.27.1 and rebuilt C, CPP, Ada, Mojo and MQL5 assets using checksum-verified WASI SDK34 and Binaryen133. All736 upstream corpus cases pass (C85, CPP179, Ada130, Mojo233, MQL5109). Focused scanner regressions:68pass0fail444assertions. Generator commands and provenance/checksums are current.

Every native Bun downloader in scope now uses the shared filtered CA set and decompress:false with Accept-Encoding:identity, plus independently pinned artifact integrity. The Bun1.4.3 decompression bypass was checked with an actual local br-encoded HTTP response: raw encoded bytes returned intact, identity header observed. JVM packagers for Java/Kotlin/Scala/COBOL remove the compromised CA keys from copied/bundled trust stores, preserving other trusted certs. Scala uses an isolated sanitized trust store for Maven/Coursier downloads; maintainer JDK remains unchanged. A modified sbt launcher is rejected before execution.

Transitive OSV audit queried132 current Maven coordinates from actual sbt boot JAR hashes, resolved Scala runtime and assembly-plugin update reports, Kotlin JARs, and COBOL bundled metadata plus source-POM coordinates. All shipped Maven libraries are clean after removing COBOL embedded Logback1.3.16/SLF4J2.0.9 and shipping checksum-pinned latest stable Logback1.6.5/SLF4J2.0.20. Remaining build-only hold: latest sbt2.0.11 still boots JLine builtins/reader3.27.1 (GHSA-ph9c-7hw9-vhhw, GHSA-r2xf-8xr9-62gw, GHSA-5q95-hrpc-m3w3). Their interactive nano/grep/HISTORY_IGNORE regex paths are not exposed by our noninteractive fixed assembly invocation. No launcher cache rewrite introduced. Older cached Jackson/jsoup versions were excluded after checking the actual resolved graph.

Validation: Kotlin full build/package on verified Temurin27+35, Kotlin+JVM regressions3pass38assertions; Scala sbt2/Scala3.10 full package and regression1pass34assertions; Java/COBOL/NASM suite13pass69assertions; final patched COBOL package regression1pass24assertions proves vulnerable class entries removed, replacement JAR hashes correct and parsing preserved. Biome check of all changed TS files passed. TypeScript noEmit passed. Actual Java PKIX verifier rejects all12 published incident chains, including AAA cross-sign paths, using packaged Kotlin trust (baseline JDK27 accepted6). Also verified Microsoft25.0.4.1 WindowsARM64 ZIP against official SHA2567118ce03f24d4460c5d4ccaae03a2c695a83cd3e48686fe9bbf3b34166dce588, extracted/sanitized cacerts and rejected all12 chains. Microsoft27 and Temurin27 WindowsARM64 binaries are unavailable; parent workflow uses available Microsoft25.0.4.1 for that target.

Parent owns root/npm/scanner package versions, the mandatory combined bun run check, cross-platform release verification and the cohesive PR. Subtask remains In Progress until the combined repository check is recorded. No groma/ architecture files changed.
<!-- SECTION:NOTES:END -->
