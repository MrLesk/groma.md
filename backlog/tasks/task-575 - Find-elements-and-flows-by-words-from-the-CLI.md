---
id: TASK-575
title: Find elements and flows by words from the CLI
status: To Do
assignee: []
created_date: '2026-10-08 15:14'
updated_date: '2026-10-08 15:31'
labels: []
dependencies:
  - TASK-571
references:
  - search
  - src-cli
  - src-core
  - src/search.ts
  - src/plain-world.ts
  - docs/agent-instructions/inspect.md
type: feature
ordinal: 652000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A bug report or a feature request names a feature in words, not a file. Agents then grep the source, because groma.md offers no way from words to an element: there is no search command. The browser map has a search box (src/search.ts) built for typing: fuse.js fuzzy matching over title, id, ancestor path and overview at a low weight (0.05). It does not search descriptions or flows. In a review on 2026-10-08, four of five coding agents asked for a CLI search that prints ids and files they can act on, and one warned that reusing the fuzzy browser search would miss descriptions and flows.

Add `groma find <words...>`, deterministic and literal:
- Split the input on whitespace. Each word is a case-insensitive literal substring. A record matches when every word appears in at least one of its searched fields; different words may match different fields.
- Searched fields: element ids, titles, descriptions, overviews and group names; flow ids, titles, overviews and step actions.
- Rank by the lowest-priority field needed to match all the words: id or title first, then description or group name, then overview or flow text. Break ties by id.
- One line per hit: id, kind (`flow` for a flow), title, parent (`-` for a flow and for a top-level element), and for a component the first source path it owns in lexical order, or `-` when it owns none. A hit that needs prose to match adds an excerpt of at most 120 characters around the first match.
- Page through the shared list window (TASK-571) and support `--count`.
- Like grep, exit 1 when nothing matches, and say that no stored text matches: the map is partial, so no hit does not mean the feature is absent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 groma find <words...> splits its input on whitespace and matches each word as a case-insensitive literal substring in any searched field of a record: element ids, titles, descriptions, overviews and group names, and flow ids, titles, overviews and step actions.
- [ ] #2 Hits are ranked by the lowest-priority field needed to match all words: id or title, then description or group name, then overview or flow text; ties are broken by id.
- [ ] #3 Each hit is one line with id, kind (flow for a flow), title, parent (- for a flow or a top-level element) and, for a component, its first owned source path in lexical order or -; a hit that needs prose adds an excerpt of at most 120 characters.
- [ ] #4 The output pages through the shared list window and supports --count.
- [ ] #5 With no match the command says that no stored text matches and that the map is partial, and exits 1.
- [ ] #6 The inspect guide documents the command and its ranking.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
