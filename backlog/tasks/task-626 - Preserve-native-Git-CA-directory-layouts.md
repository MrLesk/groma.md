---
id: TASK-626
title: Preserve native Git CA directory layouts
status: In Progress
assignee: []
created_date: '2026-10-21T17:47:00Z'
updated_date: '2026-10-21T18:26:00Z'
labels: []
dependencies: []
references:
  - src/scanner/modules/git-trust.ts
  - test-bun/certificate-trust.test.ts
  - .github/workflows/architecture.yml
  - src/certificate-trust.ts
  - CONTRIBUTING.md
modified_files:
  - src/scanner/modules/git-trust.ts
  - test-bun/git-ca-directory.test.ts
  - >-
    backlog/tasks/task-624 -
    Refresh-dependencies-and-scanner-toolchains-for-the-October-security-hotfix.md
  - >-
    backlog/tasks/task-625 -
    Fix-hotfix-release-review-regressions-and-refresh-patched-tools.md
  - >-
    backlog/tasks/task-624.1 -
    Update-native-scanner-dependencies-and-toolchains-for-the-security-hotfix.md
  - >-
    backlog/tasks/task-624.2 -
    Audit-and-refresh-packaged-parser-engines-for-the-security-hotfix.md
  - >-
    backlog/tasks/task-624.3 -
    Migrate-the-TypeScript-scanner-to-the-current-native-SDK-beta.md
  - >-
    backlog/tasks/task-624.4 -
    Block-compromised-certificate-chains-in-hosted-native-CI-trust.md
  - .github/workflows/architecture.yml
  - src/certificate-trust.ts
  - test/fixtures/certificate-trust/trusted-registry-ca.pem
  - test/fixtures/certificate-trust/rejected-registry-ca.pem
  - test/fixtures/certificate-trust/trusted-compromised-cas.pem
  - test-bun/certificate-trust.test.ts
  - CONTRIBUTING.md
priority: high
type: bug
ordinal: 696000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Git installations using GnuTLS accept ordinary PEM filenames in CA directories. Filtering only OpenSSL hash entries removes valid configured private authorities and prevents scanner installation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Configured ordinary PEM authorities remain usable by native Git backends that support them, while compromised keys remain excluded.
- [ ] #2 OpenSSL hash lookup, original gaps, CAfile selection and revocation files retain their native policy.
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
Preserve filtered ordinary PEM and OpenSSL trusted-PEM blocks, their auxiliary trust or rejection attributes, and revocation lists under original names. Compact whole files only within the original hash prefix, retain native empty regular hash slots, and preserve original gaps and later names. Ignore dangling directory entries and skip malformed ordinary sidecar certificates while retaining extracted CRLs; malformed certificate-bearing hash entries and CAfiles remain strict failures. Native Git regression coverage compares private authorities, compromised authorities, trusted-PEM purposes and native directory layouts across direct and package-manager flows. Architecture CI uses the pinned Action, current Node runtime and the latest published Groma and Backlog CLIs.
<!-- SECTION:PLAN:END -->
