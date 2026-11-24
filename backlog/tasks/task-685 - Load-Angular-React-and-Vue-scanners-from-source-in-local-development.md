---
id: TASK-685
title: Load Angular, React, and Vue scanners from source in local development
status: Done
assignee:
  - '@MrLesk'
created_date: '2026-11-24T21:58:00Z'
updated_date: '2026-11-24T22:04:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/angular/src/index.ts
  - plugins/scanners/react/src/index.ts
  - plugins/scanners/vue/src/index.ts
modified_files:
  - plugins/scanners/angular/package.json
  - plugins/scanners/react/package.json
  - plugins/scanners/vue/package.json
  - docs/scanners/creating-a-plugin.md
type: enhancement
ordinal: 720000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Groma checkout config already selects the three scanners by local path. Their manifests load generated files that can lag behind edits in the checkout. Alex also wants the global groma command to run from groma3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The checkout loads Angular, React, and Vue by their TypeScript source entries, and a fresh scan uses current source without a scanner build.
- [x] #2 The release build still creates a runnable bundled entry for each scanner.
- [x] #3 The global groma command on this machine resolves to the groma3 checkout and runs.
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
1. Point the three checkout manifests at their existing TypeScript entries. Keep using the existing release builder for the bundled entries.
2. Update the local scanner instructions to explain when source edits take effect.
3. Link the global Groma command from groma3. Use the linked CLI to scan the three framework fixtures with the local packages, verify their resolved entries, and verify the generated release packages. Run the repository check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ran bun link from groma3 and confirmed the global command resolves to its src/cli.ts and reports 0.7.8 from outside the checkout.
Scanned the Angular, React, and Vue fixtures with the changed manifests in a source-only checkout copy. Each scan mapped its expected source files. A deliberate edit to each copied source entry was picked up on the next CLI run.
Built all three release packages into a temporary directory and loaded the dist/index.js entry declared by each staged manifest.

The three existing fresh-checkout package tests passed against staged Angular, React, and Vue builds.
The first repository check inherited npm offline mode. Running with Node 26.12.1 directly on PATH fixed the registry test environment. bun run check passed with 28 Node tests and 958 Bun tests.
Code Hygiene reported no findings on changed lines. Reviewed the manifest and documentation diff for scope and checked whitespace with git diff --check.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Local Angular, React, and Vue packages load their TypeScript source on each new Groma run. The global groma command resolves to groma3. Source scans, release scans, and the repository check passed.
<!-- SECTION:FINAL_SUMMARY:END -->
