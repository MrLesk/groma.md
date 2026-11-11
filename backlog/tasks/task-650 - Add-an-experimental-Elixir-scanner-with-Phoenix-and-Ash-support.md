---
id: TASK-650
title: Add an experimental Elixir scanner with Phoenix and Ash support
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-11T22:51:00Z'
updated_date: '2026-11-11T23:26:00Z'
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
Status: decisions in section 4 were confirmed by Alex on 2026-11-12, and acceptance criteria 3, 4, 6 and 7 were amended to match. Implementation follows this plan.

## 1. Result and flow

One package, `plugins/scanners/elixir` (`@groma/scanner-elixir` 0.1.0, id `elixir`, experimental), laid out like the Ruby scanner. Engine: tree-sitter-elixir 0.3.5 (official elixir-lang grammar, Apache-2.0, prebuilt `tree-sitter-elixir.wasm`, SHA-256 ed99093c548c12d43f7e337fd3440e9e2daa2ec671a5e29aadb6c6dcb2232a62) on web-tree-sitter 0.27.1, the version the Ruby scanner pins. The package ships the grammar LICENSE, a verbatim copy of the grammar repository's NOTICE (committed beside the scanner because the npm package omits it) and the web-tree-sitter LICENSE.

Flow, entry to result:

1. `src/index.ts` (the `ScannerPlugin`): `listSourceFiles`, `checkReadiness`, `scan`, `readCodeStructure`. Orchestration only.
2. `src/mix.ts`: reads each selected `mix.exs` (app name, `elixirc_paths`, `apps_path`, application `mod:`, escript `main_module:`), builds project roots with parent links, decides which `.ex` files are source, and builds the one execution entry per project.
3. `src/parser.ts` and `src/syntax.ts`: load the bundled grammar, fail on invalid syntax with file, line and column, and give small readers for calls, do-blocks, keyword options and literals.
4. `src/modules.ts`: module scopes (`defmodule`, `defprotocol`, `defimpl`) and the `def` family; symbols, outline declarations and operations for one file. `src/calls.ts`: unresolved call evidence inside named function bodies.
5. `src/aliases.ts`: the lexical alias environment, used only where Phoenix handler resolution and Ash module references need a full module name.
6. `src/phoenix/`: everything Phoenix. Router recognition, `scope`, verbs, `match`, `resources`, `forward`, `live`, `live_session`, path reading, blockers, registration order, handler resolution.
7. `src/ash/`: everything Ash. Resource actions, code-interface `define` on resources and domains, AshJsonApi routes on resources and domains, AshJsonApi routers and their mount under a Phoenix `forward`, and the AshAuthentication `ash_authentication_live_session` wrapper name.
8. `index.ts` assembles one `createScanObservation` call: roots, one file record per physical file, entry points, operations, invocations, HTTP endpoints, diagnostics.

Each file stays under 500 lines and each function at or below cognitive complexity 15. A framework reader receives a module scope (name, body statements, aliases) and returns plain records; resolution across files happens after every file is parsed, because syntax nodes do not outlive their parse. Phoenix knows nothing about Ash: `index.ts` hands the Phoenix endpoint builder a mount lookup and the extra wrapper names that the Ash module provides.

Integration, as the Ruby task did: manifest and discovery, `build.ts`, `src/scanner/modules/official-catalog.ts`, `scripts/scanner-release.ts`, `.github/workflows/ci.yml`, `test-bun/scanner-fresh-checkout.test.ts`, `bun.lock`. Reuse: `isUnder` from `plugins/scanners/projects.ts`, `pathText` from `plugins/scanners/http-url.ts`, `createScanObservation` from `@groma/scanner`. The shared `http-paths.ts` reader is not reused for Phoenix paths: it reads Express syntax such as `:id?` as optional, which Phoenix does not do.

## 2. OKF and C4 placement

1. Where it belongs: the scanner adds no OKF concept, no stored metadata and no C4 element kind. Mix projects are transient source groups (observation roots). A Mix application or escript declaration is execution-entry evidence that core's existing placement rule may turn into a container. Modules and functions are Code detail below a component. Phoenix and AshJsonApi routes and Ash actions are temporary evidence that core joins into ordinary relationship rows.
2. What an ordinary Markdown or OKF reader sees: the same component documents with Code links and linked statements such as `Calls HTTP endpoint: GET /api/users/:id`. Nothing new to learn.
3. What Groma interprets and who owns it: nothing new. Core's reconciliation, entry placement and HTTP request rule own all meaning. The scanner id `elixir` in Code references is the only stored trace.

## 3. Milestones

Commit and push after each.

