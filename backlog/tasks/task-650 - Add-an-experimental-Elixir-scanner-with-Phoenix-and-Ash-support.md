---
id: TASK-650
title: Add an experimental Elixir scanner with Phoenix and Ash support
status: Done
assignee:
  - '@claude'
created_date: '2026-11-11T22:51:00Z'
updated_date: '2026-11-12T07:15:00Z'
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
  - elixir-src-index
modified_files:
  - plugins/scanners/elixir/package.json
  - bun.lock
  - plugins/scanners/elixir/ELIXIR-GRAMMAR-NOTICE
  - plugins/scanners/elixir/build.ts
  - plugins/scanners/elixir/src/parser.ts
  - plugins/scanners/elixir/src/syntax.ts
  - plugins/scanners/elixir/src/aliases.ts
  - plugins/scanners/elixir/src/modules.ts
  - plugins/scanners/elixir/src/calls.ts
  - plugins/scanners/elixir/src/mix.ts
  - plugins/scanners/elixir/src/source.ts
  - plugins/scanners/elixir/src/index.ts
  - test/fixtures/elixir-mix/apps/dynamic/mix.exs
  - test/fixtures/elixir-mix/apps/dynamic/src/plugin.ex
  - test/fixtures/elixir-mix/apps/shop/extra/audit.ex
  - test/fixtures/elixir-mix/apps/shop/lib/shop/application.ex
  - test/fixtures/elixir-mix/apps/shop/lib/shop/cli.ex
  - test/fixtures/elixir-mix/apps/shop/lib/shop/orders.ex
  - test/fixtures/elixir-mix/apps/shop/mix.exs
  - test/fixtures/elixir-mix/apps/shop/priv/templates/report.ex
  - test/fixtures/elixir-mix/apps/shop/test/support/broken.ex
  - test/fixtures/elixir-mix/apps/tool/lib/tool/cli.ex
  - test/fixtures/elixir-mix/apps/tool/lib/tool/shape.ex
  - test/fixtures/elixir-mix/apps/tool/mix.exs
  - test/fixtures/elixir-mix/lib/stray.ex
  - test/fixtures/elixir-mix/mix.exs
  - docs/scanners/elixir/index.md
  - docs/scanners/elixir/validation.md
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - .github/workflows/ci.yml
  - test-bun/scanner-fresh-checkout.test.ts
  - test-bun/elixir-scanner.test.ts
  - plugins/scanners/elixir/src/phoenix/paths.ts
  - plugins/scanners/elixir/src/phoenix/router.ts
  - plugins/scanners/elixir/src/phoenix/endpoints.ts
  - test/fixtures/elixir-phoenix/assets/js/app.js
  - test/fixtures/elixir-phoenix/lib/portal/application.ex
  - test/fixtures/elixir-phoenix/lib/portal_web.ex
  - test/fixtures/elixir-phoenix/lib/portal_web/controllers/item_controller.ex
  - test/fixtures/elixir-phoenix/lib/portal_web/controllers/late_controller.ex
  - test/fixtures/elixir-phoenix/lib/portal_web/controllers/note_controller.ex
  - test/fixtures/elixir-phoenix/lib/portal_web/live/board_live.ex
  - test/fixtures/elixir-phoenix/lib/portal_web/live/empty_live.ex
  - test/fixtures/elixir-phoenix/lib/portal_web/live/plain_live.ex
  - test/fixtures/elixir-phoenix/lib/portal_web/reports/summary_controller.ex
  - test/fixtures/elixir-phoenix/lib/portal_web/router.ex
  - test/fixtures/elixir-phoenix/mix.exs
  - test-bun/elixir-phoenix.test.ts
  - plugins/scanners/elixir/src/ash/dsl.ts
  - plugins/scanners/elixir/src/ash/resource.ts
  - plugins/scanners/elixir/src/ash/code-interface.ts
  - plugins/scanners/elixir/src/ash/json-api.ts
  - plugins/scanners/elixir/src/ash/domain.ts
  - plugins/scanners/elixir/src/ash/mount.ts
  - plugins/scanners/elixir/src/ash/index.ts
  - test/fixtures/elixir-ash/assets/js/app.js
  - test/fixtures/elixir-ash/lib/desk/application.ex
  - test/fixtures/elixir-ash/lib/desk/support.ex
  - test/fixtures/elixir-ash/lib/desk/support/note.ex
  - test/fixtures/elixir-ash/lib/desk/support/ticket.ex
  - test/fixtures/elixir-ash/lib/desk_web.ex
  - test/fixtures/elixir-ash/lib/desk_web/controllers/late_controller.ex
  - test/fixtures/elixir-ash/lib/desk_web/dynamic_router.ex
  - test/fixtures/elixir-ash/lib/desk_web/json_api_router.ex
  - test/fixtures/elixir-ash/lib/desk_web/live/home_live.ex
  - test/fixtures/elixir-ash/lib/desk_web/router.ex
  - test/fixtures/elixir-ash/lib/desk_web/spare_router.ex
  - test/fixtures/elixir-ash/mix.exs
  - test-bun/elixir-fixture.ts
  - test-bun/elixir-ash.test.ts
  - README.md
  - docs/scanners/index.md
  - docs/scanners/discovery.md
  - docs/scanners/evidence.md
  - docs/scanners/creating-a-plugin.md
  - test/fixtures/elixir-mix/apps/shop/proto/mix.exs
  - test/fixtures/elixir-mix/apps/shop/proto/lib/wire.ex
  - groma/systems/groma-md/containers/cli/components/elixir-src-index.md
  - test/fixtures/elixir-phoenix/lib/portal_web/admin_router.ex
  - features/elixir-phoenix-ash.feature
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
- [x] #1 A packaged elixir scanner scans a Mix project from a fresh checkout without Elixir, Erlang, Mix, Hex dependencies, a project build or application execution, and a repeat scan is identical.
- [x] #2 Elixir source listing, Mix project membership including umbrella apps, declarations, visibility and Code outlines follow the existing scanner contract; Mix projects stay source groups and never become C4 boundaries.
- [x] #3 A Mix project supplies one execution entry from its application callback, or from its escript main module when it declares no callback, with its own compiled source through the existing placement contract.
- [x] #4 Named functions supply operations and call evidence; call targets stay unresolved, as in the Ruby and Python scanners.
- [x] #5 Phoenix router declarations supply HTTP endpoints with their complete declared path and the local controller action that handles them, answering the eight producer decisions; routes the scanner cannot read remain blockers.
- [x] #6 Ash resources and domains supply what their DSL declares and plain Elixir parsing cannot see: resource actions as operations, code-interface functions as declarations, and AshJsonApi routes as HTTP endpoints under the prefix where the Phoenix router mounts them.
- [x] #7 Discovery reports Elixir from Mix declarations and Phoenix from its router file through the existing rule types, Ash is documented as supported without a discovery clue, and the scanner is integrated with the official catalog, release staging and CI like the other tree-sitter scanners.
- [x] #8 Scanner documentation states inputs, supported constructs and limits, and the validation record covers at least eight open source repositories at exact commits that also contain other languages, at least three of them using Ash, scanned together with the official scanners for those languages: source witnesses for outlines, entries, endpoints and frontend-to-backend rows or their explicit uncertainty, identical repeat scans and unchanged source.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Status: implemented. The choices in section 4 were settled for this task on 2026-11-12 as the educated guess Alex asked for; he has not confirmed them individually. Acceptance criteria 3, 4, 6 and 7 were amended to match. Sections 1 to 6 describe the final approach, including the two points settled during implementation and qualification, which are marked as such.

