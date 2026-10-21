---
id: TASK-625
title: Fix hotfix release review regressions and refresh patched tools
status: In Progress
assignee:
  - '@groma-hotfix'
created_date: '2026-10-21T14:16:00Z'
updated_date: '2026-10-21T16:21:00Z'
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
  - src/certificate-trust.ts
  - test-bun/certificate-trust.test.ts
  - src/scanner/modules/package.ts
  - src/scanner/modules/package-manager.ts
  - test/fixtures/certificate-trust/native-ed448-ca.pem
  - test/fixtures/certificate-trust/native-ed448-server.pem
  - src/scanner/modules/git-trust.ts
  - test/fixtures/certificate-trust/incident-server-emudhra.pem
  - test/fixtures/certificate-trust/incident-server-aaa.pem
  - .github/workflows/architecture.yml
  - scripts/check-native-tls.cjs
  - docs/scanners/setup.md
  - test-bun/certificate-fixtures.ts
  - test-bun/certificate-bootstrap.test.ts
  - test-bun/git-proxy-trust.test.ts
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
- [ ] #5 Java preserves valid Ed448 private authorities; native Git preserves authorities supported by its TLS backend, all incident keys remain excluded and Bun's unusable-store behavior stays fail closed.
- [ ] #6 Package-manager Git dependencies cannot disable certificate verification through effective URL-scoped settings, while private CA and inherited authentication remain functional.
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
1. Preserve the merged hotfix and correct only reproduced audit findings, keeping the root version under the GitHub Release workflow.
2. Copy Java cacerts symlinks by value and preserve Java-supported private keys with the shared native SPKI/incident-key filter. Real temporary keytool stores prove original bytes unchanged and incident aliases removed.
3. Bootstrap verified Rustup 1.29.2 before network toolchain setup; use verified Biome 2.6.2 and Comark/@comark/html 0.8.1. Preserve Go exec error causes and stage the existing Go package build before the concurrent compiler group, retaining the 120-second runtime bound.
4. Preserve native Git-only CAfile/hashed CApath policies and inherited authentication through one scoped helper for direct fetches and embedded-PM Git installs. Enforce effective URL-scoped TLS settings, preserve explicit environment precedence/empty-file failure and contiguous retained CApath hash lookup, and keep Bun trust semantics distinct.
5. Retain native Ed448 coverage, malformed-input failure and all incident-key exclusions. Complete the peer-served incident fixture chains without changing client trust, request bounds or zero-HTTP assertions.
6. Run focused real TLS/JVM regressions and the mandatory repository check. Require exact-head hosted checks, native package qualification and fresh Codex reviews before root coordinates v0.7.4 through GitHub Releases.
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

Additional targeted JVM regression reproduced after the draft was opened: secureJavaTrustStore deletes the committed valid Ed448 CA because trustedCertificates intentionally omits algorithms unavailable to Bun. Real Java17 CertificateFactory/self-signature verification succeeds (EdDSA/Ed448), and a private real-keytool store imports the CA successfully but loses it after filtering. A blocked-only predicate for the JVM is proposed; Bun TLS omission/fail-closed policy must stay unchanged. Root notified; production source remains frozen pending that decision.

Root approved and implementation now includes the demonstrated Java/native Git Ed448 and embedded-PM Git fixes. One canonical 12-key denylist and key extractor serve both modes. Native mode uses a bounded DER SubjectPublicKeyInfo fallback only for Bun's specific unsupported-public-key decode error; malformed certificates/SPKI throw. Bun mode retains its existing unsupported-key omission and empty-store fail-closed behavior.

The real JVM regression failed before the fix because the valid Ed448 alias disappeared; it passes after the blocked-key-only filter. Java independently verified the fixture's EdDSA/Ed448 self-signature. Direct native Git retains the Ed448 private CA on Linux; other backends keep the existing private-RSA/incident checks because their Ed448 algorithm support is not assumed.

Actual Groma installDependencies mutation proof: a username-scoped Git sslVerify=false previously allowed one authenticated HTTP request through a compromised chain while the control made zero. The install-only key-name query now adds strict indexed child overrides for the exact effective TLS keys; both incident paths make zero HTTP requests, the private-CA/authentication positive reaches the fixture with its original Bearer header, and normal private-registry tarball installation succeeds when Git is absent. No Git configuration file or parent environment is mutated and key contents are not passed as command arguments.

Focused final tests: 14 trust/JVM tests passed with 204 assertions; changed-file lint and typecheck passed. First-head CI Linux reached an inconclusive 15-second native TLS handshake stall without an authenticated request or a proved certificate rejection; Windows/macOS passed that same native probe. Source, TLS assertions and request bounds were not relaxed. The new source head will repeat the exact hosted gate; no old-head retry or release publication was attempted.

