---
id: TASK-650
title: Add an experimental Elixir scanner with Phoenix and Ash support
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-11T22:51:00Z'
updated_date: '2026-11-11T23:20:00Z'
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
- [ ] #3 A Mix project supplies one execution entry from its application callback, or from its escript main module when it declares no callback, with its own compiled source through the existing placement contract.
- [ ] #4 Named functions supply operations and call evidence; call targets stay unresolved, as in the Ruby and Python scanners.
- [ ] #5 Phoenix router declarations supply HTTP endpoints with their complete declared path and the local controller action that handles them, answering the eight producer decisions; routes the scanner cannot read remain blockers.
- [ ] #6 Ash resources and domains supply what their DSL declares and plain Elixir parsing cannot see: resource actions as operations, code-interface functions as declarations, and AshJsonApi routes as HTTP endpoints under the prefix where the Phoenix router mounts them.
- [ ] #7 Discovery reports Elixir from Mix declarations and Phoenix from its router file through the existing rule types, Ash is documented as supported without a discovery clue, and the scanner is integrated with the official catalog, release staging and CI like the other tree-sitter scanners.
- [ ] #8 Scanner documentation states inputs, supported constructs and limits, and the validation record covers at least eight open source repositories at exact commits that also contain other languages, at least three of them using Ash, scanned together with the official scanners for those languages: source witnesses for outlines, entries, endpoints and frontend-to-backend rows or their explicit uncertainty, identical repeat scans and unchanged source.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Status: research complete, implementation waits for Alex's reply to the open choices in section 4. Nothing below is a confirmed product decision until then.

## 1. Result and flow

One package, `plugins/scanners/elixir` (`@groma/scanner-elixir` 0.1.0, id `elixir`, experimental), laid out like the Ruby scanner. Engine: tree-sitter-elixir 0.3.5 (official elixir-lang grammar, Apache-2.0, ships `tree-sitter-elixir.wasm`) on web-tree-sitter 0.27.1, the version the Ruby scanner already pins. Verified in a scratch probe: the grammar loads (ABI 14) and parses the Phoenix, Ash and AshJsonApi sources used for this research.

Flow, entry to result:

1. `src/index.ts` (the `ScannerPlugin`): `listSourceFiles`, `checkReadiness`, `scan`, `readCodeStructure`. Orchestration only.
2. `src/mix.ts`: reads each selected `mix.exs` (app name, `elixirc_paths`, `apps_path`, application `mod:`, escript `main_module:`), builds project roots with parent links, decides which `.ex` files are source, and later builds the execution entries.
3. `src/parser.ts` and `src/syntax.ts`: load the bundled grammar, fail on invalid syntax with file, line and column, and give small readers for calls, do-blocks, keyword options and literals.
4. `src/modules.ts` with `src/aliases.ts`: module scopes (`defmodule`, `defprotocol`, `defimpl`), the `def` family, the lexical alias environment. Produces symbols, outline declarations and operations for one file.
5. `src/calls.ts`: call evidence inside named function bodies and the exactly-one target rule over the module index of all files.
6. `src/phoenix/`: everything Phoenix. Router recognition, `scope`, verbs, `match`, `resources`, `forward`, `live`, `live_session`, path reading, blockers, registration order, handler resolution.
7. `src/ash/`: everything Ash. Resource actions, code-interface `define` on resources and domains, AshJsonApi routes on resources and domains, AshJsonApi routers and their mount under a Phoenix `forward`.
8. `index.ts` assembles one `createScanObservation` call: roots, one file record per physical file, entry points, operations, invocations, HTTP endpoints, diagnostics.

Each file stays under 500 lines and each function at or below cognitive complexity 15. A framework reader receives a module scope (name, body statements, alias resolver) and returns plain records; cross-file resolution happens after every file is parsed, because syntax nodes do not outlive their parse.

Integration, as the Ruby task did: `package.json` manifest and discovery, `build.ts` (wasm, licenses, docs), `src/scanner/modules/official-catalog.ts`, `scripts/scanner-release.ts`, `.github/workflows/ci.yml`, `test-bun/scanner-fresh-checkout.test.ts`, `bun.lock`. Reuse: `isUnder` from `plugins/scanners/projects.ts`, `pathText` from `plugins/scanners/http-url.ts`, `createScanObservation` from `@groma/scanner`. The shared `http-paths.ts` reader is not reused for Phoenix paths: it reads Express syntax such as `:id?` as optional, which Phoenix does not do.

