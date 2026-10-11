---
id: TASK-569
title: Let plugins ship their own agent guides
status: To Do
assignee: []
created_date: '2026-10-08 15:14'
updated_date: '2026-10-08 15:31'
labels: []
dependencies:
  - TASK-568
references:
  - instructions
  - backlog-src-index
  - work-source-src-index
  - package
  - src/agent-instructions.ts
  - docs/agent-instructions/backlog.md
  - docs/agent-instructions/structure.md
  - docs/agent-instructions/index.md
  - docs/scanners/creating-a-plugin.md
type: feature
ordinal: 646000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`groma agent-instructions <name>` prints one of five guides compiled into the CLI from docs/agent-instructions/ (src/agent-instructions.ts: `agentGuideNames`, `readAgentGuide`). One of them, backlog.md, holds the instructions of a plugin: the Backlog.md work source in plugins/work-sources/backlog. Core text refers to it: the guide index lists it, and docs/agent-instructions/structure.md tells agents to record structural changes as "`groma agent-instructions backlog` explains". Most groma.md projects do not use Backlog.md, and groma.md expects many more plugins (scanners, work sources, icon packs), each of which may need to tell agents something.

Add a primitive for a plugin to contribute agent instructions once it is installed:
- A plugin package declares its guides in its package.json manifest, under its `groma` entry: for each guide a name, one line saying when to read it, and a Markdown file inside the package. It may also declare one line for the managed AGENTS.md block.
- `groma agent-instructions` lists the core guides, then the guides of the installed plugins. `groma agent-instructions <name>` prints a core or a plugin guide. A plugin guide cannot shadow a core guide; choose and document how the names stay apart.
- A plugin contributes guides when the project's plugins.json (TASK-568) lists it and its package is available on this computer. A listed plugin whose package is missing adds only one line to the index saying it is missing.
- Plugin guides print through the same code path as core guides, so the paging of TASK-571 covers them.
- `groma init` writes the managed-block lines of available plugins after the core lines, the way it reconciles the block today (docs/product-model.md). `groma plugin add` and `remove` do not rewrite the block; they say that `groma init` refreshes it.

Move the Backlog guide into the Backlog work-source package and remove every reference to Backlog from the core guides. The structure guide keeps saying that structural commands print the paths and ids they changed; how a task records them belongs to the Backlog plugin's guide.

Document the manifest fields for plugin authors, next to docs/scanners/creating-a-plugin.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A plugin's package.json can declare agent guides (name, when to read it, file) and one optional managed-block line; groma.md validates them when the plugin is added, and the fields are documented for plugin authors.
- [ ] #2 With the Backlog work source listed and available, groma agent-instructions lists its guide after the core guides and prints it by name; without it, no agent guide and no managed block mentions Backlog.md.
- [ ] #3 A listed plugin whose package is missing adds one line to the index saying so, and no guide.
- [ ] #4 A plugin guide cannot replace a core guide, and a name clash is reported when the plugin is added.
- [ ] #5 The Backlog guide lives in the Backlog work-source package, no core guide refers to it or to Backlog.md, and the standalone CLI reads plugin guides from the installed package.
- [ ] #6 groma init writes the managed-block lines of available plugins after the core lines, and groma plugin add and remove say that groma init refreshes the block.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