1. Package skeleton, parser, Mix projects, listing, readiness, modules, outlines, symbols, operations, unresolved calls, execution entries; catalog, release staging, CI and fresh-checkout integration; proof that `Module.name/arity` symbols survive core's Markdown round trip.
2. Phoenix endpoints.
3. Ash actions, code interfaces and AshJsonApi endpoints.
4. `docs/scanners/elixir/index.md`, shared documentation (README language table, `docs/scanners/index.md`, `discovery.md`, visibility table and entry-name paragraph in `creating-a-plugin.md`, execution-entry table in `evidence.md`).
5. Qualification on at least eight repositories at exact commits (at least three with Ash) with the companion scanners this computer can run, general fixes, `docs/scanners/elixir/validation.md`, `bun run check`, `groma/` self-scan fold, task finalization.

## 4. Decisions

A. Sources. Include `**/*.ex` and `**/mix.exs`; exclude `deps/`, `_build/`, `test/`. Mix compiles only `.ex` files under `elixirc_paths` (default `lib`), so a source is a selected `.ex` file inside a source root of its nearest Mix project. `mix.exs` is metadata without Code. Other `.exs` scripts are not read. `elixirc_paths` is read when it is a list of strings, lists joined with `++`, or a call to a function of the same `mix.exs` module whose clauses are such lists; the roots are the union over all clauses, because the Mix environment is not known without running Mix. An unreadable value makes every selected `.ex` file of that project a source and adds a warning diagnostic. A project with a literal `apps_path` is an umbrella root and compiles no source of its own. A repository without a Mix project is not scanned.

B. Projects. Every selected `mix.exs` is a root of kind `project`, named by its literal `app:` atom, else its directory. Parent is the nearest enclosing Mix project, which covers umbrella apps.

C. Outlines, symbols, operations. A module is a `type` named by its full name; nested modules are their own types (`Outer.Inner`). `defprotocol` is a type whose members are its signatures. `defimpl` with a literal protocol and one literal `for:` (or the enclosing module) is a type named `Protocol.For`. A function is identified by name and arity; all clauses of one name and arity are one function at its first clause. Members are `def`, `defp`, `defmacro`, `defmacrop`, `defguard`, `defguardp`, `defdelegate`, shown as `name/arity`; Code links spell them `Module.name/arity`. Visibility: `public` for modules and `def`, `defmacro`, `defguard`, `defdelegate`; `private` for `defp`, `defmacrop`, `defguardp`. Operations are `def`, `defp` and `defdelegate`; macros and guards are symbols and outline rows without operations. Not listed: computed names, operator definitions, modules whose name is not a literal alias, declarations inside conditional blocks. Condition from Alex: a fixture scan through core must show these symbols written to architecture Markdown, read back unchanged and matched by `entry`; if `/` cannot round-trip, stop and report.

D. Calls. Calls inside named function bodies are reported with unresolved targets only, as the Ruby and Python scanners do: remote calls with their member name, local calls without one. `fn`, `&` captures and `quote` are not entered; Kernel special forms are syntax, not calls. No target resolution and no function index for calls: core derives no row from ordinary resolved calls. `defdelegate` is a declaration and an operation without a resolved call.

E. Execution entries. One entry per Mix project: its literal application callback `mod: {Module, args}`, else its literal escript `main_module:`. `file` is the one selected file declaring that module, `declaration` the `mix.exs`, `name` the app name, `files` the project's own sources (no nested project, no dependency). Unreadable or unresolved declarations give no entry.

F. Phoenix. A router is a module with a literal `use Phoenix.Router`, or `use Web, :router` where the one selected module `Web` declares `router/0` containing `use Phoenix.Router`.
1. Prefixes: every `scope` path (positional or `path:`), nested scopes, the `resources` path and its nested member prefix `/:name_param`, and the `forward` path of a mounted AshJsonApi router. A scope with a non-literal path or alias, a `host:` option or an unsupported option is one blocker in place of its routes.
2. Endpoints: the nine verb macros, `match`, `resources` and `live`. `pipeline`, `plug` and `pipe_through` report nothing. A controller route is handled by the one public function `action/2` of the one selected module that the scope alias and lexical aliases name. A `live` route is an exact `GET` endpoint handled by the first of `mount/3`, `handle_params/3`, `render/1` in the one selected LiveView module; an unknown module or one with none of these is a blocker under the unknown-handler rule.
3. Segments: `:name` is a parameter, `*name` an optional catch-all, an interpolated path is a blocker after its readable prefix.
4, 5. Not applicable: no outgoing requests. 6. Phoenix has no file-location routes.
7. A segment mixing text and a parameter (`v:version`) is a constrained parameter.
8. Order: every endpoint carries `order`, the router file and its index in the registration sequence; `resources` routes take Phoenix's own emission order and the nested block follows. Blockers name the router file's `(module)` operation: an unresolved handler, `forward` to anything but a readable AshJsonApi router, an unreadable scope or `resources`, a conditional block, and every call in a routing scope that is not a documented form, each at the enclosing scope prefix. No other library's default paths are encoded. Exactly two path-preserving block wrappers are read through to their child routes: `live_session`, and AshAuthentication's `ash_authentication_live_session`, whose name lives in the Ash module. A file that declares several routers gives all its endpoints position 0.