## 2. OKF and C4 placement

1. Where it belongs: the scanner adds no OKF concept, no stored metadata and no C4 element kind. Mix projects are transient source groups (observation roots). Mix application and escript declarations are execution-entry evidence that core's existing placement rule may turn into a container. Modules and functions are Code detail below a component. Phoenix and AshJsonApi routes and Ash actions are temporary evidence that core joins into ordinary relationship rows.
2. What an ordinary Markdown or OKF reader sees: the same component documents with Code links and linked statements such as `Calls HTTP endpoint: GET /api/users/:id`. Nothing new to learn.
3. What Groma interprets and who owns it: nothing new. Core's reconciliation, entry placement and HTTP request rule own all meaning. The scanner id `elixir` in Code references is the only stored trace.

## 3. Milestones

Commit and push after each.

1. Package skeleton, parser, Mix projects, listing, readiness, modules, outlines, symbols, operations; catalog, release staging, CI and fresh-checkout integration.
2. Call evidence and execution entries.
3. Phoenix endpoints.
4. Ash actions, code interfaces and AshJsonApi endpoints.
5. `docs/scanners/elixir/index.md`, shared documentation (README language table, `docs/scanners/index.md`, `discovery.md`, visibility table and entry-name paragraph in `creating-a-plugin.md`, execution-entry table in `evidence.md`).
6. Qualification on at least eight repositories at exact commits (at least three with Ash) with companion scanners, general fixes, `docs/scanners/elixir/validation.md`, `bun run check`, `groma/` self-scan fold, task finalization.

## 4. Choices the contracts and scanners do not settle (recommendations, awaiting reply)

A. Sources. Include `**/*.ex` and `**/mix.exs`; exclude `deps/`, `_build/`, `test/`. Mix compiles only `.ex` files under `elixirc_paths` (default `lib`; `Mix.Utils.extract_files(srcs, [:ex])` in Mix 1.20.5), so a source is a selected `.ex` file inside a source root of its nearest Mix project. `mix.exs` is metadata without Code. Other `.exs` scripts are not read. `elixirc_paths` is read when it is a list of strings, lists joined with `++`, or a call to a function of the same `mix.exs` module whose clauses are such lists; the roots are the union over all clauses, because the Mix environment is not known without running Mix. An unreadable value makes every selected `.ex` file of that project a source and adds a warning diagnostic. A project with a literal `apps_path` is an umbrella root and compiles no source of its own. A repository without a Mix project is not scanned.

B. Projects. Every selected `mix.exs` is a root of kind `project`, named by its literal `app:` atom, else its directory. Parent is the nearest enclosing Mix project, which covers umbrella apps without reading the child list.

C. Outlines, symbols, operations. A module is a `type` named by its full name; nested modules are their own types (`Outer.Inner`), as the Ruby scanner lists types nested in modules. `defprotocol` is a type whose members are its signatures. `defimpl` with a literal protocol and one literal `for:` (or the enclosing module) is a type named `Protocol.For`. A function is identified by name and arity; all clauses of one name and arity are one function at its first clause; a clause with defaults also answers the lower arities. Members are `def`, `defp`, `defmacro`, `defmacrop`, `defguard`, `defguardp`, `defdelegate`, shown as `name/arity`; Code links spell them `Module.name/arity`. Visibility: `public` for modules and `def`, `defmacro`, `defguard`, `defdelegate`; `private` for `defp`, `defmacrop`, `defguardp`. Operations are `def`, `defp` and `defdelegate` only; macros and guards run at compile time and are symbols and outline rows without operations. Not listed: computed names (`def unquote(name)(...)`), operator definitions, modules whose name is not a literal alias, declarations inside conditional blocks.

