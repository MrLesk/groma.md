---
id: TASK-538
title: Release the first-scan performance fixes
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 19:28'
updated_date: '2026-10-04 21:01'
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
- [x] #3 A draft Groma v0.6.1 release identifies the exact source commit, package versions, changelog and validation evidence for maintainer review before publication.
- [x] #4 After maintainer review, the shared release workflow publishes the scanner packages and Groma v0.6.1; actual npm packages pass installation, second-checkout restore and the supported scan checks.
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
1. Prepare Groma v0.6.1 through the existing release workflow. Bump the scanner SDK and ten scanners from 0.2.0 to 0.2.1, and Angular/Vue from 0.2.1 to 0.2.2, because each bundle embeds the changed SDK. Refresh only the corresponding workspace lock entries; keep API requirements unchanged.
2. Build the Java, JavaScript, React, TypeScript, Angular and PHP candidate packages on macOS arm64. Exercise the existing packaged fresh-checkout checks, verify the Java worker and bundled SDK changes, and run bun run check. Existing tests already cover deterministic compiler observations, scanner SDK validation and routing on crowded maps; this release adds no runtime behavior or tests.
3. Review the final manifest diff and validation evidence, commit only release files, push the exact source, and create a draft GitHub release with its version, target commit, package versions and changelog. Follow docs/scanners/publishing.md: maintainer review of that concrete draft comes before publication.
4. After that review, publish the draft to start the existing shared release workflow. Verify the five host builds, npm versions, the packaged first Keycloak scan, and fresh installation/second-checkout restore on macOS arm64. Record built and manually exercised hosts separately.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Prepared only 13 package version fields and their matching bun.lock workspace entries. @groma/scanner and Java, JavaScript, React, TypeScript, Python, PHP, Go, Rust, C# and Swift become 0.2.1; Angular and Vue become 0.2.2. Every scanner bundles the changed scanner contract implementation. The existing release workflow derives Groma 0.6.1 from the tag and later synchronizes package.json on main. No scanner API requirement, runtime source, release workflow or architecture meaning changed. git status --short groma/ is empty.

bun run check exits 0: 16 Node tests and 752 Bun tests pass, 48 environment-dependent skips and no failures. The two existing Biome warnings and two infos remain outside these version-only changes. Actual Java, JavaScript, React, TypeScript, Angular and PHP packages were built and relocated on macOS arm64; all six existing packaged fresh-checkout tests pass with an empty home, no project dependencies or language tools, repeated observations and unchanged source bytes. No new tests were needed for release identity changes.

The source-only Keycloak checkout is dd4ae31d1b67c91a7f85f7c60df5c9718b111f0a. The candidate built with the locally installed Oracle Java 25.0.1+8-LTS-27 completes its full first scan in 10.821541 seconds and its map in 19.418001 seconds. It returns all 7,400 elements, 169 relationships and 1,823 findings; the complete world and ordered scene match the original. Observation differences are limited to the compiler version and two checkout-name labels. The Java worker.jar SHA-256 is exactly the already-verified worker: 964122ccac8cfff5cf819b10e41717b485ada2b35b80d9abf36ca0023b752efe.

A separate benchmark artifact keeps the current candidate JavaScript and JAR but copies the original bundled Java 25.0.4.1+1-LTS runtime and its full platform directory. It uses a fresh checkout named test-keycloak. Every complete observation, the full world and ordered scene then matches the original exactly. This run takes 11.002088 seconds for the complete scan and 19.504834 seconds for the map. The staged release packages are not changed by this comparison. The earlier TASK-536 controlled runs remain 9.715825 and 9.943169 seconds, but current timing variance also occurs with the same runtime; release notes must not promise a fixed under-ten-second duration.

The source-only private acceptance checkout is 55587399548fbd4e4cae8b07f6dd686a0a3c5412. Candidate Java 0.2.1, Angular 0.2.2, TypeScript 0.2.1, PHP 0.2.1 and JavaScript 0.2.1 complete its scan in 2.991366 seconds and map in 5.002313 seconds, with 1,230 elements, 118 relationships and 281 findings. All 118 expected routes are covered and orthogonal, with zero building crossings and zero shared path length.

