---
type: C4 Component
title: Elixir source scanner
status: stable
groma:
  id: elixir-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/elixir/src/index.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/aliases.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/ash/index.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/calls.ts
      symbol: clauseCalls
    - scanner: typescript
      file: plugins/scanners/elixir/src/ash/code-interface.ts
      symbol: interfaceFunctions
    - scanner: typescript
      file: plugins/scanners/elixir/src/ash/domain.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/ash/dsl.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/phoenix/endpoints.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/ash/json-api.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/mix.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/modules.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/ash/mount.ts
      symbol: ashMounts
    - scanner: typescript
      file: plugins/scanners/elixir/src/parser.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/phoenix/paths.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/ash/resource.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/phoenix/router.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/source.ts
    - scanner: typescript
      file: plugins/scanners/elixir/src/syntax.ts
  technology: TypeScript, tree-sitter-elixir, WebAssembly
  group: Language scanners
description: Supplies Elixir declarations, Phoenix handlers and Ash actions, code interfaces and JSON:API routes without running project code.
---

The Elixir plugin translates the selected source files into the shared scanner observation. Its package manifest declares inputs and default exclusions. The index coordinates the flow: Mix project declarations decide which files are compiled source and which file launches each project, the bundled parser reads every source once and releases its syntax tree after extraction, and the module reader lists modules, functions and unresolved calls. Code outlines reuse the same declaration analysis.

Phoenix and Ash support live in their own directories. The Phoenix reader turns router declarations into endpoints in registration order and binds each to its controller action or LiveView callback. The Ash reader reports resource actions, code interface functions, and the JSON:API routes that a Phoenix router mounts. The Phoenix reader knows nothing about Ash: the index hands it the lookup of what a mounted router serves.

Mix projects and launch declarations remain source evidence. Core owns architecture identity, component ownership, container placement and relationships. Call targets stay unresolved, and routes the plugin cannot read retain blockers. Scanning does not run Elixir or Mix, install application dependencies or fetch tools.
