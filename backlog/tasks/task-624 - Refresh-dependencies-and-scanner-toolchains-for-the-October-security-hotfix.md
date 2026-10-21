---
id: TASK-624
title: Refresh dependencies and scanner toolchains for the October security hotfix
status: In Progress
assignee:
  - '@groma-hotfix'
created_date: '2026-10-21T10:51:00Z'
updated_date: '2026-10-21T12:08:00Z'
labels: []
dependencies: []
references:
  - package.json
  - bun.lock
  - .github/workflows
  - plugins/scanners
modified_files:
  - package.json
  - plugins/scanners/angular/package.json
  - plugins/scanners/react/package.json
  - plugins/scanners/typescript/package.json
  - plugins/scanners/vue/package.json
  - bun.lock
  - src/certificate-trust.ts
  - src/scanner/modules/package-trust.ts
  - src/scanner/modules/package-manager.ts
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
  - test/fixtures/certificate-trust/compromised-cas.json
  - test/fixtures/certificate-trust/registry-ca.pem
  - test/fixtures/certificate-trust/registry-server.pem
  - test/fixtures/certificate-trust/registry-server-key.pem
  - test-bun/certificate-trust.test.ts
  - scripts/prepare-bun-runtime.cjs
  - scripts/build.ts
  - src/scanner/modules/package-name.ts
  - src/scanner/modules/published.ts
  - src/scanner/modules/inventory.ts
  - src/scanner/modules/package.ts
  - src/viewers/web/settings/plugins.ts
  - src/work/backlog-cli.ts
  - plugins/scanners/javascript/package.json
  - plugins/scanners/java/package.json
  - plugins/scanners/kotlin/package.json
  - plugins/scanners/scala/package.json
  - plugins/scanners/cobol/package.json
  - plugins/scanners/nasm/package.json
  - plugins/scanners/ada/package.json
  - plugins/scanners/c/package.json
  - plugins/scanners/cpp/package.json
  - plugins/scanners/mojo/package.json
  - plugins/scanners/mql5/package.json
  - AGENTS.md
  - scripts/prepare-hosted-runner-trust.cjs
  - test/fixtures/certificate-trust/README.md
  - test/fixtures/certificate-trust/unsupported-key-ca.pem
priority: high
type: chore
ordinal: 690000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The eMudhra CA compromise exposes the embedded Bun package manager and development/build tools. Refresh all dependency ecosystems and CI to current supported releases, resolve breaking changes, and verify scanner behavior before publishing one hotfix PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The embedded package-manager TLS path rejects the published compromised-intermediate test chains, including cross-signed paths
- [x] #2 Root and scanner dependencies, native toolchains, and workflow actions are audited and updated to current compatible releases, with any held versions explained
- [ ] #3 Required repository checks and scanner packaging validation pass before release
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inventory current and latest npm, native scanner, runtime, and action versions. 2. Upgrade latest stable releases and resolve API changes; preserve justified prerelease or API compatibility constraints. 3. Mitigate Bun certificate trust through its actual package-manager path and confirm published chains fail. 4. Run repository checks, native packaging checks, audits, and review one PR before releasing.

Security regression coverage: existing scanner installation tests exercise registry/auth on plain HTTP but cannot catch compromised CA acceptance. Add tests that remove every published compromised key/cross-sign while preserving a clean private CA, honor documented CA override precedence and relative paths, and exercise both real HTTPS metadata lookup and tarball installation through the product package-manager wrapper. Run the pre-checkout CI trust bootstrap against the same public certificate chains.

The runtime Git scanner fetch is another outbound HTTPS path found during source audit. Existing registry tests cannot detect Git accepting an incident-signed chain. Extend the certificate-trust fixture with a Git fetch against the actual incident leaf/chain: it must fail before any HTTP request, while the clean private CA still permits the request. No source-inventory assertion or consumer OS-store mutation is needed.

The external npm Backlog installer must keep npm global CA configuration authoritative. Existing trust regressions cover Bun and Git, not npm global installation. Add one real private-HTTPS npm install with NPM_CONFIG_CAFILE while the project has an unrelated blocked Bun CA; the package must install globally into a temporary prefix. This detects incorrectly reusing Bun/project CA selection for npm.