Final native Git compatibility controls reproduced two additional regressions from the original override: raw Bun using Git-only global or URL CAfile reached the private fixture while Groma did not; raw Git using environment or URL hashed CApath reached the fixture while Groma did not. One shared native Git helper now preserves CAfile/CApath mappings independently, in original configuration order, with explicit environment precedence. Direct fetches resolve only their actual URL, so an irrelevant unreadable CAfile does not break them. PM installations retain scoped mappings for unknown nested Git dependency URLs.

CApath filtering preserves the original contiguous hash chains, removes blocked certificates and renumbers retained entries without gaps. The actual private-CA regression has blocked hash.0 and retained hash.1, plus ignored non-certificate/CRL files. Explicit empty CAfile is distinguished from absence and fails closed: raw Git made zero requests with an empty CAfile plus valid private CApath, while the earlier helper incorrectly reached the server. Both direct/PM regressions now assert zero requests for that case.

Final focused suite passed 15 trust/JVM tests and 246 assertions. Changed-file lint and typecheck pass; new functions remain below complexity 15. Windows cases explicitly exercise inherited mixed-case Git bypass, CAfile and count spellings while retaining the original authentication index. The helper clears only inherited spellings for keys it overrides.

The served incident fixture chains now append their already committed public self-signed ECC/AAA roots. This changes peer-supplied chains only: client trust, zero-HTTP rejection assertions and request bounds are unchanged. Unpatched Bun 1.4.3 with the explicit incident roots still accepts each complete chain (HTTP 200 and one request), preserving the unsafe baseline control. Prior Linux and independent Windows handshake stalls are consistent with issuer discovery; that attribution remains an inference. Final hosted gates must prove rejection on this source head.

Final Windows regression uses lower-case-only inherited Git CAfile/count/bypass inputs, preserving the original indexed authentication header. Windows-only reads honor native case-insensitive names; final child overrides clear only equivalent spellings of keys they replace. Final focused trust/JVM suite passed 15 tests/246 assertions, changed-file lint and typecheck passed. Mandatory check is being repeated on the frozen source; hosted exact-head checks and Codex reviews remain pending. No release was retried or published.

Root's fresh targeted review found two concrete native Git precedence gaps. Actual Git control confirms inherited GIT_CONFIG_PARAMETERS overrides indexed sslVerify=true. Direct URL-selected CAs were sanitized into generic settings, leaving original URL-specific raw CAs with higher priority. Add actual direct/embedded-install incident-negative regressions for URL-scoped CA bundles and opaque PARAMETERS with private-CA/auth positives; indexed-only/private-positive coverage did not detect either incorrect result. Root authorized appending sanitized pairs to preserved PARAMETERS and selecting direct-URL filtered CAs through child environment.

The targeted precedence regressions failed before correction: direct URL-scoped CAfile and opaque PARAMETERS in direct/actual embedded-PM installation each allowed one incident HTTP request; PM per-key URL CAfile control already rejected. Corrected native Git selection uses the filtered CA environment for its known URL and appends the same filtered CA/TLS pairs after inherited opaque PARAMETERS using Git shell quoting, without parsing or replacing original auth/proxy parameters. Four real HTTPS regression cases now reject both incident paths with zero requests and retain private-CA/authentication positives, including apostrophe-containing CA paths and lower-case-only Windows PARAMETERS input. Final focused trust/JVM suite passes19 tests/280 assertions; typecheck, changed-file lint and diff checks pass. Mandatory repository check is repeated on this corrected source; exact-head hosted/Codex gates will restart. No release retry/publication.

Final PARAMETERS encoding quotes key and value separately, preserving usernames containing '=' without ambiguous first-equals parsing. The actual PM fixture includes a raw private=fixture username, mixed old/new inherited parameter formats, a CAfile path containing an apostrophe, and unchanged authentication. Hosted33776061 Linux/mac suites each had956pass/1fail at the private-positive fixture because its inherited CI GIT_SSL_CAINFO correctly outranked Git-config-only private trust. Setting a public GIT_SSL_CAINFO locally reproduced that exact failure; explicitly clearing inherited CAINFO/CAPATH in this isolated fixture fixes it without changing production precedence. The full19-test/280-assertion trust/JVM suite now passes with that public parent CA setting present. Typecheck, lint and diff checks pass; exact-head hosted checks remain required.

Root's targeted pre-checkout CI review found the same Git environment precedence gap in all three inline workflow bootstraps: inherited NO_VERIFY was unchecked and strict settings were generic/indexed only. Extend existing real bootstrap tests with actual Git URL-scoped/PARAMETERS/auth controls and false/empty/mixed-case NO_VERIFY rejection. Fix only these public-repository CI paths: fail closed before exports and append exact credential-free repository plus .git strict pairs through both Git configuration channels, preserving inherited authentication and proxy settings.

