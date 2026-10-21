---
id: TASK-625
title: Fix hotfix release review regressions and refresh patched tools
status: In Progress
assignee:
  - '@groma-hotfix'
created_date: '2026-10-21T14:16:00Z'
updated_date: '2026-10-21T14:30:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/jvm-package.ts
  - test-bun/jvm-trust.test.ts
  - plugins/scanners/go/build.ts
  - .github/workflows/release.yml
  - package.json
modified_files:
  - plugins/scanners/jvm-package.ts
  - test-bun/jvm-trust.test.ts
  - scripts/prepare-rustup.cjs
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - package.json
  - bun.lock
  - docs/scanners/java/validation.md
  - docs/scanners/angular/validation.md
  - docs/scanners/react/validation.md
  - docs/scanners/vue/validation.md
  - scripts/scanner-release.ts
  - plugins/scanners/go/src/adapter.ts
  - test-bun/go-scanner.test.ts
priority: high
type: bug
ordinal: 695000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The post-merge security review reproduced unintended mutation of a symlinked maintainer Java trust store and found newly published tool patches. Release v0.7.3 failed its Windows Go build before npm publication; preserve its public tag and qualify the follow-up before creating v0.7.4.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Preparing a filtered Java trust store preserves the original keystore when the source cacerts path is a symlink
- [ ] #2 Verified current patched build tools and dependency versions are used before their network operations
- [ ] #3 The supported scanner release path passes with bounded runtime operations and actionable build failure diagnostics
- [ ] #4 Fresh source review and relevant hosted checks pass before the coordinated GitHub Release
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
1. Review the merged security update against b8b325fd and retain the exact native/source evidence for confirmed findings.
2. Copy symlinked Java cacerts by value. Use a real temporary keystore to prove the original bytes stay unchanged, the copy is independent, the blocked authority is removed and the private authority remains.
3. Bootstrap checksum-verified Rustup 1.29.2 with patched Node before toolchain downloads. Upgrade the verified Biome 2.6.2 native binary and both Comark packages to 0.8.1; validate the supported parsing/rendering behavior.
4. Preserve Go exec errors as causes and stage its existing package build before the concurrent compiler group. Keep the 120-second runtime bound and add no retry.
5. Run focused tests, the mandatory repository check and hosted native/package gates. Review the single follow-up PR before coordinating v0.7.4 through GitHub Releases.

Regression coverage: the old JVM test copied the installed JDK store and did not detect source symlink mutation; the new child-isolated test uses actual copy and keytool operations against a private temporary source. The Go failure test proves stderr remains readable while exit code, signal and killed fields remain available for diagnosis.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fresh audit reproduction: Bun1.4.3 fs.cp preserves symlinks, including the actual Debian OpenJDK cacerts link to /etc/ssl/certs/java/cacerts. Executing prepareJavaTrustStore against an isolated real temporary JKS confirms copiedStoreIsSymlink:true, originalChanged:true and originalBlockedPresent:false. Only java.home discovery was stubbed; copying and keytool filtering were real, and no OS store was touched by this reproducer. Root authorized the minimal dereference fix and behavioral regression. Prior P1 config reviews were independently disproved by16 raw native pm view/install controls and immutable Bun1.4.3 source; no config semantics change is planned. Release63 was not retried and published no npm packages.

Real symlink regression passes after dereference:true. Existing local system cacerts already contains old custom-test fixture alias, exposing earlier copy-through-symlink contamination; no OS trust store was edited during this audit. Existing test now uses unique aliases only in its temporary copied store.

Rustup1.29.2 official five-target SHA256 pins verified; isolated real bootstrap passed exact-version assertion and installed no Rust toolchain. Biome wrapper and Linux native2.6.2 tarballs passed registry SHA512 integrity and actual --version execution before dependency update. JVM real-keytool suite3/3 now passes with10 assertions; custom-test in local system cacerts exactly matches the old ISRG Root X1 fixture fingerprint, attribution to a specific earlier run is not independently provable.

Official comark@0.8.1 release security fix sanitizes frontmatter/tag selectors/data URLs;0.8.0 breaking changes preserve custom heading IDs and keep Markdown within HTML elements. Both comark and @comark/html upgraded together to0.8.1, checking the supported parser/emitter/renderer suites.

Follow-up implementation review: Rustup preparation is a separate preceding CI step so GITHUB_PATH applies before the install step; that step asserts the actual rustup version immediately before toolchain network access. All five official Rustup installer SHA-256 values are pinned, and the local isolated bootstrap reported 1.29.2 with toolchain installation skipped.

Verification: Biome native 2.6.2 and both npm tarballs passed SHA-512 integrity and actual version execution. The JVM suite passed 3 tests/10 assertions; combined parser/render/export/JVM coverage passed 24 tests/142 assertions; Go diagnostics/release assembly passed 4 tests/101 assertions (13 unavailable native Go scenarios skipped). Typecheck, changed-file lint, YAML parsing and git diff --check passed.

Mandatory bun run check was attempted after the full source change: lint and typecheck passed, all 24 Node tests passed, and Bun reported 886 pass/62 skip/29 fail. The failures are the existing missing jar/javac/jlink/swiftc tools after scratch loss, one NASM ECONNRESET and two independently demonstrated PID-namespace liveness mismatches. No native SDK was restored and no test was weakened; full hosted checks remain the release gate.

JDK 27 GA source 815ff4dc327fe17f2433c7d115a5a503af10f3c4 DefaultImageBuilder.java lines 403-452 confirms jlink writes normal resources through InputStream/Files.copy and only permits symbolic links for legal notices. The two packaged cacerts paths use jlink; prepareJavaTrustStore was the only source-copy path.

No executable bunx/bun x path exists in Groma sources or CI. Four validation documents now invoke the installed local Biome binary. The two late config review findings remain disproved by 16 actual native Bun 1.4.3 pm view/install controls and immutable upstream source; no package configuration semantics changed. Release 63 was not retried and no package publication was attempted. Hosted qualification and final PR/Codex review are pending.
<!-- SECTION:NOTES:END -->
