---
id: TASK-624.4
title: Block compromised certificate chains in hosted native CI trust
status: Done
assignee:
  - '@native-scanners'
created_date: '2026-10-21T11:25:00Z'
updated_date: '2026-10-21T17:53:00Z'
labels: []
dependencies: []
references:
  - >-
    https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/windows/windows-vm-imds-certissues
  - >-
    https://github.com/apple-oss-distributions/Security/blob/main/SecurityTool/macOS/security.c
  - https://docs.github.com/en/actions/reference/workflows-and-actions/variables
modified_files:
  - scripts/prepare-hosted-runner-trust.cjs
  - scripts/check-native-tls.cjs
  - test/fixtures/certificate-trust/incident-server-emudhra.pem
  - test/fixtures/certificate-trust/incident-server-aaa.pem
  - test/fixtures/certificate-trust/README.md
parent_task_id: TASK-624
priority: high
type: bug
ordinal: 694000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Protect Windows and macOS hosted scanner build jobs whose native .NET TLS trust does not use PEM environment overrides. Change only ephemeral GitHub-hosted runner trust and verify genuine HTTPS rejection before NuGet restore.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hosted runner trust mitigation refuses consumer or self-hosted environments and blocks the known compromised signing keys through native OS trust settings
- [x] #2 A default .NET HttpClient probe rejects both incident authentication paths while ordinary NuGet HTTPS remains available, with actual platform execution recorded
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