## 1. Result and flow

One package, `plugins/scanners/elixir` (`@groma/scanner-elixir` 0.1.0, id `elixir`, experimental), laid out like the Ruby scanner. Engine: tree-sitter-elixir 0.3.5 (official elixir-lang grammar, Apache-2.0, prebuilt `tree-sitter-elixir.wasm`, SHA-256 ed99093c548c12d43f7e337fd3440e9e2daa2ec671a5e29aadb6c6dcb2232a62) on web-tree-sitter 0.27.1, the version the Ruby scanner pins. The package ships the grammar LICENSE, a verbatim copy of the grammar repository's NOTICE (committed beside the scanner because the npm package omits it) and the web-tree-sitter LICENSE.

Flow, entry to result:

1. `src/index.ts` (the `ScannerPlugin`): `listSourceFiles`, `checkReadiness`, `scan`, `readCodeStructure`. Orchestration only.
2. `src/mix.ts`: reads each selected `mix.exs` (app name, `elixirc_paths`, `apps_path`, application `mod:`, escript `main_module:`), builds project roots with parent links, decides which `.ex` files are source, and builds the one execution entry per project.
3. `src/parser.ts` and `src/syntax.ts`: load the bundled grammar, fail on invalid syntax with file, line and column, and give small readers for calls, do-blocks, keyword options and literals.
4. `src/modules.ts`: module scopes (`defmodule`, `defprotocol`, `defimpl`) and the `def` family. `src/source.ts`: symbols, outline declarations and operations for one file. `src/calls.ts`: unresolved call evidence inside named function bodies.
5. `src/aliases.ts`: the lexical alias environment, used only where a declaration names a module: Mix entry modules, Phoenix handlers and Ash module references. Each reference is read with the aliases in force where it is written (`aliasesAt` in `modules.ts`).
6. `src/phoenix/`: everything Phoenix. `router.ts` reads router modules (`scope`, verbs, `match`, `resources`, `forward`, `live`, `live_session`, blockers) into route declarations in registration order, `paths.ts` reads path patterns, `endpoints.ts` binds each route to its handler. `router.ts` also decides which candidate modules are proven routers.
7. `src/ash/`: everything Ash. `resource.ts` (actions), `code-interface.ts` (`define`), `domain.ts`, `json-api.ts` (AshJsonApi routes and routers), `mount.ts` (what a router serves under a Phoenix `forward`), and `index.ts` with the AshAuthentication `ash_authentication_live_session` wrapper name.
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