D. Calls. Reported inside named function bodies: remote calls `Alias.fun(...)` and local calls `fun(...)`, with pipe arity counted. Not entered: `fn`, `&` captures and `quote`. Kernel special forms (`case`, `with`, `for` and the rest of that documented list) are syntax, not calls. A target is reported only when the lexical aliases of the source (`alias`, `alias ..., as:`, `alias A.{B, C}`, `require ..., as:`, `__MODULE__`, nested modules) name one module that exactly one selected file declares and that module declares exactly one matching function: public for remote calls, any for local calls. `defdelegate` is an operation with one call to its `to:` target. Everything else is unresolved: imports, variables, Erlang modules, protocols, macros, `apply/3`, modules outside the selection. Aliases injected by `use` are not seen; that limit is documented.

E. Execution entries. At most one entry per Mix project: its literal application callback `mod: {Module, args}`, else its literal escript `main_module:`. `file` is the one selected file declaring that module, `declaration` the `mix.exs`, `name` the app name, `files` the project's own sources (no nested project, no dependency). Reason for one entry: both declarations launch the same compiled application, and core leaves every file claimed by two entries unplaced (`src/scan-entrypoints.ts`), so two entries over the same source would place only their own two entry files. Unreadable or unresolved declarations give no entry.

F. Phoenix, the eight producer decisions. A router is a module with a literal `use Phoenix.Router`, or `use Web, :router` where the selected module `Web` declares `router/0` containing `use Phoenix.Router` (the generator's form, proven from source).
1. Prefixes: every `scope` path (positional or `path:`), nested scopes, the `resources` path and its nested member prefix `/:name_param` (name from `name:` or the controller name as Phoenix derives it), and the `forward` path of a mounted AshJsonApi router. A scope with a non-literal path or alias, a `host:` option, or an unsupported option is one blocker in place of its routes.
2. Endpoints: `get`, `post`, `put`, `patch`, `delete`, `options`, `connect`, `trace`, `head`, `match`, `resources` and `live`. `pipeline`, `plug` and `pipe_through` run after the route is chosen and never change it, so they report nothing. The handler of a controller route is the one public function `action/2` of the one selected module the scope alias and lexical aliases name. The handler of a `live` route is the first of `mount/3`, `handle_params/3`, `render/1` that the LiveView module declares, reported as `GET` at its exact path. `live_session` does not change paths.
3. Segments: `:name` is a parameter, `*name` an optional catch-all (Phoenix globs match zero segments too), an interpolated path is a blocker after its readable prefix.
4. Local helpers and 5. base: not applicable, the scanner reports no outgoing requests.
6. File-location routes: Phoenix has none.
7. Constrained: a segment mixing text and a parameter (`v:version`) is a constrained parameter.
8. Order: Phoenix matches top to bottom, so every endpoint carries `order`: the router file and its index in the registration sequence. `resources` routes take Phoenix's own emission order and the nested block follows. Blockers (literal prefix, constrained optional catch-all, method `*`, the router file's `(module)` operation): an unresolved handler, `forward` to anything but a readable AshJsonApi router, an unreadable scope or `resources`, and every call in a routing scope that is not a documented form, which may register any route under that scope. A file that declares several routers gives all its endpoints position 0.

G. Ash. A resource is a module with a literal `use Ash.Resource`, a domain one with `use Ash.Domain`.
- Actions: each `create`, `read`, `update`, `destroy` or `action` with a literal name inside `actions do`, and each name in a literal `defaults` list, is one operation in the resource file. Actions are not outline rows.
- Code interfaces: `define :name` inside a resource's `code_interface` or a domain's `resources do resource R do ... end end` declares the function `name` on that module: one outline member, one symbol, one operation, with one call to the action it names (`action:` or the same name) when that action resolves exactly. Calls to `Module.name` and `Module.name!` resolve to it by name, because the generated arities depend on the action and are not read. Not interpreted and therefore omitted: `define_calculation`, names ending in `?`, a `functions:`, `namespace` or `define?` option.
- AshJsonApi: routes inside `json_api do routes do ... end end` of a resource (`base`) or a domain (`base_route`, nested, or with the resource as first argument). A module with a literal `use AshJsonApi.Router, domains: [...]` serves the routes of its domains and of the resources those domains list. The routes become endpoints only where a Phoenix router forwards to that module: path is scope prefix, forward path, base, route; method follows the route kind; the operation is the resource action the route names. All routes of one mount share the forward's position, because AshJsonApi sorts them by its own rules. Blockers: relationship routes without an action, the router's `open_api` and `json_schema` documents, a domain's schema route, and the whole mount when any part of it is unreadable. A router no Phoenix router forwards to reports nothing.

