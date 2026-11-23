---
id: TASK-678
title: Remove repeated name lookups from the Groma self-scan
status: Done
assignee:
  - '@codex'
created_date: '2026-11-23T19:00:00Z'
updated_date: '2026-11-23T19:12:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/http-bindings.ts
modified_files:
  - plugins/scanners/http-bindings.ts
  - plugins/scanners/angular/package.json
  - plugins/scanners/javascript/package.json
  - plugins/scanners/react/package.json
  - plugins/scanners/typescript/package.json
  - plugins/scanners/vue/package.json
  - bun.lock
priority: high
type: bug
ordinal: 716000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Scanning Groma itself spent most of its time finding the uses of TypeScript variables while checking HTTP requests. Every function considered as a possible fetch wrapper repeated a search through the same imported names.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The full CLI scan of the Groma repository completes measurably faster with all configured scanners retained.
- [x] #2 Running both scanner implementations against the same sources produces identical observations and an identical stored architecture.
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
Index runtime identifier uses by the declaration they refer to once per compiler context. Keep direct and imported references, declaration exclusions, and existing write rules. Use the existing scanner fixtures for reassignment, imports, fetch wrappers and routers. Compare the full observations and stored Markdown on identical repo inputs, time the CLI end to end, and run repository checks. Bump the patch version of each scanner bundling the change.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PR #183 (October 28, commit 0d0bd34b) made every plausible fetch wrapper check the function declaration for reassignment. With the 534 selected TypeScript input paths at 71779187, the unchanged scanner took 49.84 s. Bypassing only wrapper detection took 2.36–2.51 s and lost seven of ten HTTP request facts. Bypassing only the declaration reassignment check took 2.92 s but would misclassify reassigned wrappers. The fix keeps both rules. The profile put roughly 34 of 44 s collecting observations in the repeated name lookup. A complete original/fixed comparison on the unchanged checkout produced the same 8.3 MiB observation JSON (SHA-256 a0eb8c6a9efb4243d757108f1704cc91541e0034d6a345218c0207c3be95f88e). In a separate fixed checkout at that revision, the full CLI took 57.60 s before and 8.77 s after under concurrent host load. Its stdout and architecture directory were identical, including all 52 findings and diagnostics.

A normal CLI self-scan of the edited task branch completed in 6.57 s with no architecture files changed. The five scanner packages that bundle the shared HTTP reader received patch version bumps. The preceding change adds no format or CLI contract. The existing source-level TypeScript fixture checks wrapper and URL helper calls, and the JavaScript fixture explicitly reassigns a wrapper and rejects the resulting false request.

The unchanged TypeScript scanner already took 42.93 s at 885f3171, before the November 22 evening batch of 16 PRs, and 55.24 s at c42c9c71, before the last two PRs in that batch. Those measurements establish that the slow scan predates both the icon and link-title changes. Timings varied with other work on the host.

Final specification and quality review: each name uses its compiler declaration or eligible import target. Same-name uses precede aliases, and the checking rules for writes, escapes and function identity continue to use the same evidence. The name index is local to one compiler context. The final checkout comparison matched every observation again. The full repository check passed: 28 Node and 949 Bun tests, 67 optional Bun skips and zero failures. Readability review split the name filtering and clarified lookup order. The only remaining codehygiene finding is an unchanged settings line. No new test or public documentation is needed for this behavior-preserving lookup change.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Imported names are resolved once per scan context. Fetch wrapper detection and the check for replaced functions keep their original results. On the fixed Groma input the CLI fell from 57.60 s to 8.77 s with identical observations, report and architecture Markdown.
<!-- SECTION:FINAL_SUMMARY:END -->