All three actual inline bootstrap regressions failed before the fix with native Git returning sslVerify=false despite indexed strict settings. After correction,19 trust/JVM tests pass340 assertions, including141 assertions in the three bootstrap cases: exact repository/.git verification and Schannel strictness, preserved indexed/opaque authentication, and false/empty/mixed-case NO_VERIFY rejection before any GITHUB_ENV export. Canonical inherited counts are bounded and exported values reject CR/LF. Typecheck, changed-file lint and diff checks pass. Source f763 hosted Linux/mac suites completed SUCCESS; Windows and Codex remain pending, and the final workflow-only correction requires current-head checks. Mandatory command is repeated on the final bootstrap source.

Codex P2 is confirmed by actual raw-Bun versus Groma npm-only install: raw exits0 while Groma throws ENOENT reading unrelated URL-scoped CAfile. Root approved only PM unknown-URL scoped CAfile failures mapping to an owned empty CAfile under the same config key; direct/explicit/global policies stay eager fail-closed. Extend existing registry install regression and add actual PM Git selected-invalid coverage with a positive default-trust control proving the same loopback leaf is trusted. Add explicit leaf-validity guards at shared loopback fixture creation and separate native probe so future expiry cannot make incident-zeroHTTP assertions pass falsely.

Codex P2 regression failed before correction in both real tarball installation and selected-invalid PM Git cases. Only unknown-URL scoped CAfile failures now map the same key to an owned empty CAfile; direct URL, generic/global settings and explicit CA environment still fail eagerly. Actual PM Git default-trust control reaches the private HTTPS server, while selecting missing, empty or malformed scoped CAfile then sends zero HTTP requests and reports a native Git failure. Unrelated npm installation succeeds and re-downloads its tarball from a fresh cache. All loopback server creation now asserts current leaf validity, including separate .NET probe setup. Focused20trust/JVM tests pass353 assertions under CI-like parent CA environment; typecheck, lint, CJS syntax and diff checks pass. Latest exact-head hosted reviews/build qualification remain release gates.

Fresh sibling control confirms bulk git config --path expansion aborts npm-only installation on an unrelated nonexistent ~user CApath before scoped containment. Native --file - --path --default VALUE --get groma.path performs exact Git expansion per value and ignores inherited command-scope overrides in both tested configuration channels. Root approved raw bulk enumeration plus this fixed-key native per-entry query inside existing scoped-CAfile failure containment; direct URL selection remains unchanged. Extend actual regressions with unrelated/selected nonexistent ~user and valid ~/private CA selection.

The native-path-expansion regressions failed before correction. PM enumeration now reads raw values; each fixed-key native --file - --null --path --default VALUE query expands its own path inside scoped containment, ignoring inherited command-scope overrides. Actual ~/default.pem private CA selection succeeds; unrelated nonexistent ~user does not block fresh-cache npm tarball installation; selecting the invalid scope still sends zero requests despite default trust accepting the peer. Focused20trust/JVM tests pass360 assertions under CI-like parent CA environment, typecheck/lint/diffcheck pass, testfile489lines. The preceding mandatory attempt finished893pass/62skip/29knownenvironmentfail after lint/type/24Node pass; repeat final command on this corrected source. Final3OS CI and exact-head reviews remain required.

Fresh exact-head reviews confirmed analogous unrelated scoped CApath abort and a separate HTTPS-proxy trust gap. Actual Groma direct/PM proxy controls send one CONNECT plus fake proxy authentication through both incident chains. A private-only proxy CAfile still accepts the emudhra path via libcurl's separate system proxy CApath, which Git cannot override. Root approved a temporary material restriction: owned empty GIT_PROXY_SSL_CAINFO makes all native Git HTTPS proxies fail closed, including valid private proxies; direct HTTPS and HTTP CONNECT proxies retain origin verification/authentication. No proxy resolver, relay or CAfile-only mitigation claim. Combine only scoped unknown-PM CApath failure mapping to owned empty directory, retaining eager known/global/env handling, and prove actual transport controls.

Hosted Action Ubuntu Git2.55/GnuTLS disproved the initial empty-proxy-file guard: an empty trust file returns zero imported anchors then still loads proxy CApath. Do not publish that candidate. The corrected guard creates an owned regular marker file and points GIT_PROXY_SSL_CAINFO at its impossible child unavailable.pem, producing a native CA-loader error before proxy requests; Windows aliases receive the same guard. Shared Groma and all three public bootstraps use it. Focused native controls preserve strict raw acceptance for private/both incident proxies with explicit Schannel CAinfo=true, then actual direct/PM calls (including HTTP origins) inherit false and must force strict handling and send zero requests/authentication. HTTP CONNECT/direct private-origin authentication positives pass. Unknown-PM unrelated missing/~user CApath now permits actual npm tarball installation; a selected missing directory retains additive default CAfile trust, whereas selected invalid ~user still fails inside native Git expansion with zero requests. Local trust/JVM suite22pass/506 assertions, typecheck and targeted lint pass; current hosted all-OS and Codex gates must qualify the corrected candidate.
<!-- SECTION:NOTES:END -->
