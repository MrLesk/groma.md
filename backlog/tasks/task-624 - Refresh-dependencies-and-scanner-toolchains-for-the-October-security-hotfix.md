---
id: TASK-624
title: Refresh dependencies and scanner toolchains for the October security hotfix
status: In Progress
assignee:
  - '@groma-hotfix'
created_date: '2026-10-21T10:51:00Z'
updated_date: '2026-10-21T11:23:00Z'
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
- [ ] #1 The embedded package-manager TLS path rejects the published compromised-intermediate test chains, including cross-signed paths
- [ ] #2 Root and scanner dependencies, native toolchains, and workflow actions are audited and updated to current compatible releases, with any held versions explained
- [ ] #3 Required repository checks and scanner packaging validation pass before release
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
1. Inventory current and latest npm, native scanner, runtime, and action versions. 2. Upgrade latest stable releases and resolve API changes; preserve justified prerelease or API compatibility constraints. 3. Mitigate Bun certificate trust through its actual package-manager path and confirm published chains fail. 4. Run repository checks, native packaging checks, audits, and review one PR before releasing.

Security regression coverage: existing scanner installation tests exercise registry/auth on plain HTTP but cannot catch compromised CA acceptance. Add tests that remove every published compromised key/cross-sign while preserving a clean private CA, honor documented CA override precedence and relative paths, and exercise both real HTTPS metadata lookup and tarball installation through the product package-manager wrapper. Run the pre-checkout CI trust bootstrap against the same public certificate chains.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency refresh: npm audit returns zero known advisories with the updated lock, including source-map-js 1.2.2. Native OSV coverage includes 222 current Rust/Go/Pub/NuGet versions (zero matches), and current JVM graph has 132 Maven coordinates with no shipped findings; latest sbt 2.0.11 retains three build-only interactive JLine regex DoS advisories. Latest Biome 2.6.0/2.6.1 platform CLI packages return registry404, so retain the latest complete 2.5.15. Root/native TypeScript uses current 7.1.0-beta (required Bun typed import attributes and native scanner SDK); classic JavaScript/Angular/React/Vue compiler integrations retain 6.0.3 because stable7 removes their API. Microsoft Windows ARM64 JDK is latest available25.0.4.1, with a verified sanitized trust store; other targets use27. Bun latest stable1.4.3 remains upstream affected by CA trust and Brotli CVE-2026-111497: application PM receives a filtered CA bundle, engine fetches disable compression, and compile targets come from checksummed Node26.12.1 downloads. Bun PM itself still advertises Brotli and has no supported disable switch; this vendor limit remains explicit. Runtime-owned Git and external Backlog installers also receive scoped filtered trust; registry/auth/proxy settings remain delegated to tools. Browser export/startup regressions from server TLS imports were fixed by separating the shared package-name validator (8 focused tests pass). Local standalone compilation passes. Compiled PM reproducer rejects both eMudhra and AAA cross-sign local registries for metadata and tarballs while baseline Bun accepts both (8 probes). Seven checked-in trust regressions pass125assertions. Full checks are in progress with all native artifacts; local ps-based watcher liveness tests cannot be trusted because /proc lists outer namespace PIDs while process.pid reports the inner namespace. Hosted CI remains the cross-platform gate. CI bootstrap protects action network calls; runner action archive downloads occur before these steps and remain GitHub-host responsibility.
<!-- SECTION:NOTES:END -->
