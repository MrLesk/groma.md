---
id: TASK-678
title: Keep generated component ids under the file name limit
status: Done
assignee:
  - '@claude'
created_date: '2026-11-23T08:38:00Z'
updated_date: '2026-11-23T08:41:00Z'
labels: []
dependencies: []
references:
  - src/naming.ts
  - src/scan-component-naming.ts
  - src/scan-reconciler.ts
modified_files:
  - src/naming.ts
  - src/scan-component-naming.ts
  - src/scan-reconciler.ts
  - test-bun/scan-component-naming.test.ts
type: bug
ordinal: 716000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On a large Angular/Nx monorepo with deeply nested source folders, the first `groma scan` ran for about 13 minutes and then stopped with `ENAMETOOLONG: name too long, unlink '.../groma/systems/<app>/components/studio-control-view-tab-view-selection-detail-tab-...-component.md.<uuid>.tmp'`. A generated component id is built from the source path (parent folder and file stem, then more parent folders on a collision, then the parent id), with no length limit. The id is the file name, and the atomic write first writes `<id>.md.<uuid>.tmp`, so a 213-byte id plus the temporary suffix went past the 255-byte file name limit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A scan of a source whose generated id would be longer than 160 bytes writes the component under an id of at most 160 bytes.
- [x] #2 Two different long ids that share their first 160 bytes stay distinct, and the same source keeps the same id on a later scan.
- [x] #3 A shortened id never cuts a character in half.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification: the two tests added to `test-bun/scan-component-naming.test.ts` fail before the change and pass after it. A rescan of the monorepo that failed now completes: 12,391 components, longest file name 163 characters. `bun run check`: Biome, `tsc --noEmit` and the Node suite pass; the Bun suite has 923 pass and 28 fail, all in Java, Kotlin, Scala, COBOL, JVM trust, npm CA and action TLS tests that need a JDK or network access this machine does not have. None touch component naming.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Generated ids over 160 bytes keep their readable start, cut on whole characters, and end in the first 8 hex digits of a SHA-256 of the full id. `fitId` in `src/naming.ts` applies to the ids `readableNames` and `candidateId` generate; ids a user chooses are unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