H. Discovery. See section 5: the existing rule types cannot report Phoenix or Ash from `mix.exs` without also reporting them for every Mix project.

I. Grammar and licenses. tree-sitter-elixir 0.3.5 from npm (Apache-2.0), wasm SHA-256 ed99093c548c12d43f7e337fd3440e9e2daa2ec671a5e29aadb6c6dcb2232a62. The package ships the grammar LICENSE, a verbatim copy of the grammar repository's NOTICE (absent from the npm package, so one copy is committed beside the scanner), and the web-tree-sitter LICENSE.

## 5. Acceptance criteria that need a decision

- AC 7, discovery of Phoenix and Ash "from Mix declarations". A `text` rule reports its technology for every matching file whether or not its pattern matches (`src/scanner/modules/discovery-rules.ts`, the `go.mod` precedent), and no other rule type reads `mix.exs`. Without a core and contract change, discovery can report Elixir from `mix.exs` with its `elixir:` requirement, but not Phoenix or Ash. Options: (1) report only Elixir, list Phoenix and Ash as supported technologies, document the gap; (2) approve a small shared change so a `text` rule can require its match.
- AC 3, "application and escript launch declarations supply execution entries": choice E reports one entry per project, so an escript beside an application callback adds none.
- AC 8, frontend-to-backend rows on Ash repositories: open source Ash applications mostly use LiveView, so real repositories may show AshJsonApi endpoints and explicit uncertainty but no proven frontend row. The fixture test proves the row.

## 6. Tests and their justification

All tests build the package, use `test.concurrent`, own their temporary directories, and load only `test/fixtures/`. No existing test covers Elixir.

1. `test-bun/elixir-scanner.test.ts` with `test/fixtures/elixir-mix/` (an umbrella with an application app and an escript app). Rules and authority: AC 1 to 4 and 7, the listing, outline and observation contracts. Wrong results it detects: a `.ex` file outside the source roots or an `.exs` script listed or parsed (the fixture holds an unparsable template under `priv/`); a file assigned to the umbrella root instead of its app; two operations for a two-clause function; a call resolved through the wrong alias, arity or visibility, or an import reported as resolved; a `defp` shown public; an entry that includes another app's files or a second entry for an escript beside an application; output that changes when the input order is reversed; invalid source that does not fail with its file and line.
2. `test-bun/elixir-phoenix.test.ts` with `test/fixtures/elixir-phoenix/`. Authority: AC 5 and the producer checklist. Wrong results: a path missing a scope or resource prefix; a handler bound without the scope alias; `resources` routes in the wrong order; a `live` route reported as a root blocker; an unknown macro, unknown forward or unresolved handler that leaves no blocker. With the built JavaScript scanner on a small client file and core's `httpRelationships`: the proven row exists, and no row is derived for a route registered after a blocker.
3. `test-bun/elixir-ash.test.ts` with `test/fixtures/elixir-ash/`. Authority: AC 6. Wrong results: an action from `defaults` missing; a `define` on a domain attributed to the resource or not callable; an AshJsonApi path without the Phoenix forward prefix or base; a route bound to the wrong action; a relationship route without a blocker; endpoints reported for a router nothing forwards to. One core row from the JavaScript client to the resource file.
4. `test-bun/scanner-fresh-checkout.test.ts`: add `elixir: 'elixir-mix'` to the shared table. Elixir is not added to the list of scanners exempt from the resolved-call assertion.

Fixtures are minimal generic worlds, not copies of real projects. No test asserts documentation text, diagnostics wording or decorative detail.

## 7. Non-goals stated as limits in the scanner page

Separate Ash scanner; outgoing HTTP clients; compared-operation tokens; HEEx and EEx, LiveView and component source units, channels and sockets, AshGraphql, AshPhoenix forms, Ecto schemas, process and message relationships; expansion of other macros, `use` callbacks, protocol dispatch, `apply/3`; scanner settings; Plug.Router applications; forwarding to a second Phoenix router; Ash fragments; Mix tasks and releases as entries.
<!-- SECTION:PLAN:END -->