Own specification and quality reviews pass for the prepared source: manifests own package identity, existing builders embed the changed library, and the existing release workflow owns validation, publication and CLI version synchronization. The diff contains only intended patch versions and matching lock entries; existing checks exercise the scanner and routing rules. This mechanical release preparation needs no separate architecture review. Only macOS arm64 has been built and manually exercised here; the existing publication workflow will build and exercise its five declared hosts before uploading packages.

Alex now explicitly requests publication of everything, but requires the Groma 0.6.1 release notes to be shown first and to match earlier releases. Prepare the draft with the v0.6.0 headings, short bold-label bullets and Full Changelog link. Publication remains pending that concrete review. Evidence is under /private/tmp/groma-release-538*, including check, build, packaged-test and first-scan logs.

Prepared source 79c1b3969a565ca208226c8a3e7733d8923f9358 is committed and pushed to main with exact task subject. Draft https://github.com/MrLesk/groma.md/releases/tag/untagged-80786f3b0060a4bc7eeb names v0.6.1 and targets that source commit. Readback confirms isDraft=true and byte-identical notes from /private/tmp/groma-release-v0.6.1.md. The draft follows v0.6.0's Highlights / Web map / Fixes / Scanners sections and Full Changelog link. It reports current timings honestly (about 10–11 s scan and about 20 s full map), rather than promising a fixed under-ten-second time. All publication remains pending Alex's requested release-note review; no Release publication workflow has been triggered. AC3 is satisfied by the concrete draft and recorded validation; AC4 remains open.

Alex requested shorter notes and a check for already-released content. Verified v0.6.0 resolves to e50ddbc49c5fbb0c34cbbd6cec3f0a37cccd3137, matching the published release, and compared scanner source with the last successful separate publication at 67426806b73ff6524ce6fc097d78b980ad2f397c. The shared scanner/Java performance changes (TASK-536), terminal shared layout and animated depth changes (TASK-533), and spacing fix for crowded maps (TASK-537) are all later changes. Angular/Vue callback fixes were already published as 0.2.1 and are not described again. PR comparisons were already released through groma.md-action v1.0.0 on 2026-09-27; TASK-531 wires that existing Action into this repository and is omitted from the CLI notes. Removed minor UI details and shortened the draft to five bullets under the same four headings, plus the scanner update command and Full Changelog link. Readback verifies the new body, unchanged source 79c1b3969a565ca208226c8a3e7733d8923f9358 and isDraft=true. The shortened notes are pending Alex's review; publication remains untriggered. No source or manifest changed, so repository checks were not repeated.

Alex approved the shortened notes subject to removing the private example name. The routing bullet now says: "Crowded maps open without connections crossing buildings." Verified the saved draft contains no private-project reference and still targets 79c1b3969a565ca208226c8a3e7733d8923f9358. The requested note review and correction are complete; proceed with the previously authorized publication of Groma 0.6.1 and all prepared scanner patches.

Published the reviewed v0.6.1 release at https://github.com/MrLesk/groma.md/releases/tag/v0.6.1 on 2026-10-04 at 20:02:22 UTC. Readback confirms the exact corrected notes, no private-project reference in the release body, isDraft=false and target source 79c1b3969a565ca208226c8a3e7733d8923f9358. Shared publication workflow https://github.com/MrLesk/groma.md/actions/runs/37230561064 is running. Repository validation and Linux x64, Linux arm64 and macOS arm64 scanner builds have passed; both Windows scanner builds remain in progress. Actual npm package and second-checkout verification remain pending publication.

All five scanner host builds and their packaged fresh-checkout tests passed in release workflow 37230561064: darwin-arm64, linux-x64, linux-arm64, win32-x64 and win32-arm64. Official scanner publication is now running. Local manual qualification remains limited to macOS arm64, with actual npm installation and restore checks prepared in an isolated temporary directory.

The scanner publishing log confirms npm accepted the SDK, all twelve scanners and five C# runtime packages at their new versions. Initial Groma builds stopped in Embed published scanner metadata because @groma/scanner-java@0.2.1 was not yet present in npm public metadata. A first isolated scanner install encountered the same visibility delay. Follow the existing docs/scanners/publishing.md procedure: verify every exact scanner version through the public registry, then rerun failed workflow jobs with the same source, tag and versions. No workflow or runtime code change is needed.