G. Ash. A resource is a module with a literal `use Ash.Resource`, a domain one with `use Ash.Domain`.
- Actions: each `create`, `read`, `update`, `destroy` or `action` with a literal name inside `actions do`, and each name in a literal `defaults` list, is one operation in the resource file. Actions are not outline rows.
- Code interfaces: `define :name` inside a resource's `code_interface` or a domain's `resources do resource R do ... end end` contributes a symbol and an outline member on that module, shown by its bare name because its arities are not provable without expansion. No operation and no call. Omitted: `define_calculation`, names ending in `?`, and a `functions:`, `namespace` or `define?` option.
- AshJsonApi: routes inside `json_api do routes do ... end end` of a resource (`base`) or a domain (`base_route`, nested, or with the resource as first argument). A module with a literal `use AshJsonApi.Router, domains: [...]` serves the routes of its domains and of the resources those domains list. The routes become endpoints only where a Phoenix router forwards to that module: path is scope prefix, forward path, base, route; method follows the route kind; the operation is the resource action the route names. All routes of one mount share the forward's position. Blockers: relationship routes without an action, the router's `open_api` and `json_schema` documents, a domain's schema route, and the whole mount when any part of it is unreadable. A router no Phoenix router forwards to reports nothing.

H. Discovery, without a core or contract change. A `text` rule reports Elixir from `**/mix.exs` with its `elixir:` requirement as version. A `file` rule reports Phoenix from the generator's router location `**/lib/*_web/router.ex`, which covers the single-application layout (`lib/app_web/router.ex`) and the umbrella layout (`apps/app_web/lib/app_web/router.ex`) of the current `phx.new` templates. `ash` stays in `technologies` without a rule; the scanner page documents that gap.

## 5. Tests and their justification

All tests build the package, use `test.concurrent`, own their temporary directories, and load only `test/fixtures/`. No existing test covers Elixir.

1. `test-bun/elixir-scanner.test.ts` with `test/fixtures/elixir-mix/` (an umbrella with an application app and an escript app). Rules and authority: AC 1 to 4 and 7, the listing, outline and observation contracts, and Alex's round-trip condition. Wrong results it detects: a `.ex` file outside the source roots or an `.exs` script listed or parsed (the fixture holds an unparsable template under `priv/`); a file assigned to the umbrella root instead of its app; two operations for a two-clause function; a call reported with a target; a `defp` shown public; an entry that includes another app's files, or a second entry for an escript beside an application callback; output that changes when the input order is reversed; invalid source that does not fail with its file and line; a `Module.name/arity` Code symbol that core drops, rewrites or fails to mark as entry after a scan.
2. `test-bun/elixir-phoenix.test.ts` with `test/fixtures/elixir-phoenix/`. Authority: AC 5 and 7 and the producer checklist. Wrong results: a path missing a scope or resource prefix; a handler bound without the scope alias; `resources` routes in the wrong order; a `live` route reported as a root blocker or without its `GET` handler; an unknown macro, conditional block, unknown forward or unresolved handler that leaves no blocker; Phoenix not discovered from the router file. With the built JavaScript scanner on a small client file and core's `httpRelationships`: the proven row exists, and no row is derived for a route registered after a blocker.
3. `test-bun/elixir-ash.test.ts` with `test/fixtures/elixir-ash/`. Authority: AC 6. Wrong results: an action from `defaults` missing; a `define` on a domain attributed to the resource, given an operation, or missing from the outline; an AshJsonApi path without the Phoenix forward prefix or base; a route bound to the wrong action; a relationship route without a blocker; endpoints reported for a router nothing forwards to; routes inside `ash_authentication_live_session` lost or blocked. One core row from the JavaScript client to the resource file.
4. `test-bun/scanner-fresh-checkout.test.ts`: add `elixir: 'elixir-mix'` to the shared table and `elixir` to the list of scanners whose calls stay unresolved.

Fixtures are minimal generic worlds, not copies of real projects. No test asserts documentation text, diagnostics wording or decorative detail.

## 6. Limits stated in the scanner page

Separate Ash scanner; outgoing HTTP clients; compared-operation tokens; call targets; HEEx and EEx, LiveView and component source units, channels and sockets, AshGraphql, AshPhoenix forms, Ecto schemas, process and message relationships; expansion of other macros, `use` callbacks, protocol dispatch, `apply/3`; aliases injected by `use`; scanner settings; Plug.Router applications; forwarding to a second Phoenix router; other libraries' routing macros; Ash fragments; Mix tasks and releases as entries; Ash in discovery.
<!-- SECTION:PLAN:END -->