## 4. Choices settled for this task

A. Sources. Include `**/*.ex` and `**/mix.exs`; exclude `deps/`, `_build/`, `test/`. Mix compiles only `.ex` files under `elixirc_paths` (default `lib`), so a source is a selected `.ex` file inside a source root of a Mix project. Settled during qualification: a file belongs to every project whose source roots contain it, because a project's roots can reach into another project (`["lib", "proto/lib"]` beside `proto/mix.exs`). `mix.exs` is metadata without Code. Other `.exs` scripts are not read. `elixirc_paths` is read when it is a list of strings, lists joined with `++`, or a call to a function of the same `mix.exs` module whose clauses are such lists; the roots are the union over all clauses, because the Mix environment is not known without running Mix. An unreadable value makes every selected `.ex` file of that project that no nested project claims a source and adds a warning diagnostic. A project with a literal `apps_path` is an umbrella root and compiles no source of its own. A repository without a Mix project is not scanned.

B. Projects. Every selected `mix.exs` is a root of kind `project`, named by its literal `app:` atom, else its directory. Parent is the nearest enclosing Mix project, which covers umbrella apps.

C. Outlines, symbols, operations. A module is a `type` named by its full name; nested modules are their own types (`Outer.Inner`). `defprotocol` is a type whose members are its signatures. `defimpl` with a literal protocol and one literal `for:` (or the enclosing module) is a type named `Protocol.For`. A function is identified by name and arity; all clauses of one name and arity are one function at its first clause. Members are `def`, `defp`, `defmacro`, `defmacrop`, `defguard`, `defguardp`, `defdelegate`, shown as `name/arity`; Code links spell them `Module.name/arity`. Visibility: `public` for modules and `def`, `defmacro`, `defguard`, `defdelegate`; `private` for `defp`, `defmacrop`, `defguardp`. Operations are `def`, `defp` and `defdelegate`; macros and guards are symbols and outline rows without operations. Not listed: computed names, operator definitions, modules whose name is not a literal alias, declarations inside conditional blocks. Condition set with this choice: a fixture scan through core must show these symbols written to architecture Markdown, read back unchanged and matched by `entry`; if `/` cannot round-trip, stop and report.

