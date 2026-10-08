---
id: TASK-570
title: Rewrite the managed agent block as one line per job
status: To Do
assignee: []
created_date: '2026-10-08 15:14'
updated_date: '2026-10-08 15:31'
labels: []
dependencies:
  - TASK-569
references:
  - instructions
  - src-initialize
  - src/agent-instructions.ts
  - docs/agent-instructions/index.md
  - docs/agent-instructions/inspect.md
type: enhancement
ordinal: 647000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`groma init` writes a managed block between `<!-- groma:start -->` and `<!-- groma:end -->` into the repository's AGENTS.md or CLAUDE.md (src/agent-instructions.ts, `managedAgentInstructions`). Today it reads:

    ## Groma

    This project uses Groma. Before you scan, inspect, or curate architecture, or change files for a Backlog task, run `groma agent-instructions` and read the guide it names for that job. When it reports a first scan, ask the user whether they want you to curate the architecture. Do not edit Groma-owned architecture files directly.

In a review on 2026-10-08, five coding agents (Claude Fable 5.1, Claude Opus 5.5, GPT-6 Astra, GPT-6.1 Sol and Grok 4.7) were asked how they would use groma.md to fix a bug, add a cross-cutting feature and review a pull request. They agreed on the problems with this block:
- It names groma.md's jobs (scan, inspect, curate), not the agent's jobs (fix, build, review), so for most work it never applies. Agents that treat AGENTS.md as binding instead pay for the guides on every Backlog task.
- It never names the read commands that help with orientation: `groma view <file>` (the owner and neighbours of a file) and `groma view --plain` (the C4 context: people, systems and external systems, in about 3 KB).
- It sends every job to the guide index, which is about 6 KB of C4 meanings and curation rules.
- It does not say the map is partial.
- It names a plugin, Backlog.md, in core text. Most groma.md projects do not use Backlog.md.

Replace it with a minimal block that any agent can follow, including small local models that run offline: one line per job, each naming one exact command, with no conditions to interpret. A starting point, not a requirement:

    ## Groma
    The architecture map is in groma/. It is partial. Never edit its architecture files by hand.
    - Where does a file live: groma view <file>
    - See the architecture context: groma view --plain
    - Before changing the architecture: groma agent-instructions curate
    - Other jobs: groma agent-instructions

Rename the agent guides after the jobs the block names, instead of today's inspect, structure, describe, relationships and backlog. Document the final mapping from job lines to guides, and keep every curation responsibility today's guides hold. Open the guide index with a short table of the read commands before the C4 meanings, and add a short orientation guide: the read commands, what the map contains, and what it does not. Configuration files such as scanners.json (plugins.json after TASK-568) keep their documented editing rules; the never-edit rule covers architecture records.

Installed plugins add their own lines to the block and their own guides, through the primitive in TASK-569. Core text names no plugin. The instruction to ask the user before curating a first scan stays reachable: `groma agent-instructions` prints it today, and TASK-573 also prints it from `groma view`.

Do this after TASK-571 to TASK-575 where possible: it renames the guides those tasks edit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The core part of the managed block has at most 80 words and one line per job, each naming one exact command; it says the map is partial and that architecture files under groma/ are never edited by hand, and it names no plugin. Lines from installed plugins follow the core lines.
- [ ] #2 groma init replaces the old block with the new one in every AGENTS.md and CLAUDE.md it manages, keeping the text outside the markers, and this repository's own AGENTS.md carries the new block.
- [ ] #3 Every job line maps to exactly one guide or read command, the guide names match the jobs, and the mapping is documented.
- [ ] #4 Every curation responsibility in today's inspect, structure, describe and relationships guides is still covered by a guide.
- [ ] #5 groma agent-instructions opens with a table of the read commands before the C4 meanings.
- [ ] #6 An orientation guide prints the read commands, what the map contains and its limits in under 2 KB.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
