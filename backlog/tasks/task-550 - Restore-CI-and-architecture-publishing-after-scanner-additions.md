---
id: TASK-550
title: Restore CI and architecture publishing after scanner additions
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-06 07:53'
updated_date: '2026-10-06 07:56'
labels:
  - ci
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/actions/runs/37378595962'
  - 'https://github.com/MrLesk/groma.md/actions/runs/37431665169'
  - cobol-src-index
documentation:
  - docs/viewers/web/index.md
modified_files:
  - test-bun/cobol-scanner.test.ts
  - .github/workflows/architecture.yml
priority: high
type: bug
ordinal: 634000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Recent main pushes fail Windows CI in the COBOL source-location test and block architecture publication at scanner readiness. The release workflow passed, but it does not run the same full Windows fixture path. A developer pushing main needs valid cross-platform checks and publication of the saved map. Alex requested all CI workflows repaired.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The existing COBOL source-location test passes with LF and CRLF checkout fixtures while retaining all source-position, COPY and call-evidence assertions.
- [ ] #2 Architecture publishing restores required scanner packages and exports the saved map without requiring unrelated source projects to be ready for a new scan.
- [ ] #3 Main CI passes on Linux, macOS and Windows, the main architecture workflow publishes successfully, and Release qualification passes with publishing disabled.
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
1. Reproduce the Windows COBOL failure using the existing test with CRLF checkout fixtures. Keep its source-position, COPY and call-evidence assertions unchanged.
2. Normalize fixture line endings before producing the test's deliberate CRLF source. The supported rule is original-source navigation with Windows line endings; the current test already covers it but creates CRCRLF on Windows. No new test or scanner behavior is needed.
3. Remove the scanner-readiness prerequisite from saved-architecture publication. Keep package restoration and export validation. The documented export contract reads committed architecture without running a scan; unrelated Java worker sources must not block it.
4. Run focused checks, bun run check, and implementer specification and quality reviews. Confirm no architecture-model or source-scanner semantics changed.
5. Commit and push only this task's changes. Verify main CI and architecture publication, then run Release qualification with publishing disabled. Classify optional comparison failures without changing other PR sources or restoring obsolete architecture formats.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced the exact Windows failure locally by running the existing COBOL test against a temporary CRLF fixture checkout: Cannot locate PROGRAM-ID name in original source. The fixture conversion created CRCRLF; only that conversion is changed, with all assertions retained. Architecture publication now follows the documented static-export contract and restores packages without requiring new-scan readiness. OKF documents and C4 model meaning are unchanged. Existing export tests and the actual publishing workflow provide validation; no source-text workflow test is added.

Focused validation passes: the existing COBOL test succeeds with both LF and CRLF checkout fixtures, and both static-export tests pass (4 tests, 92 assertions). The same CRLF reproduction failed before the fixture fix. No assertions were removed or changed, no retries or timeouts were added, and no scanner implementation changed. Full bun run check is running before the CI push.

Full bun run check passes: 16 Node tests, 764 Bun tests, 50 skipped, zero failures, and 2787 Bun assertions. Implementer specification review confirms LF/CRLF fixture parity and the documented export-without-scan contract. Quality review traced fixture copy -> CRLF conversion -> unchanged scanner assertions, and package restoration -> saved-map export -> deployment. The two fixes add no helper, dependency, retry, product behavior or architecture concept. A malformed Windows test input is corrected; scanner checks remain available for actual scans. The main publishing job still validates package installation and export, and optional PR comparison handling is unchanged. groma/ has no changes. Native CI and workflow execution are the remaining evidence.
<!-- SECTION:NOTES:END -->
