---
id: TASK-626
title: Preserve native Git CA directory layouts
status: In Progress
assignee: []
created_date: '2026-10-21T17:47:00Z'
updated_date: '2026-10-21T17:53:00Z'
labels: []
dependencies: []
references:
  - src/scanner/modules/git-trust.ts
  - test-bun/certificate-trust.test.ts
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
Keep the existing contiguous hash-chain filter and preserve filtered ordinary PEM files under their original directory names. Compare actual GnuTLS and OpenSSL requests for private and compromised chains; the existing hash-only tests miss the supported GnuTLS layout.
<!-- SECTION:PLAN:END -->