D. Calls. Calls inside named function bodies are reported with unresolved targets only, as the Ruby and Python scanners do: remote calls with their member name, local calls without one. `fn`, `&` captures and `quote` are not entered; Kernel special forms are syntax, not calls. No target resolution and no function index for calls: core derives no row from ordinary resolved calls. `defdelegate` is a declaration and an operation without a resolved call.

E. Execution entries. One entry per Mix project: its literal application callback `mod: {Module, args}`, else its literal escript `main_module:`, each read through the aliases declared in the `mix.exs` module. `file` is the one selected file declaring that module, `declaration` the `mix.exs`, `name` the app name, `files` every source the project compiles (no dependency). Unreadable or unresolved declarations give no entry.

F. Phoenix. A router is a module with a literal `use Phoenix.Router`, or `use Web, :router` where the one selected module `Web` declares `router/0` containing `use Phoenix.Router`.
1. Prefixes: every `scope` path (positional or `path:`), nested scopes, the `resources` path and its nested member prefix `/:name_param`, and the `forward` path of a mounted AshJsonApi router. A scope with a non-literal path or alias, a `host:` option or an unsupported option is one blocker in place of its routes.
2. Endpoints: the nine verb macros, `match`, `resources` and `live`. `pipeline`, `plug` and `pipe_through` report nothing. A controller route is handled by the one public function `action/2` of the one selected module that the scope alias and lexical aliases name. A `live` route is an exact `GET` endpoint handled by the first of `mount/3`, `handle_params/3`, `render/1` in the one selected LiveView module; an unknown module or one with none of these is a blocker under the unknown-handler rule.
3. Segments: `:name` is a parameter, `*name` an optional catch-all, an interpolated path is a blocker after its readable prefix.
4, 5. Not applicable: no outgoing requests. 6. Phoenix has no file-location routes.
7. A segment mixing text and a parameter (`v:version`) is a constrained parameter.
8. Order: every endpoint carries `order`, the router file and its index in the registration sequence; `resources` routes take Phoenix's own emission order and the nested block follows. Blockers name the router file's `(module)` operation: an unresolved handler, `forward` to anything but a readable AshJsonApi router, an unreadable scope or `resources`, a conditional block, and every call in a routing scope that is not a documented form, each at the enclosing scope prefix. No other library's default paths are encoded. Exactly two path-preserving block wrappers are read through to their child routes: `live_session`, and AshAuthentication's `ash_authentication_live_session`, whose name lives in the Ash module. A file that declares several routers gives all its endpoints position 0. A `forward` that carries router options as a fourth argument, bracketed or as trailing `key: value` pairs, is a blocker. A Phoenix router that another Phoenix router forwards to reports no endpoints of its own, because it serves under that mount path, which the forward's blocker covers; every other router is assumed to be plugged at the root by its endpoint.

