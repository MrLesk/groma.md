---
id: TASK-650
title: Add an experimental Elixir scanner with Phoenix and Ash support
status: To Do
assignee: []
created_date: '2026-11-11T22:51:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/ruby/src/index.ts
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/evidence.md
  - docs/scanners/ruby/index.md
  - docs/scanners/ruby/validation.md
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
type: feature
ordinal: 706000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Elixir projects have no language scanner, so their source never reaches the map, Code outlines or derived HTTP relationships, and a mixed repository shows only its frontend. Ash applications lose the most: resources and domains declare actions, code interfaces and JSON:API routes through a DSL, so plain function parsing sees almost none of their behavior.

One scanner covers the language and both frameworks, as the Ruby scanner covers Rails. Ash resources are ordinary Elixir modules in the same Mix project, read by the same parser, and an AshJsonApi path is provable only together with the Phoenix router that mounts it. Separate framework scanners exist only where a framework brings its own compiler and file types.

The scope follows the existing scanners as an educated guess Alex asked for. Its individual choices are not confirmed product decisions; record any choice the existing contracts do not settle in the plan before building on it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A packaged elixir scanner scans a Mix project from a fresh checkout without Elixir, Erlang, Mix, Hex dependencies, a project build or application execution, and a repeat scan is identical.
- [ ] #2 Elixir source listing, Mix project membership including umbrella apps, declarations, visibility and Code outlines follow the existing scanner contract; Mix projects stay source groups and never become C4 boundaries.
- [ ] #3 Mix application and escript launch declarations supply execution entries with their own compiled source through the existing placement contract.
- [ ] #4 Named functions supply operations and call evidence; a call reports a target only where the source identifies exactly one selected function, and every other call stays unresolved.
- [ ] #5 Phoenix router declarations supply HTTP endpoints with their complete declared path and the local controller action that handles them, answering the eight producer decisions; routes the scanner cannot read remain blockers.
- [ ] #6 Ash resources and domains supply what their DSL declares and plain Elixir parsing cannot see: resource actions as operations, code-interface functions as declarations and call targets, and AshJsonApi routes as HTTP endpoints under the prefix where the Phoenix router mounts them.
- [ ] #7 Discovery reports Elixir, Phoenix and Ash from Mix declarations, and the scanner is integrated with the official catalog, release staging and CI like the other tree-sitter scanners.
- [ ] #8 Scanner documentation states inputs, supported constructs and limits, and the validation record covers at least eight open source repositories at exact commits that also contain other languages, at least three of them using Ash, scanned together with the official scanners for those languages: source witnesses for outlines, entries, endpoints and frontend-to-backend rows or their explicit uncertainty, identical repeat scans and unchanged source.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
