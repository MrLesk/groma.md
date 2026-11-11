# Elixir scanner with Phoenix and Ash

The experimental `@groma/scanner-elixir` plugin reads Elixir source with
[tree-sitter-elixir 0.3.5](https://github.com/elixir-lang/tree-sitter-elixir/tree/v0.3.5)
on web-tree-sitter 0.27.1. The package carries its WebAssembly parser. Scanning
needs no Elixir, Erlang or Mix installation, no Hex dependencies, no project
build and no network access. It never runs Mix, evaluates source or starts the
application.

One scanner covers the language and both frameworks. Phoenix routes and Ash
resources are ordinary Elixir modules in the same Mix project, and an
AshJsonApi path is provable only together with the Phoenix router that mounts
it. There is no separate Phoenix or Ash scanner.

## Install and scan

Build a local package from the Groma repository:

```sh
bun plugins/scanners/elixir/build.ts /tmp/elixir-scanner
```

Copy it into the consumer repository as `tools/elixir-scanner`, then run:

```sh
groma plugin add ./tools/elixir-scanner
groma scanner check
groma scan
```

After publication, install with `groma plugin add @groma/scanner-elixir`.
The scanner has no settings.

## Inputs and Mix projects

The manifest selects `**/*.ex` and `**/mix.exs`. Default exclusions omit
`deps/`, `_build/` and `test/`. The configuration owns the editable include
and exclude lists; excluded files are never read.

Every selected `mix.exs` declares a Mix project at its directory. Mix compiles
only the `.ex` files under a project's `elixirc_paths`, by default `lib`, so a
file is source when it is a selected `.ex` file inside a source directory of
its nearest Mix project. Other `.ex` files, such as generator templates under
`priv/`, are not compiled by Mix and are neither listed nor parsed. `mix.exs`
supplies metadata, not Code. Other `.exs` scripts (configuration, tests,
migrations, seeds) are not read.

`elixirc_paths` is read in these forms:

- a list of strings, such as `["lib", "web"]`;
- lists joined with `++`;
- a call to a function of the same `mix.exs` module whose clauses return such
  lists, such as the generated `elixirc_paths(Mix.env())`.

The Mix environment that selects a clause is unknown without running Mix, so
the source directories are the union over all clauses. With the default
exclusions this drops `test/support` again. When the value is written in any
other form, every selected `.ex` file of that project is read as source and
the observation carries an `ELIXIR_SOURCE_ROOTS_UNREADABLE` warning for its
`mix.exs`. A project with `apps_path` is an umbrella root: it groups its child
projects and compiles no source of its own. A repository without a Mix project
is not scanned.

Each project is a source group named by its literal `app:` atom, or by its
directory. A project inside another project's directory, such as an umbrella
app, names that project as its parent. Mix projects are transient source
groups, not C4 systems or containers. Ordinary Markdown and OKF readers keep
the existing architecture records and Code links. Core owns identity, curated
source ownership, placement and derived relationships; this scanner introduces
no stored metadata and no architecture level.

## Execution entries

A Mix project supplies at most one `entryPoints` fact for the existing
container placement rule:

- its application callback, the literal `mod: {Module, args}` in
  `application/0`;
- otherwise its escript `main_module:`, written in `project/0` or returned by
  the function `project/0` calls.

An escript starts the same compiled application, so a project that declares
both has one entry, its application callback. The entry file is the one
project source that declares the module. The entry's source unit is the
project's own compiled files: no nested project and no dependency. Each
umbrella app with its own declaration is its own entry; an app without one
supplies none and stays under its system. A declaration that is not literal,
or a module that is not declared by exactly one file of the project, supplies
no entry. Mix tasks and releases are not entries.

## Code outlines

Every module is a type named by its full name, in source order. A module
nested in another module is its own type, such as `Shop.Orders.Line`; modules
are namespaces in Elixir, not members of each other. `defprotocol` is a type
whose members are its function signatures. `defimpl Protocol, for: Type` is a
type named `Protocol.Type`; without `for:` the type is the enclosing module.

Members are the functions and macros written directly in the module body with
`def`, `defp`, `defmacro`, `defmacrop`, `defguard`, `defguardp` and
`defdelegate`. A function is identified by name and arity and shown as
`name/arity`. All clauses of one name and arity are one function, listed at
its first clause; a function with default arguments is listed once, with its
full arity.

Visibility follows the definition form: `def`, `defmacro`, `defguard` and
`defdelegate` are `public`; `defp`, `defmacrop` and `defguardp` are `private`.
Modules are `public`. Elixir has no protected or internal access.

A Code link names a module by its full name and a function as
`Module.name/arity`, such as `Shop.Orders.total/2`. Naming a module never
marks its members.

Not listed: struct fields, types and callbacks; a function whose name is
computed, such as `def unquote(name)(...)`; operator definitions; a module
whose name is not a literal alias; and declarations inside a conditional
block such as `if Code.ensure_loaded?(...) do`.

## Operations and calls

`def` and `defp` functions with a body, and `defdelegate`, supply operations
with exact UTF-16 source offsets. Macros and guards run at compile time and
protocol signatures have no body, so they are outline rows without operations.

Explicit calls in a function body supply call evidence for that operation:
remote calls such as `Enum.map(...)` with their member name, and local calls
such as `helper(...)`. Every target stays unresolved, as in the Ruby and
Python scanners: what a call reaches depends on imports, macros, protocols and
run-time values this scanner does not evaluate. A function head with its
defaults and guards lends no calls. Code inside `fn`, an `&` capture or
`quote` belongs to a value or to generated code and is not attributed to the
enclosing function. The forms of `Kernel.SpecialForms`, such as `case`, `with`
and `for`, are syntax and are not calls. `defdelegate` is an operation without
a resolved call. The scanner reports no compared-operation tokens.

## Phoenix endpoints

A module is a Phoenix router when it states `use Phoenix.Router`, or
`use Web, :router` where the one selected module `Web` declares `router/0`
and writes `use Phoenix.Router` inside it, as a generated application's web
module does. No other `use` is followed.

The scanner reads these forms of `Phoenix.Router` and
`Phoenix.LiveView.Router`, with literal arguments:

| Form | Reported as |
| --- | --- |
| `get`, `post`, `put`, `patch`, `delete`, `options`, `connect`, `trace`, `head` with a path, a controller and an action atom | One endpoint for that method |
| `match :verb, path, Controller, :action` | One endpoint; `:*` accepts every method |
| `resources path, Controller` with `only`, `except`, `param`, `name`, `as` and `singleton`, and a nested block | The routes Phoenix generates, in its order, then the nested routes under `/:name_param` |
| `live path, LiveView` | One `GET` endpoint |
| `scope` with a path, an alias, `path:`, `alias:`, `as:`, `log:`, `private:` and `assigns:` | The path and module prefix of the routes inside |
| `forward path, Plug` | The routes of a mounted [AshJsonApi router](#ash), otherwise a blocker |
| `live_session` | Its routes, unchanged |
| `pipeline`, `plug`, `pipe_through` | Nothing |

A route names its handler: the controller module and the action atom. The
module is the written alias after the router's lexical aliases, placed under
the module prefix of its scopes unless the route states `alias: false`. The
endpoint resolves only when exactly one selected file declares that module and
the module declares the public function `action/2`. A `live` route is handled
by the first of `mount/3`, `handle_params/3` and `render/1` that the LiveView
module declares, the callbacks LiveView runs for the page's HTTP request.

The shared HTTP producer decisions are:

1. **Prefixes:** every `scope` path, nested scopes, the `resources` path and
   its nested member prefix, and the `forward` path of a mounted AshJsonApi
   router are part of the path. A scope whose path or alias is not literal, or
   that states `host:` or an option outside the table, is one blocker in place
   of its routes.
2. **Endpoints:** controller actions and LiveView pages answer requests.
   Pipelines and their plugs run only after a route is chosen and never change
   which route that is, so they report nothing. Endpoint-level plugs, sockets
   and channels are not read.
3. **Dynamic values:** `:name` alone in a segment is a parameter. `*name` is an
   optional catch-all, because a Phoenix glob also matches no segment. A path
   with interpolation keeps only its readable literal prefix.
4. **Helpers:** not applicable; the scanner reports no outgoing requests.
5. **Base:** not applicable, for the same reason.
6. **File-location routes:** Phoenix has none; every route names its handler.
7. **Constraints:** a segment that mixes text with a parameter, such as
   `v:version` or `:id.json`, is a constrained parameter. Phoenix has no typed
   parameters.
8. **Order:** Phoenix matches routes from top to bottom, so every endpoint
   reports `order`: the router file and the route's index in its registration
   sequence. A file that declares several routers gives all their endpoints
   position 0. A route the scanner sees but cannot read keeps its position as a
   blocker: its literal prefix, a constrained optional catch-all and method
   `*`, named after the router file's `(module)` operation. Blockers are a
   route whose handler is not exactly one selected public function, a `forward`
   to anything but a readable AshJsonApi router, an unreadable `scope` or
   `resources`, and every other call in a routing scope, including a
   conditional block such as `if Mix.env() == :dev do`. Such a call may
   register any route under its scope, so the blocker stands at the enclosing
   scope's path. The scanner encodes no other library's routes or default
   paths. Core derives no relationship to a blocker or past an earlier one.

`resources` with an `alias:`, `private:` or `assigns:` option and a `forward`
with router options stay blockers, as does a `forward` to a second Phoenix
router or to a `Plug.Router` module. Routes declared in a `Plug.Router` module
are not read.

## Limits

Every observation carries `ELIXIR_SOURCE_SCOPE`. Invalid source syntax fails
the scan with a file, line and column. This parser version is not a guarantee
for every Elixir release.

The scanner does not report outgoing HTTP requests (Req, Tesla, HTTPoison,
Finch and others), compared-operation tokens, call targets, HEEx or EEx
templates, LiveView or component source units, Phoenix channels and sockets,
AshGraphql, AshPhoenix forms, Ecto schemas, or process and message
relationships. It expands no macro, `use` callback or protocol, and follows no
`apply/3` or other dynamic dispatch. Aliases that a `use` macro injects are
invisible. It has no settings.

The [validation record](validation.md) documents fixture and external-project
evidence.