G. Ash. A resource is a module with a literal `use Ash.Resource`, a domain one with `use Ash.Domain`.
- Actions: each `create`, `read`, `update`, `destroy` or `action` with a literal name inside `actions do`, and each name in a literal `defaults` list, is one operation in the resource file. Actions are not outline rows.
- Code interfaces: `define :name` inside a resource's `code_interface` or a domain's `resources do resource R do ... end end` contributes a symbol and an outline member on that module, shown by its bare name because its arities are not provable without expansion. No operation and no call. Omitted: `define_calculation`, names ending in `?`, and a `functions:`, `namespace` or `define?` option.
- AshJsonApi: routes inside `json_api do routes do ... end end` of a resource (`base`) or a domain (`base_route`, nested, or with the resource as first argument). A module with a literal `use AshJsonApi.Router, domains: [...]` serves the routes of its domains and of the resources those domains list. The routes become endpoints only where a Phoenix router forwards to that module: path is scope prefix, forward path, base, route; method follows the route kind; the operation is the resource action the route names. All routes of one mount share the forward's position. Settled during implementation: the mounted router answers every other request under its path as well, so the next position holds one blocker for the whole mount path, and a later Phoenix route under that path derives nothing. Blockers inside a mount: relationship routes without an action, a route whose action the resource does not declare exactly once, the router's `open_api` and `json_schema` documents and a domain's schema route. As for any unknown handler, such a blocker covers its literal prefix, which for a relationship route is the resource's whole base path. The whole mount is one blocker when any part of it is unreadable. A router no Phoenix router forwards to reports nothing.

H. Discovery, without a core or contract change. A `text` rule reports Elixir from `**/mix.exs` with its `elixir:` requirement as version. A `file` rule reports Phoenix from the generator's router location `**/lib/*_web/router.ex`, which covers the single-application layout (`lib/app_web/router.ex`) and the umbrella layout (`apps/app_web/lib/app_web/router.ex`) of the current `phx.new` templates. `ash` stays in `technologies` without a rule; the scanner page documents that gap.

## 5. Tests and their justification

All tests build the package, use `test.concurrent`, own their temporary directories, and load only `test/fixtures/`. No existing test covers Elixir.

1. `test-bun/elixir-scanner.test.ts` with `test/fixtures/elixir-mix/` (an umbrella with an application app, an escript app, a project with computed source directories and a nested project whose `lib` the application also compiles). Rules and authority: AC 1 to 4 and 7, the listing, outline and observation contracts, and the round-trip condition of choice C. Wrong results it detects: a `.ex` file outside the source roots or an `.exs` script listed or parsed (the fixture holds an unparsable template under `priv/`); a file assigned to the umbrella root instead of its app; a file two projects compile assigned to one of them only (reproduced on livebook, the test failed before the fix); two operations for a two-clause function; a call reported with a target; a `defp` shown public; an entry that includes another app's files, or a second entry for an escript beside an application callback; output that changes when the input order is reversed; invalid source that does not fail with its file and line; a `Module.name/arity` Code symbol that core drops, rewrites or fails to mark as entry after a scan.
2. `test-bun/elixir-phoenix.test.ts` with `test/fixtures/elixir-phoenix/`. Authority: AC 5 and 7 and the producer checklist. Wrong results: a path missing a scope or resource prefix; a handler bound without the scope alias; `resources` routes in the wrong order; a `live` route reported as a root blocker or without its `GET` handler; an unknown macro, conditional block, unknown forward or unresolved handler that leaves no blocker; a second Phoenix router reached through `forward` that reports its routes at the root (failed before the fix). A separate test in the same file: Phoenix not discovered from the router file. With the built JavaScript scanner on a small client file and core's `httpRelationships`: the proven row exists, and no row is derived for a route registered after a blocker.
3. `test-bun/elixir-ash.test.ts` with `test/fixtures/elixir-ash/`. Authority: AC 6. Wrong results: an action from `defaults` missing; a `define` on a domain attributed to the resource, given an operation, or missing from the outline; an AshJsonApi path without the Phoenix forward prefix or base; a route bound to the wrong action; a relationship route without a blocker; endpoints reported for a router nothing forwards to; a Phoenix route registered after a mount, under its path, that still derives a row; routes inside `ash_authentication_live_session` lost or blocked; a `forward` with router options written as trailing keywords that still mounts the scoped module (failed before the fix). One core row from the JavaScript client to the resource file.
4. `test-bun/scanner-fresh-checkout.test.ts`: add `elixir: 'elixir-mix'` to the shared table and `elixir` to the list of scanners whose calls stay unresolved.

