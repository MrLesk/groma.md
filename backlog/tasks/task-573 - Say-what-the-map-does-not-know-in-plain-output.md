---
id: TASK-573
title: Say what the map does not know in plain output
status: To Do
assignee: []
created_date: '2026-10-08 15:14'
updated_date: '2026-10-08 15:31'
labels: []
dependencies: []
references:
  - src-core
  - flows
  - instructions
  - src/plain-world.ts
  - src/viewers/relationship-text.ts
  - src/agent-instructions.ts
  - docs/agent-instructions/inspect.md
type: enhancement
ordinal: 650000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plain views state absence as fact. `groma view src/flow-model.ts --plain` prints `none` under Incoming relationships, yet files owned by four other components import that file: src-core, curate, src-authoring and relationship-markdown. groma.md stores only authored rows, named callbacks and HTTP calls with a certain endpoint match, not every call; on this repository 28 of 113 components carry any relationship row. In a review on 2026-10-08, coding agents said they read `none` as "nothing depends on this", and that one wrong `none` costs the map their trust for the rest of the session.

Other gaps:
- An element whose description and overview are both empty prints nothing in their place, so it looks described.
- Derived rows, inferred by the scan, look like rows people wrote. A plain relationship line is `source -> target | description | technology`, with `| draft` only for draft rows, and one displayed line can combine authored and derived connections (src/source-relationships.ts).
- The first-scan note (`firstScanAgentNote` in src/agent-instructions.ts, shown while `awaitsCuration` in src/empty-world.ts holds: there is at least one component and no element has a description or an overview) prints from `groma scan` and `groma agent-instructions`, not from `groma view`, which agents run far more often.
- Nothing tells a reader how much of the repository the map covers.

Make plain output honest, in short lines at the point of use:
- `none recorded` instead of `none` for relationships, in every plain view.
- `(no description)` for an element whose description and overview are both empty or whitespace.
- `| derived` at the end of a relationship line when every connection behind it is derived, `| partly derived` when only some are. Draft lines keep `| draft`.
- A short coverage section at the end of `groma view --plain`, computed from stored data and the repository listing, without running a scanner: the distinct repository files selected by the configured scanners' include patterns, exclusions and Git-ignore rules, and how many of them have an owner; the stable elements without description; the stable components with no current relationship in either direction. Call the files "selected", not "read" or "analyzed": selection does not prove that a scanner analyzed a file.
- The first-scan note at the top of `groma view` plain output while `awaitsCuration` holds.
Do not repeat warnings on every line, and do not print a completeness percentage.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every plain view prints none recorded where it printed none for relationships.
- [ ] #2 An element whose description and overview are both empty shows (no description) in plain views.
- [ ] #3 A plain relationship line ends with | derived when every connection behind it is derived and with | partly derived when only some are; draft lines keep | draft.
- [ ] #4 groma view --plain ends with a coverage section computed without running a scanner: the files selected by the configured scanners and how many of them have an owner, the stable elements without description, and the stable components with no current relationship in either direction.
- [ ] #5 While awaitsCuration holds, groma view plain output starts with the first-scan note.
- [ ] #6 The inspect guide documents the wording, the relationship tags and the coverage section.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
