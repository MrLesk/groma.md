---
id: TASK-680
title: Reduce TypeScript compiler work during scans
status: Done
assignee:
  - '@codex'
created_date: '2026-11-23T19:36:00Z'
updated_date: '2026-11-23T20:36:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/typescript/src/native-checker.ts
  - plugins/scanners/typescript/src/source-imports.ts
  - plugins/scanners/typescript/src/source-analysis.ts
modified_files:
  - plugins/scanners/typescript/src/native-checker.ts
  - plugins/scanners/typescript/src/source-imports.ts
  - plugins/scanners/typescript/src/source-analysis.ts
  - plugins/scanners/typescript/package.json
  - bun.lock
priority: high
type: enhancement
ordinal: 716000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reduce the time spent looking up symbols and reading imports during a Groma self-scan while preserving all scanner results.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Repeated lookups for the same syntax node share the native compiler answer within each program.
- [x] #2 The scanner identifies imported sources from declaration paths without loading entire files to read their names.
- [x] #3 The full scan produces the same observations, findings and architecture files on identical inputs, and the improvement is measured.
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
Cache symbol lookups within one compiler program and match import declarations to the selected files by canonical path. Use existing scanner tests for alias resolution, module augmentation, project ownership and HTTP inference. Compare complete scan outputs and timings on frozen inputs, then run the repository check and readability review. Leave the changes on main for review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
On frozen main 60e3e7b7, three paired full CLI runs returned byte-identical observations (8,720,090 bytes), summary, console output, 52 findings and 162 Markdown files. With SDK tracing enabled for both sides, compiler requests fell from 5,325 to 246 and received bytes from 332,847,604 to 114,412,745. Source files fetched fell from 1,000 to 529. Full CLI times in seconds (before to after) were 44.19 to 54.32, 47.68 to 33.40, and 30.14 to 32.22 with tracing. This shows less compiler work but no reliable wall-time improvement on main alone. The earlier 24-run experiment with PRs #238 and #239 present measured a drop from 3.777 to 2.846 seconds in the median.

Focused checks verified lookup order, duplicate nodes, overlapping requests, missing symbols and independent programs. A real compiler fixture kept the original filename case, omitted an unselected dependency and omitted a module augmentation self-edge.

The CPU profile from scanning the edited main checkout still puts repeated HTTP binding checks (http-bindings.ts, refersTo and usesOf) at the top. PR #238 handles this separate cost. The scan refreshed 125 architecture records and left the groma/ tree clean. The repository check passed with 28 Node tests and 949 Bun tests passing, 67 skipped. The Node suite also passed with the CI version, 26.12.1. The readability check found two existing long lines in source-analysis.ts outside the diff and no findings on changed lines. The TypeScript scanner package and lockfile use the next patch version, 0.2.6.

A final comparison loaded the exact working-tree scanner code with PRs #238 and #239 in a temporary checkout. Five alternating pairs reduced median full-scan time from 6.432 to 4.809 seconds (25.2%). Every pair was faster and all ten runs matched the original main observations, findings, console output and 162 Markdown files byte for byte. The task stays In Progress for the requested separate review. All changes are unstaged on local main.

Review of 2026-11-23 by a second agent, asked by the owner. On a copy of main with these changes the scan wrote the same records and findings. Alone on main it brought no gain (48 s and 2.9 GB before, 52 s and 3.1 GB after, within noise) because the repeated HTTP binding lookup dominates there. With the binding lookup fix of TASK-678 present, the scan went from 4.4 s and 1.73 GB to 3.9 s and 1.05 GB. Breaking the new code five ways on that copy (a file listing itself as an import, every name given the first name's symbol, a repeated request answered with nothing, selected files keyed by file name instead of the compiler's path, no import found) made 1 to 39 of the existing scanner tests fail each time, so no test was added. Review changes: a comment on resolvedImports says what it returns and what the map holds, and a comment on the map in analyzeProject says why it exists. The import graph keeps its own filter by listed file: when an import spells a file in another letter case than the listing, the compiler names the file by the import's spelling and that filter still drops the import, as it did before this task. The full repository check passed again with the comments: 28 Node tests and 949 Bun tests, none failing.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The TypeScript scanner's compiler adapter remembers the symbol of each name within a program, and a file's imports are matched to the selected files by the compiler's path of each declaration instead of loading whole files from the compiler. During the Groma self-scan, compiler requests fell from 5,325 to 246 and transferred bytes from 333 MB to 114 MB, with identical observations, findings and architecture files. Together with the binding lookup fix of TASK-678 the scan's peak memory fell from 1.73 GB to 1.05 GB and its time from 4.4 s to 3.9 s; alone on main the effect is hidden by that lookup. The existing scanner tests fail when the new code is broken on purpose, so no test was added. Not part of this task: an import that spells a file in a different letter case than the listing is still dropped from the graph.
<!-- SECTION:FINAL_SUMMARY:END -->