Fixtures are minimal generic worlds, not copies of real projects. No test asserts documentation text, diagnostics wording or decorative detail.

One setup helper for all three files: `withFixture` in `test-bun/elixir-fixture.ts` copies a fixture into a fresh repository and builds the scanner packages beside it.

Product flow: `features/elixir-phoenix-ash.feature` states the three supported scenarios, as `CONTRIBUTING.md` requires.

## 6. Limits stated in the scanner page

Separate Ash scanner; outgoing HTTP clients; compared-operation tokens; call targets; HEEx and EEx, LiveView and component source units, channels and sockets, AshGraphql, AshPhoenix forms, Ecto schemas, process and message relationships; expansion of other macros, `use` callbacks, protocol dispatch, `apply/3`; aliases injected by `use`; scanner settings; Plug.Router applications; forwarding to a second Phoenix router; other libraries' routing macros; Ash fragments; Mix tasks and releases as entries; Ash in discovery.

## 7. Verification

- `bun test test-bun/elixir-scanner.test.ts test-bun/elixir-phoenix.test.ts test-bun/elixir-ash.test.ts`: 10 pass.
- Fresh-checkout suite for the built package (`--test-name-pattern '^elixir package'`): 1 pass.
- `bun run check`: lint, TypeScript, 26 Node tests, 954 Bun tests with 65 opt-in skips, no failure.
- Qualification: `docs/scanners/elixir/validation.md` (ten repositories with another scanned language, five using Ash; two more Ash repositories and two framework repositories as recorded limits and parser checks).
- Architecture: the scanner's 18 source files are one component, `elixir-src-index` (Elixir source scanner), in the CLI container beside the other language scanners.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Milestone 1 (language evidence): package skeleton, bundled tree-sitter-elixir 0.3.5 parser, Mix project and source selection, modules, name/arity outlines, operations, unresolved calls and one execution entry per project; catalog, release staging, CI and fresh-checkout integration. Round trip confirmed through core: a Code symbol Shop.Orders.total/2 written by core's Markdown writer survives a rescan, reads back unchanged and marks its outline entry; a symbol the scan does not report is removed by the rescan, so the test fails when the spelling differs. Checks: bun test test-bun/elixir-scanner.test.ts (4 pass), fresh-checkout elixir package (1 pass), typecheck and Biome lint clean.

