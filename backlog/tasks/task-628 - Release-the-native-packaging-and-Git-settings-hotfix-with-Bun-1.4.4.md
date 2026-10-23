---
id: TASK-628
title: Release the native packaging and Git settings hotfix with Bun 1.4.4
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-23T17:56:00Z'
updated_date: '2026-10-23T18:07:00Z'
labels: []
dependencies: []
references:
  - scripts/prepare-bun-runtime.cjs
  - src/scanner/modules/package.ts
  - src/scanner/modules/package-manager.ts
  - src/certificate-trust.ts
  - .github/workflows/release.yml
  - 'https://github.com/MrLesk/groma.md/pull/178'
modified_files:
  - scripts/prepare-bun-runtime.cjs
  - package.json
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
  - CONTRIBUTING.md
  - bun.lock
  - test-bun/git-proxy-trust.test.ts
  - src/scanner/modules/package.ts
  - src/scanner/modules/package-manager.ts
  - src/certificate-trust.ts
  - src/work/backlog-cli.ts
  - src/scanner/modules/git-trust.ts
  - test-bun/git-ca-directory.test.ts
  - test-bun/git-rewrite-trust.test.ts
  - test-bun/certificate-trust.test.ts
  - docs/scanners/setup.md
priority: high
type: bug
ordinal: 698000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Groma 0.7.6 embeds Bun 1.4.3 and changes native Git certificate and proxy policy. Alex approved one coordinated hotfix containing PR178, a patched bundled runtime and build tools, native Git configuration ownership, three-platform CI and an Action update.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Groma-owned native executables and workflows use Bun1.4.4 with verified target archives and current available patch releases of existing build tools.
- [ ] #2 Direct Git scanner installation and Git dependencies of scanner packages retain inherited Git CA, verification, proxy, rewrite and authentication settings.
- [ ] #3 Groma-owned downloads retain their certificate checks and npm installation keeps PR178 older-Node and Rosetta behavior.
- [ ] #4 Relevant regressions and full CI pass on Windows Linux and macOS before one full hotfix release; the Action is then updated and released.
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
Update verified Bun runtime pins and existing build tool patches without bumping the root release version manually. Remove native Git trust interception and collapse its obsolete policy tests; the embedded package manager keeps its own certificate policy without passing CA overrides into Git. Regression authority: Alex explicitly requires native Git settings. Existing tests demand blocking HTTPS proxies and filtering native trust; replace these with a paired raw-Git versus scanner test that reaches a private authenticated HTTPS proxy and preserves native CA behavior. This detects the current proxy block and unintended CA override. No new OKF or C4 concepts: package acquisition stays within the existing scanner module loader responsibility; Markdown and the architecture map remain unchanged. Run focused checks, one cold simplicity review, implementer specification/quality review, then full-context complexity review. Verify full cross-platform CI, merge with PR178, create one full release, and update the Action after publication.

Native verification coverage: Alex requires preserving Git verification settings. Extend the existing proxy fixture with one paired raw/direct/install case using a deliberately different CA and native sslVerify true versus false. It detects Groma replacing that setting or accidentally adding trust; existing proxy coverage only proves successful trusted transport.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cold simplicity review found no blockers. Accepted its two scoped suggestions: removed the exported native bundle mode and its obsolete assertions (Java key inspection remains), and corrected the Action bootstrap ownership comment. Focused trust verification after simplification: 14 tests pass across Git proxy/verification, registry CA handling, native npm and JVM trust. All eight Bun1.4.4 target digests match official release metadata; the final lockfile audit is empty. Biome/TypeScript existing tool pins already match their released patch lines; npm moves to12.2.1 and Bun types to1.4.4. No Bun runtime peer package exists in this lockfile. No architecture document ownership changes or new C4/OKF concepts are required.

Implementer specification review: runtime/archive pins and native Git policy criteria are implemented with direct regression evidence; consumer packaging remains PR178. Platform CI and coordinated publication remain gated steps, not claimed complete. Quality review: installScannerPackage calls native git with inherited env plus noninteractive prompting; registry work delegates to embedded Bun with explicit CA while scoped Node overrides do not affect Git. Existing cleanup removes temporary CA files. The new tests pair raw Git with both entry points using isolated private servers and auth, so a silent blocked connection or replaced verification setting fails. Deleted tests required the superseded Git policy. Changed flow has no new layer or dependency. Own CI trust is unchanged. Full repository checks are being rerun after final simplification.

Final local repository check passed with Bun1.4.4 and Node26.12.1: lint/type checks, 26 Node tests and 930 Bun tests passed, with63 optional skips and no failures. Full-context complexity review found no blocker; accepted the Action installation filter simplification in TASK-12. No source changes followed this final Groma check. PR178 hosted Windows and Linux checks pass; macOS packaged/standalone checks pass but an unrelated existing detach test hit a5s project-lock timeout. The identical detach scenario passed25 consecutive runs with its pinned Bun1.4.3, and full changed-source Bun1.4.4 suite passes. No timeout, assertion or CI retry policy was changed; the macOS job is being rerun to check for recurrence.
<!-- SECTION:NOTES:END -->
