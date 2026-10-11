---
id: TASK-592
title: Fix the scan failures and wrong evidence found by the scanner audit
status: To Do
assignee: []
created_date: '2026-10-11 16:51'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/127'
type: bug
ordinal: 657000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue 127 showed that one Java source line can stop a whole project from scanning. On 2026-10-11 four read-only audits ran every official scanner on probe projects, public corpora and fuzzed files, about a million operation nodes, looking for the same class of defect. No other scanner can emit a duplicate operation id. The audits did find the defects tracked by the subtasks: sources that the language toolchain accepts but that fail the scan, and evidence that is wrong without any error. Each subtask carries its own reproduction.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each subtask is Done, or closed with the recorded reason why no change is right.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
