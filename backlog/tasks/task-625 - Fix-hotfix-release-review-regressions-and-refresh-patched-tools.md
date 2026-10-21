---
id: TASK-625
title: Fix hotfix release review regressions and refresh patched tools
status: In Progress
assignee:
  - '@groma-hotfix'
created_date: '2026-10-21T14:16:00Z'
updated_date: '2026-10-21T19:16:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/jvm-package.ts
  - test-bun/jvm-trust.test.ts
  - plugins/scanners/go/build.ts
  - .github/workflows/release.yml
  - package.json
  - scripts/scanner-release.ts
  - test-bun/scanner-release.test.ts
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
  - test-bun/git-rewrite-trust.test.ts
  - src/work/backlog-cli.ts
  - test/fixtures/certificate-trust/other-registry-ca.pem
  - test/fixtures/certificate-trust/other-registry-server.pem
  - test-bun/npm-trust.test.ts
  - test-bun/scanner-release.test.ts
priority: high
type: bug
ordinal: 695000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Preserve source Java trust stores and native private CA policies while excluding compromised certificate keys. Refresh patched build tools and improve scanner release preparation.
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
Scanner release preparation recognizes an existing exact npm version supplied as either a string or a single-element string array. Mismatched, ambiguous and malformed output remains an error. The release test covers these response forms because an existing contract must be reused without attempting publication, while unexpected metadata must stop publication.
<!-- SECTION:PLAN:END -->
