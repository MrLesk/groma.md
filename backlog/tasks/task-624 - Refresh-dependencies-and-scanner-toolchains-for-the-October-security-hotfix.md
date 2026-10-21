---
id: TASK-624
title: Refresh dependencies and scanner toolchains for the October security hotfix
status: Done
assignee:
  - '@groma-hotfix'
created_date: '2026-10-21T10:51:00Z'
updated_date: '2026-10-21T17:51:00Z'
labels: []
dependencies: []
references:
  - package.json
  - bun.lock
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
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
  - scripts/check-native-tls.cjs
priority: high
type: chore
ordinal: 690000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Refresh application dependencies, scanner toolchains and CI actions, and exclude compromised certificate keys from package installation and build downloads.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The embedded package-manager TLS path rejects the published compromised-intermediate test chains, including cross-signed paths
- [x] #2 Root and scanner dependencies, native toolchains, and workflow actions are audited and updated to current compatible releases, with any held versions explained
- [x] #3 Required repository checks and scanner packaging validation pass before release
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