At 20:38 UTC all 18 exact scanner package versions are visible, including Java 0.2.1, and npm view @groma/scanner-java@0.2.1 version returns 0.2.1. Java publication was acknowledged at 20:20:54.840 UTC; npm records the public version at 20:37:17.617 UTC, about 16 minutes later. Restarted failed jobs of workflow 37230561064 with gh run rerun --failed, following the publishing guide without changing the source commit, tag or package versions. Alex also requested a permanent correction after the restart; TASK-539 tracks the automatic bounded catalog wait separately.

Release workflow 37230561064 completed successfully on attempt 2 after restarting the failed jobs. All five scanner builds and packaged fresh-checkout checks passed, followed by all five Groma builds, platform package publications, release assets, wrapper publication and main version synchronization. All 24 exact npm versions are public: SDK 0.2.1, ten scanners 0.2.1, Angular and Vue 0.2.2, five C# runtime packages 0.2.1, and groma.md plus its five platform packages 0.6.1. The release contains all five binaries and SHA256SUMS. The reviewed release body and source commit 79c1b3969a565ca208226c8a3e7733d8923f9358 remain unchanged.

Installed the actual npm wrapper and macOS arm64 binary in an isolated directory; both report 0.6.1. Existing packaged fresh-checkout tests pass for the actual npm Java, JavaScript, React, TypeScript, Angular and PHP packages, with no project dependencies, an empty home, no language tools, repeated observations and unchanged source bytes. The remaining scanner packages and hosts were built and exercised by the five-host release workflow, rather than manually exercised on this Mac.

Actual published Keycloak packages complete the standalone first scan in 11.233374 seconds. The released web command opens the full map in 18.929672 seconds in the fresh checkout and 19.080861 seconds in the second checkout after restoring exact scanner selections from a separate empty home and cache. Both return the original complete world and ordered scene exactly: 7,400 elements, 169 relationships, 1,823 findings and all 169 routes. Routes remain orthogonal, with zero building crossings and zero shared path length. Tracked source bytes and scanner selections are unchanged. Scanner installation downloads are measured separately from first-scan startup.

The private acceptance project passes the same actual npm fresh-install and second-checkout restore checks. Full maps open in 4.849704 and 4.676724 seconds. Both contain 1,230 elements, 118 relationships, 281 findings and all 118 orthogonal routes, with zero building crossings and zero shared path length. Complete worlds and scenes are identical between checkouts, scanner selections match, and tracked source bytes remain unchanged. Temporary verification helper corrections handled tracked directory symlinks, compared scanner selections independently of config ordering, and read findings from the released web process that computed them; these were verification-helper issues, not product regressions. Evidence is under /private/tmp/groma-release-538-published/ and its qualification logs.

Final specification and quality reviews pass. Package manifests own release identity, existing builders embed the updated SDK and Java worker, and the shared workflow owns validation and publication. The supported installed CLI flow reproduces the original Keycloak world and map and the supported acceptance-project result without source changes. The release notes describe observed performance honestly without a fixed under-ten-second promise. No additional runtime behavior, compatibility layer or architecture record was added. The automatic metadata wait is delivered separately by TASK-539 in e0a3dbc7bf41482d72f5887979a9e70b1f14ee65; CI run 37233882074 passed on Linux, macOS and Windows, and architecture run 37233882095 passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Published the reviewed Groma v0.6.1 release and all prepared scanner patches from source 79c1b3969a565ca208226c8a3e7733d8923f9358. The restarted shared workflow passed on all five release hosts, and all 24 exact npm versions, five binaries and checksums are available. Actual npm installation and second-checkout restore passed on macOS arm64. Keycloak opens its complete original map in about 19 seconds, with all elements, relationships, findings and routes preserved; the supported private acceptance project opens in under five seconds with identical architecture and map results. Source bytes remain unchanged in both projects. Release notes match the previous format, omit previously released items and contain no private-project name. TASK-539 supplies the permanent bounded npm metadata wait for future releases.
<!-- SECTION:FINAL_SUMMARY:END -->
