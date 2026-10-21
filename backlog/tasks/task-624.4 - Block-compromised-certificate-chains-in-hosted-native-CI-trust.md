---
id: TASK-624.4
title: Block compromised certificate chains in hosted native CI trust
status: In Progress
assignee:
  - '@native-scanners'
created_date: '2026-10-21T11:25:00Z'
updated_date: '2026-10-21T11:44:00Z'
labels: []
dependencies: []
references:
  - >-
    https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/windows/windows-vm-imds-certissues
  - >-
    https://github.com/apple-oss-distributions/Security/blob/main/SecurityTool/macOS/security.c
  - 'https://docs.github.com/en/actions/reference/workflows-and-actions/variables'
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
- [ ] #1 Hosted runner trust mitigation refuses consumer or self-hosted environments and blocks the known compromised signing keys through native OS trust settings
- [ ] #2 A default .NET HttpClient probe rejects both incident authentication paths while ordinary NuGet HTTPS remains available, with actual platform execution recorded
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
1. Derive affected SPKI keys and public certificate variants from the incident fixture. 2. Apply bounded Windows Disallowed or macOS administrative deny settings only in GitHub-hosted runners. 3. Exercise original incident chains against a localhost HTTPS fixture with default .NET TLS, then verify the normal registry. 4. Require Windows and macOS CI execution before release.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented a hosted-only native OS mitigation and a genuine .NET TLS probe. The entrypoint refuses both non-GitHub and self-hosted environments before creating temporary files or changing trust. Windows matches certificate SPKI SHA-256 values in LocalMachine and CurrentUser Root/CA stores, removes all affected keys, and installs all 20 known public variants (12 signing keys) into LocalMachine Disallowed with presence checks. macOS uses 30-second bounded noninteractive administrative deny settings for those exact variants; it does not alter the read-only system root keychain. All mutation is confined to disposable GitHub-hosted runners.

The dependency-free net10 probe restores/builds offline from installed framework packs, then uses default HttpClient TLS with proxies disabled for loopback incident servers. Both affected eMudhra and AAA authentication paths must fail with AuthenticationException before any HTTP request. Normal NuGet HTTPS must still return success. Fixtures reuse the existing test-only server private key, contain no intermediate private keys and are valid for localhost/127.0.0.1 through 2027-10-01.

Local Linux evidence: exact script passes with filtered SSL_CERT_FILE and an empty SSL_CERT_DIR; both incident handshakes reject and ordinary NuGet HTTPS succeeds. Original-root controls authenticate both fixture chains, proving the fixture signatures and local transport work. node --check passes for both helpers; git diff --check is clean. Biome excludes CJS helper paths by existing repository configuration, so no claim of Biome coverage is made for them.

Windows/macOS native command execution and genuine .NET rejection are still REQUIRED CI RELEASE GATES, not locally proven. The task remains In Progress with acceptance criteria unchecked until those hosted jobs succeed. Parent task owns workflow wiring after setup-node/setup-dotnet and before native package restore. The macOS trust command is bounded and any command error/timeout fails the job rather than proceeding with unproven trust.

Review correction: native OS distrust now runs immediately after checkout and patched Node, BEFORE setup-dotnet, Swift and other native installer actions. The default .NET HTTPS probe is a separate post-SDK workflow step, so the SDK installer itself cannot run through an unmitigated native store. The helper no longer invokes the probe itself. Windows/macOS execution remains the same required gate.
<!-- SECTION:NOTES:END -->