Milestone 2 (Phoenix): router recognition (use Phoenix.Router, or use Web, :router proven through the web module's router/0), scope, verbs, match, resources, forward, live and live_session, path reading, blockers and registration order. The phoenix fixture scan returns 18 endpoints in registration order; with the built JavaScript scanner core derives the two proven rows and none for a route registered after a blocker. Checks: elixir-scanner and elixir-phoenix tests (6 pass), typecheck and Biome lint clean.

Milestone 3 (Ash): resource actions as operations, code-interface define entries as bare-name declarations on their host module, AshJsonApi routes of domains and resources mounted under the Phoenix forward of their router, and the ash_authentication_live_session wrapper. Two points decided during implementation and stated in the scanner page: (1) a readable mount is followed by a blocker for the whole mount path at the next position, because the mounted router answers every other request under that path; (2) a relationship route without an action is a blocker at its literal prefix, as chosen for this task, which covers the resource's whole base path. Checks: elixir-scanner, elixir-phoenix and elixir-ash tests (9 pass), typecheck and Biome lint clean.

Milestone 5 (qualification): twelve application repositories and two framework repositories scanned at exact commits with the built package and the built JavaScript, TypeScript, React, Go, Python and PHP scanners; ten qualify together with another language, five of them use Ash. All Elixir scans repeat identically with reversed input, no file failed to parse, 21,106 function, 182 action and 83,249 call positions match the source, the CLI flow creates nothing on the repeat scan, no file has two owners and sources stay unchanged. Proven frontend rows: noted_ash (axios to a Phoenix controller) and livebook (fetch with a configured base). Reproduced failure fixed in the general rule: a file belongs to every Mix project whose source directories contain it (livebook compiles proto/lib into its application); the elixir-mix test failed before the change. Not scanned together: Rust (the Rust scanner needs rustc 1.99, 1.91.1 is installed), Svelte (no scanner), and React through the CLI on noted_ash, where core fails on the React scanner's unnamed package root (outside this task, unchanged). Details in docs/scanners/elixir/validation.md.

Quality and specification review (own): split the resources reader into a definition and its routes, simplified function head reading, renamed the framework-generated function type to GeneratedFunction so it is not confused with FunctionDeclaration, replaced object lookups by Maps so a call named like an Object.prototype member cannot match a form, and reused moduleUses in the Mix reader. All 14 validation observations are byte-identical before and after these refactors. The repository's own scan created 18 stand-alone components for the scanner sources; they were moved to the cli container and combined into elixir-src-index (Elixir source scanner, group Language scanners), which a rescan leaves unchanged. Final checks on 2026-11-12: bun run check exit 0 (Biome lint with 2 warnings and 2 infos in files this task does not touch, TypeScript, 26 Node tests pass, 953 Bun tests pass, 65 skipped, 0 failed); Elixir suites 9 pass; fresh-checkout elixir package 1 pass.

Open points for Alex, not changed here: (1) a relationship route without an action is a blocker at its literal prefix, as chosen for this task, which is the resource's whole base path, so such a resource derives no row; (2) compile-time conditional blocks at the router root are the most frequent blocker in the qualification (plausible, sequin and chironium lose every row to one), a candidate for a narrower rule; (3) resources built through a base module (use MyApp.BaseResource wrapping use Ash.Resource) are not recognized, 35 of chironium's resources; (4) core fails with name.toLowerCase on the React scanner's package root when assets/package.json states no name (noted_ash), outside this task; (5) the tree-sitter loader in parser.ts repeats the ada, mojo, mql5 and ruby copies, which groma lint reports; a shared helper would touch other scanners.

Review round (cold simplicity review and full-context complexity review, applied together on 2026-11-12). Defects fixed, each with a fixture row that failed first: (1) a Phoenix router that another Phoenix router forwards to no longer reports its routes at the root; (2) a forward with router options is a blocker in both spellings, bracketed and trailing keywords. Simplifications: readSource returns plain data only (the Ash generated functions with their syntax nodes stay inside the parse callback); MountLookup lost its unreadable state; the proven-router decision lives in phoenix/router.ts (provenRouters) and phoenixEndpoints lost that parameter; wrapper names travel in RoutingScope; calls.ts reuses body(); MountedRoute became ServedRoute; the parent project lookup lost its root special case; one uniquelyNamed helper replaces three copies of the declared-once rule; aliasesBefore and aliasesAt are one function; the redundant parser load in readiness is gone. Tests: one withFixture helper, discovery in its own test, the YAML spelling assertion removed, escript spellings swapped so the function form is observed, the resources rows use except, param, name and singleton. Added features/elixir-phoenix-ash.feature. The scanner-interface qualification was repeated on all fourteen snapshots: every Elixir observation is byte-identical, so the validation numbers stand. Final checks: bun run check exit 0 (26 Node tests pass, 954 Bun tests pass, 65 skipped, 0 failed), Elixir suites 10 pass, fresh-checkout elixir package 1 pass; the repository's own rescan creates nothing and leaves groma/ unchanged. Not changed: groma lint now also lists liveRoute and forwardRoute as similar; they state different rules in six lines each.

Pull request review finding (mix.ts entry modules), 2026-11-12: reproduced. With an alias declared inside the mix.exs module (alias Shop.Application, as: App with mod: {App, []}, and alias Tool.CLI with main_module: CLI), the existing entry assertion failed with no entries, because the entry module was read with the aliases from before the module body. Fixed by reading both references with aliasesAt at their declaration, the same way the Phoenix and Ash readers do; mix.ts has no alias rule of its own. The two fixture mix.exs files keep the aliased spelling, so the existing entry assertion covers the application callback and the escript path; no test was added. Checks after the fix: Elixir suites 10 pass, fresh-checkout elixir package 1 pass, bun run check exit 0 (26 Node tests pass, 954 Bun tests pass, 65 skipped, 0 failed). All fourteen qualification observations are byte-identical, and the repository's own rescan leaves groma/ unchanged. The scanner page and the validation counts needed no change.

Reviews complete, 2026-11-12: a cold simplicity review and a final complexity review ran after the implementation; their merged findings were applied in commit 024fde8d with nothing declined. The automated pull request review raised one finding (aliased Mix entry modules), fixed in 090e3322; its review of that head found no further issues. The three Elixir suites pass 10 tests on that head.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the experimental Elixir scanner package (plugins/scanners/elixir, @groma/scanner-elixir 0.1.0, id elixir) with Phoenix and Ash support inside it, so Elixir source reaches the map, Code outlines and derived HTTP relationships. It bundles tree-sitter-elixir 0.3.5 and reads source only; it never runs Elixir, Erlang or Mix.

What it reports: Mix projects as source groups and the .ex files they compile (elixirc_paths, umbrella apps, a file shared by two projects); one execution entry per project from its application callback, else its escript main module; modules as outline types with name/arity members and Elixir visibility; operations for def, defp and defdelegate with unresolved calls; Phoenix routes as endpoints in registration order, bound to the controller action or LiveView callback that handles them; Ash resource actions as operations, code-interface functions as declarations, and AshJsonApi routes as endpoints under the Phoenix forward that mounts their router. The scanner is in the official catalog, release staging, CI and the fresh-checkout suite, has a Gherkin scenario in features/elixir-phoenix-ash.feature, and is documented in docs/scanners/elixir with the shared scanner pages updated.

Stated limits: call targets stay unresolved, and there are no outgoing HTTP requests and no compared-operation tokens. A route the scanner cannot read is a blocker: an unknown handler, a forward to anything but a readable AshJsonApi router, a host-bound or unreadable scope, a conditional block, and any other library's routing macro, each for its whole scope path. AshJsonApi routes are reported only under a Phoenix forward; a relationship route without an action blocks its resource's base path. Only modules that state use Ash.Resource or use Ash.Domain themselves are read. Modules declared inside a conditional block are not reported. Source directories are the union over Mix environments. Discovery reports Elixir from mix.exs and Phoenix from the router file; Ash has no discovery clue. The scope choices were settled for this task as an educated guess and are not individually confirmed product decisions.

Verification: the three Elixir suites pass 10 tests; the fresh-checkout package test passes with no language tools and no network; bun run check exits 0 with 26 Node tests and 954 Bun tests passing, 65 skipped and none failed. A Code symbol of the form Module.name/arity survives core's Markdown round trip and marks its outline entry. Qualification on ten public repositories with another scanned language, five of them using Ash, at exact commits: identical repeat scans, no parse failure, 21,106 function and 83,249 call positions matching the source, no file with two owners, unchanged sources, and two proven frontend rows (noted_ash and livebook). Details and per-repository blockers are in docs/scanners/elixir/validation.md.

Follow-ups are listed as open points in the Implementation Notes: narrower blockers for conditional router blocks, relationship routes without an action, Ash resources declared through a base module, and a shared tree-sitter loader.
<!-- SECTION:FINAL_SUMMARY:END -->
