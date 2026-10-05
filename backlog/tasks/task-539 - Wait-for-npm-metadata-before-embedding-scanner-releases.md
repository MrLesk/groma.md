---
id: TASK-539
title: Wait for npm metadata before embedding scanner releases
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 20:35'
updated_date: '2026-10-04 20:50'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/actions/runs/37230561064/job/111522869486'
documentation:
  - docs/scanners/publishing.md
modified_files:
  - scripts/scanner-release.ts
  - test-bun/scanner-release.test.ts
  - docs/scanners/publishing.md
priority: high
type: bug
ordinal: 624000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Release workflow 37230561064 successfully uploaded every scanner package, then all five Groma builds failed in Embed published scanner metadata because the registry did not yet expose @groma/scanner-java@0.2.1. The macOS failure is job 111522869486. Restarting failed jobs repairs this release after metadata becomes visible, but future releases need to handle the same publish-then-read delay without a manual restart. This change belongs to the existing release catalog command and keeps published npm metadata as the authority.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The release catalog waits for exact staged scanner versions that appear after successful publication, then embeds their published discovery metadata; a different available version does not satisfy the wait.
- [x] #2 The catalog has one bounded metadata-wait period and reports a missing exact version when it expires; registry request errors remain visible.
- [x] #3 Focused validation reproduces the delayed metadata failure and passes with the fix, and bun run check passes.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep the correction inside scripts/scanner-release.ts: the catalog waits for each exact staged version through the existing registry reader before embedding it. Use one shared deadline of 30 minutes for the complete catalog, poll missing versions every 10 seconds, and let registry errors continue to fail immediately. The observed Java publication gap is about 16 minutes, so a fixed short delay would not cover it. No scanner behavior or package version changes are needed.
2. Extend test-bun/scanner-release.test.ts. The authority is the reproduced release failure in job 111522869486 and Alex requesting a permanent fix. Existing coverage checks assembly only; add the smallest tests for old/newer metadata appearing before the exact version and for a still-missing version reaching its deadline. A readiness helper in the existing script and the existing import.meta.main convention let each concurrent test use its own local registry without global mocks or environment changes. Prove the delayed-version test fails before adding the wait, then passes.
3. Update docs/scanners/publishing.md with the automatic wait, its shared limit and the remaining manual rerun procedure when the limit expires. Run the focused release tests and bun run check. Review the flow from catalog entry through exact registry lookup, deadline and manifest update. scripts/ and test-bun/ are explicitly excluded from this repository architecture scan, so this delivery fix changes no C4 element or OKF meaning.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Before adding the wait, focused release tests reproduce both incorrect results: the catalog rejects the first missing exact version even when it appears on the next registry read, and it rejects a still-missing version before the shared deadline. Both new tests fail; the existing assembly test passes. Added a loop only for an absent exact version, with ten-second polling capped by the shared remaining time. Registry errors still propagate through the existing reader. The catalog owns one thirty-minute deadline for all packages; old and newer versions are never substituted. The existing script is now import-safe through the established import.meta.main convention so concurrent tests can own independent local registries.

Updated the publishing guide to describe the automatic ten-second polling and one thirty-minute catalog wait limit. The manual rerun procedure now applies when that limit expires. Removed the private acceptance-project path from this public guide, following Alexs request to avoid naming the private example. No scanner runtime, detection rules, compatibility fields, package versions or architecture records changed.

Focused release tests now pass (three tests, including the two regressions and existing assembly coverage). Each new test owns its local registry and remains concurrent and independent. Both regression tests failed before the wait and pass after it; a harmless wording change does not affect their exact-version or deadline assertions. The changed catalog CLI command also ran successfully in an isolated temporary checkout against the real npm registry and embedded the exact published discovery metadata for all twelve scanners, replacing deliberately different local metadata. bun run check passes on synchronized main 852e8c58 (Groma 0.6.1): 16 Node tests and 754 Bun tests pass, 48 environment-dependent skips, zero failures. Existing Biome warnings and infos are unchanged. git diff --check passes; groma/ has no changes. Own specification and quality reviews pass: catalog owns the shared deadline, the helper owns missing-version polling, the existing reader owns registry errors, and the manifest writer still embeds only confirmed published metadata. This bounded delivery fix needs no separate architecture review.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The release catalog now waits for exact published scanner metadata instead of failing immediately after a successful upload. It polls every ten seconds within one shared thirty-minute limit and leaves registry errors visible. This handles the observed sixteen-minute Java publication delay without inventing metadata or changing scanner versions. The publishing guide explains the automatic wait and timeout procedure and no longer names the private acceptance project. Two regression tests fail before the change and pass after it; existing assembly coverage, the actual catalog CLI against all twelve npm scanner manifests, and bun run check pass. A delay beyond the shared limit still produces a clear failure for the missing exact version.
<!-- SECTION:FINAL_SUMMARY:END -->
