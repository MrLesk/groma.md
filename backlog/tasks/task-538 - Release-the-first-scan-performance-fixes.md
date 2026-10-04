---
id: TASK-538
title: Release the first-scan performance fixes
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-04 19:28'
updated_date: '2026-10-04 19:40'
labels: []
dependencies: []
references:
  - scanner-src-index
  - java-src-index
  - javascript-src-index
  - react-src-index
  - typescript-src-index
  - src-index
  - php-src-index
  - go-src-index
  - rust-src-index
  - csharp-src-index
  - swift-src-index
  - angular-src-index
  - vue-src-index
documentation:
  - docs/scanners/publishing.md
modified_files:
  - packages/scanner/package.json
  - plugins/scanners/java/package.json
  - plugins/scanners/javascript/package.json
  - plugins/scanners/react/package.json
  - plugins/scanners/typescript/package.json
  - plugins/scanners/python/package.json
  - plugins/scanners/php/package.json
  - plugins/scanners/go/package.json
  - plugins/scanners/rust/package.json
  - plugins/scanners/csharp/package.json
  - plugins/scanners/swift/package.json
  - plugins/scanners/angular/package.json
  - plugins/scanners/vue/package.json
  - bun.lock
priority: high
type: chore
ordinal: 623000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The live Java presentation uses the local Groma core but installs official scanners from npm. npm still serves Java 0.2.0, which starts a separate compiler process for each module and took about 64.5 seconds in the Keycloak demo. TASK-536 and TASK-537 are committed on main, but their scanner and CLI fixes need a release. Every official scanner bundles the changed scanner SDK, so reusing its published version would omit those shared changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 New patch scanner packages contain the committed Java worker and shared SDK performance changes; npm publication cannot reuse the old versions.
- [x] #2 The release source passes repository checks and the existing packaged scanner validation on the exercised host.
- [ ] #3 A draft Groma v0.6.1 release identifies the exact source commit, package versions, changelog and validation evidence for maintainer review before publication.
- [ ] #4 After maintainer review, the shared release workflow publishes the scanner packages and Groma v0.6.1; actual npm packages pass installation, second-checkout restore and the supported scan checks.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Prepare Groma v0.6.1 through the existing release workflow. Bump the scanner SDK and ten scanners from 0.2.0 to 0.2.1, and Angular/Vue from 0.2.1 to 0.2.2, because each bundle embeds the changed SDK. Refresh only the corresponding workspace lock entries; keep API requirements unchanged.
2. Build the Java, JavaScript, React, TypeScript, Angular and PHP candidate packages on macOS arm64. Exercise the existing packaged fresh-checkout checks, verify the Java worker and bundled SDK changes, and run bun run check. Existing tests already cover deterministic compiler observations, scanner SDK validation and CFP routing; this release adds no runtime behavior or tests.
3. Review the final manifest diff and validation evidence, commit only release files, push the exact source, and create a draft GitHub release with its version, target commit, package versions and changelog. Follow docs/scanners/publishing.md: maintainer review of that concrete draft comes before publication.
4. After that review, publish the draft to start the existing shared release workflow. Verify the five host builds, npm versions, the packaged first Keycloak scan, and fresh installation/second-checkout restore on macOS arm64. Record built and manually exercised hosts separately.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Prepared only 13 package version fields and their matching bun.lock workspace entries. @groma/scanner and Java, JavaScript, React, TypeScript, Python, PHP, Go, Rust, C# and Swift become 0.2.1; Angular and Vue become 0.2.2. Every scanner bundles the changed scanner contract implementation. The existing release workflow derives Groma 0.6.1 from the tag and later synchronizes package.json on main. No scanner API requirement, runtime source, release workflow or architecture meaning changed. git status --short groma/ is empty.

bun run check exits 0: 16 Node tests and 752 Bun tests pass, 48 environment-dependent skips and no failures. The two existing Biome warnings and two infos remain outside these version-only changes. Actual Java, JavaScript, React, TypeScript, Angular and PHP packages were built and relocated on macOS arm64; all six existing packaged fresh-checkout tests pass with an empty home, no project dependencies or language tools, repeated observations and unchanged source bytes. No new tests were needed for release identity changes.

The source-only Keycloak checkout is dd4ae31d1b67c91a7f85f7c60df5c9718b111f0a. The candidate built with the locally installed Oracle Java 25.0.1+8-LTS-27 completes its full first scan in 10.821541 seconds and its map in 19.418001 seconds. It returns all 7,400 elements, 169 relationships and 1,823 findings; the complete world and ordered scene match the original. Observation differences are limited to the compiler version and two checkout-name labels. The Java worker.jar SHA-256 is exactly the already-verified worker: 964122ccac8cfff5cf819b10e41717b485ada2b35b80d9abf36ca0023b752efe.

A separate benchmark artifact keeps the current candidate JavaScript and JAR but copies the original bundled Java 25.0.4.1+1-LTS runtime and its full platform directory. It uses a fresh checkout named test-keycloak. Every complete observation, the full world and ordered scene then matches the original exactly. This run takes 11.002088 seconds for the complete scan and 19.504834 seconds for the map. The staged release packages are not changed by this comparison. The earlier TASK-536 controlled runs remain 9.715825 and 9.943169 seconds, but current timing variance also occurs with the same runtime; release notes must not promise a fixed under-ten-second duration.

The source-only CFP acceptance checkout is 55587399548fbd4e4cae8b07f6dd686a0a3c5412. Candidate Java 0.2.1, Angular 0.2.2, TypeScript 0.2.1, PHP 0.2.1 and JavaScript 0.2.1 complete its scan in 2.991366 seconds and map in 5.002313 seconds, with 1,230 elements, 118 relationships and 281 findings. All 118 expected routes are covered and orthogonal, with zero building crossings and zero shared path length.

Own specification and quality reviews pass for the prepared source: manifests own package identity, existing builders embed the changed library, and the existing release workflow owns validation, publication and CLI version synchronization. The diff contains only intended patch versions and matching lock entries; existing checks exercise the scanner and routing rules. This mechanical release preparation needs no separate architecture review. Only macOS arm64 has been built and manually exercised here; the existing publication workflow will build and exercise its five declared hosts before uploading packages.

Alex now explicitly requests publication of everything, but requires the Groma 0.6.1 release notes to be shown first and to match earlier releases. Prepare the draft with the v0.6.0 headings, short bold-label bullets and Full Changelog link. Publication remains pending that concrete review. Evidence is under /private/tmp/groma-release-538*, including check, build, packaged-test and first-scan logs.
<!-- SECTION:NOTES:END -->