Hosted Windows regression: retain only CAs with keys Bun can decode, dropping the explicit unsupported-public-key error while preserving other failures; cover a real Ed448 CA and fail-closed empty stores. Fix release Windows ARM64 latest Microsoft JDK setup through its verified official archive because the action manifest is stale.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency refresh: npm audit returns zero known advisories with the updated lock, including source-map-js 1.2.2. Native OSV coverage includes 222 current Rust/Go/Pub/NuGet versions (zero matches), and current JVM graph has 132 Maven coordinates with no shipped findings; latest sbt 2.0.11 retains three build-only interactive JLine regex DoS advisories. Latest Biome 2.6.0/2.6.1 platform CLI packages return registry404, so retain the latest complete 2.5.15. Root/native TypeScript uses current 7.1.0-beta (required Bun typed import attributes and native scanner SDK); classic JavaScript/Angular/React/Vue compiler integrations retain 6.0.3 because stable7 removes their API. Microsoft Windows ARM64 JDK is latest available25.0.4.1, with a verified sanitized trust store; other targets use27. Bun latest stable1.4.3 remains upstream affected by CA trust and Brotli CVE-2026-111497: application PM receives a filtered CA bundle, engine fetches disable compression, and compile targets come from checksummed Node26.12.1 downloads. Bun PM itself still advertises Brotli and has no supported disable switch; this vendor limit remains explicit. Runtime-owned Git and external Backlog installers also receive scoped filtered trust; registry/auth/proxy settings remain delegated to tools. Browser export/startup regressions from server TLS imports were fixed by separating the shared package-name validator (8 focused tests pass). Local standalone compilation passes. Compiled PM reproducer rejects both eMudhra and AAA cross-sign local registries for metadata and tarballs while baseline Bun accepts both (8 probes). Seven checked-in trust regressions pass125assertions. Full checks are in progress with all native artifacts; local ps-based watcher liveness tests cannot be trusted because /proc lists outer namespace PIDs while process.pid reports the inner namespace. Hosted CI remains the cross-platform gate. CI bootstrap protects action network calls; runner action archive downloads occur before these steps and remain GitHub-host responsibility.

Final implementation review: native Bun1.4.3 probes proved cafile paths resolve from the package-manager working directory, and cafile takes precedence over inline ca across configuration files. Resolver and regression tests now match those native behaviors. A real Git HTTPS regression exposed that any present GIT_SSL_NO_VERIFY value disables verification, including false; the child environment now omits that variable. Both incident Git authentication paths reject before HTTP, and a clean configured private CA reaches the test repository. Eight trust tests pass136assertions. User release workflow requirement is documented in AGENTS.md: create a GitHub Release first; the existing workflow sets/syncs root package.json from its tag. Root version remains0.7.2 until v0.7.3 release; separate changed scanner package versions are bumped and lock metadata refreshed. Cold simplicity review passes. Genuine hosted Windows/macOS .NET trust helpers and probes are implemented and wired before restore; their native platform executions remain release gates. Final mandatory repository check and full-context review are in progress. DraftPR: https://github.com/MrLesk/groma.md/pull/174. The exact reviewed C++ WASM was uploaded separately through GitHub UI because its base64 payload exceeds the connector16MiB limit; remote blob matches local2c997f4dfa78bbeca9068dcd669d044b50a571c0.

Hosted review corrections: include Node bundled rootCertificates before filtering, because --use-openssl-ca can leave the default/macOS store without public roots; this caused an actual macOS setup-node issuer failure. Apply native OS distrust before SDK installers, with a separate default .NET TLS probe after SDK setup. Shared Git child configuration enables Schannel CA-bundle use; the known scanner fetch also has exact-URL verification/Schannel overrides. Explicitly user-configured TLS opt-outs on arbitrary nested Git URLs are outside this mitigation guarantee; no universal Git config rewrite is added. External npm installation now reads only npm global ca/cafile settings through its native CLI, preserving NPM_CONFIG_CAFILE and ignoring unrelated project Bun trust; a real private-HTTPS global npm installation passes. Nine trust tests pass138assertions. The latest combined repository check passed24Node+949Bun tests; only two unchanged ps-based liveness checks fail because this environment exposes outer namespace /proc PIDs. All Java artifact setup failures are resolved. Final rerun and hosted Windows/macOS gates remain.

Hosted b983d7f Linux and macOS mandatory checks pass:24Node+952Bun/22skip/0fail, C#31pass, standalone builds and fresh-checkout packages. Native default .NET HTTPS rejects both eMudhra and AAA fixture paths on all3OS; normal NuGet HTTPS succeeds. Windows then exposed a real Bun platform-store key decoding failure during COBOL download. A valid Ed448 CA reproduces the identical PUBLIC_KEY_DECODE_ERROR locally. Filtering now omits only that explicit unusable-key error, retains strict handling of malformed/other failures, and an all-unsupported store fails closed before network.10trust regressions/142assertions, TypeScript and changed-file Biome pass. Release-only WindowsARM64 exposed the setup-java Microsoft manifest lagging official25.0.4.1; native agent is switching to the checksum-verified official archive without downgrading. Final hosted gates remain required.

Gate fixes validated: latest local mandatory bun run check passes lint, TypeScript,24Node and951Bun tests/22skips; only the two unchanged PID-namespace ps-based liveness failures remain, matching prior independently verified environment behavior (975tests total). No disk-space failures occurred. Windows unsupported-key fixture passes10trust tests/142assertions. WindowsARM64 release setup now downloads official Microsoft25.0.4.1 through patched Node, verifies SHA2567118ce03f24d4460c5d4ccaae03a2c695a83cd3e48686fe9bbf3b34166dce588, and supplies setup-java jdkfile to bypass its stale manifest. Strict YAML, inline Node syntax and7 mocked download/security-path probes pass. Hosted native-trust subtask624.4 is Done from actual Linux/macOS/Windows default .NET probe evidence. Final hosted fullchecks and five release platforms remain required.
<!-- SECTION:NOTES:END -->
