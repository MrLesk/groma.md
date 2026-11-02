---
id: TASK-646
title: Offer the architecture map in the managed agent block
status: To Do
assignee: []
created_date: '2026-11-02T16:18:00Z'
updated_date: '2026-11-02T16:19:00Z'
labels: []
dependencies: []
references:
  - instructions
  - src-initialize
  - src/agent-instructions.ts
  - README.md
  - docs/agent-instructions/index.md
type: enhancement
ordinal: 703000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`groma init` writes a managed block between `<!-- groma:start -->` and `<!-- groma:end -->` into AGENTS.md and CLAUDE.md (`managedAgentInstructions` in src/agent-instructions.ts). It tells agents to read the guides before they scan, inspect or curate the architecture, or change files for a Backlog task. It names groma.md's jobs, not the agent's. It never says that the map can help an agent understand the code, or that a change can make a record wrong.

In a trial on 2026-11-02, five Claude Code agents (three Haiku 5.5, two Sonnet 5.5) worked real tasks in clones of Backlog.md and groma.md, with prompts that never named groma.md. None of them ran a read command to understand the code; all of them searched with grep. Two read the guide index only because the block ties it to Backlog tasks, and used the Backlog guide for bookkeeping. One agent noticed that its change made a component record wrong and fixed it with `groma edit`; another made the same change and left the record wrong.

Agents should know the map is there and when it saves them time, without being made to use it. Rewrite the block with the commands this version ships. A starting point, not a requirement:

    ## Architecture map
    groma/ holds this repository's architecture: what each part does and which files it owns.
    It can be incomplete. Use it when it saves you time; grep is fine when you know where to look.
    - Which part owns a file: groma view <file>
    - One part and its neighbours: groma view <id> --plain
    - The whole system: groma view --plain
    - A record your change made wrong: groma edit <id>
    - Scan or curate the map: groma agent-instructions
    - Files changed for a Backlog task: groma agent-instructions backlog
    Change architecture records only through the groma CLI. Ask before curating a first scan.

TASK-570 finishes the job: it renames the guides after these jobs, adds an orientation guide, and moves the Backlog line into the plugin through TASK-569. `groma find` (TASK-575) and `groma view --changed` (TASK-644) get their lines when they ship. This repository's own AGENTS.md keeps its block, which is written for groma.md's developers.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The managed block says what the map holds, that it can be incomplete, and that agents may use their own search tools instead; reading the guides is no longer a precondition for coding work.
- [ ] #2 Each job is one line naming one exact command this version ships: the owner of a file, one element with its neighbours, the system overview, correcting a record, and scanning or curating through `groma agent-instructions`.
- [ ] #3 The block keeps the rule that architecture records change only through the `groma` CLI, the instruction to ask the user before curating a first scan, and one line that sends Backlog task work to `groma agent-instructions backlog`.
- [ ] #4 `groma init` replaces an existing managed block with the new one in AGENTS.md and CLAUDE.md and leaves the text outside the markers unchanged; tests cover both.
- [ ] #5 The README and the agent guides that quote or describe the block match the new text.
- [ ] #6 The block, markers excluded, has at most 110 words.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
