---
id: TASK-688
title: Restore the ARM64 CLI release builds
status: Done
assignee:
  - '@codex'
created_date: '2026-11-25T19:24:00Z'
updated_date: '2026-11-25T20:17:00Z'
labels: []
dependencies: []
references:
  - .github/workflows/release.yml
  - https://github.com/MrLesk/groma.md/actions/runs/45680357772
  - docs/scanners/publishing.md
modified_files:
  - .github/workflows/release.yml
  - docs/scanners/publishing.md
priority: high
type: bug
ordinal: 723000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The v0.8.0 release passed repository validation and published its scanner set. The Linux and Windows ARM64 standalone builds failed when Bun ran the Tree-sitter workspace dependency install script against Node 26. No CLI package or GitHub binary was published. Recover the existing release version.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The standalone release build installs the locked target dependencies and builds the Linux and Windows ARM64 binaries without compiling unrelated scanner dependencies.
- [x] #2 The existing standalone package requirements checks keep their five release targets.
- [x] #3 A manual CLI build checks all release runners without publishing. A publish run from the existing v0.8.0 release tag uses its exact published scanners and ships that same CLI version.
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
1. Reuse the lifecycle-script-free install that passed on the two ARM scanner runners, keeping the all-target dependency selection for standalone packaging.
2. Verify a clean install, the compiled binaries and the package smoke checks. Recover the existing release through GitHub Actions once its source commit is confirmed.

Add a manual CLI build check and a publish mode for an existing release whose CLI binaries and packages are still pending. Both use the exact published scanner versions listed in the checkout. Verify each native release runner in the build check. After approval, include PR #247 in the release source, update v0.8.0 and dispatch the corrected workflow from that tag. Confirm GitHub downloads and npm package versions.

Require successful direct inputs throughout the release. Recovery intentionally skips the scanner publishing job. Use check mode to exercise artifact and npm package staging through the same jobs, and skip their external writes. Verify that the real run reaches every publishing step.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Release run 45680357772 failed in the all-target Bun install on Linux and Windows ARM64. Both logs show tree-sitter@0.21.1 running node-gyp against Node 26.12.1. The scanner build jobs on those hosts passed with install scripts disabled. All six 0.8.0 CLI registry endpoints returned 404 and the GitHub release had no assets. The tagged release check accepts the empty v0.8.0 release and rejects a branch or the already-complete v0.7.8 release.

Build-only run 45685548226 passed all five native builds. Tagged run 45687049623 also passed repository validation and all five native builds. It skipped the delivery jobs because GitHub carries skipped ancestors through implicit success conditions. The release still had zero uploaded assets and npm latest still resolved to 0.7.8.

The end-to-end check in run 45688969828 assembled the downloads and all six npm packages with publication disabled. The corrected v0.8.0 tag points to 241936a9 and contains PRs #247, #248 and #249. The final release run 45690616884 finished successfully. All five GitHub binaries matched SHA256SUMS. The npm registry serves the six 0.8.0 package manifests and tarballs, and latest is 0.8.0. A clean npm install and the downloaded GitHub binary both returned the same plain view with the entire checkout read-only. The release workflow synced main to 0.8.0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored all five standalone build targets and the release delivery steps. The existing v0.8.0 release includes TASK-567 and is available on npm and GitHub. The public package checks, clean installation and read-only view passed.
<!-- SECTION:FINAL_SUMMARY:END -->
