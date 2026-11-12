# Elixir scanner validation

Automated fixtures describe generic language and framework rules. Public
projects are external validation targets, never sources of
application-specific extractor rules or copied test architecture.

## Packaged regression checks

- `test-bun/elixir-scanner.test.ts` and `test/fixtures/elixir-mix/` verify
  source selection through `elixirc_paths`, umbrella membership, a source
  directory two projects compile, the unreadable source-directory fallback,
  declarations, visibility, positions, unresolved calls, the single execution
  entry per project (also from an escript that `project/0` reads through a
  function) and Code outlines. A template under `priv/` that is not Elixir is
  never parsed. A further test scans the fixture through core and
  checks that a `Module.name/arity` Code symbol is written to architecture
  Markdown, kept by a rescan, read back unchanged and marked as an entry.
- `test-bun/elixir-phoenix.test.ts` and `test/fixtures/elixir-phoenix/` verify
  scope and resource prefixes, scope and lexical aliases, the order of
  `resources` routes with `only`, `except`, `param`, `name` and `singleton`,
  mixed and glob segments, LiveView routes inside and outside `live_session`,
  registration positions and each kind of blocker. A second Phoenix router
  that the first one forwards to reports nothing at the root. A separate test
  checks that discovery reports Elixir from `mix.exs` and Phoenix from the
  router file.
  With the built JavaScript scanner, core derives the rows from a browser
  client to the controllers that handle its requests, and no row for a route
  registered after a blocker that could take the request first.
- `test-bun/elixir-ash.test.ts` and `test/fixtures/elixir-ash/` verify action
  operations from entities and `defaults`, code interface functions on a
  domain and on a resource, AshJsonApi routes declared on a domain and on a
  resource under the Phoenix `forward` path, the shared mount position, the
  blocker that follows a mount, relationship and document blockers, a router
  with computed domains, a router nothing forwards to, a `forward` with router
  options, and routes inside `ash_authentication_live_session`. With the built JavaScript scanner, core
  derives the row from a browser client to the resource whose action answers.

Run the package and repository checks:

```sh
bun test test-bun/elixir-scanner.test.ts test-bun/elixir-phoenix.test.ts test-bun/elixir-ash.test.ts
bun plugins/scanners/elixir/build.ts /tmp/elixir-packages/elixir
GROMA_TEST_PACKAGES=/tmp/elixir-packages bun test --timeout 60000 test-bun/scanner-fresh-checkout.test.ts --test-name-pattern '^elixir package'
bun run check
```

The shared fresh-checkout suite uses the `elixir-mix` fixture, with language
tools absent and network access disabled. It compares repeated observations
and verifies that source files remain unchanged.

On 12 November 2026 the three Elixir suites pass 10 tests, the fresh-checkout
check for the built package passes, and `bun run check` passes: lint,
TypeScript, 26 Node tests, and 954 Bun tests with 65 opt-in skips and no
failure.

## Qualification on public repositories

On 12 November 2026 the built package (`@groma/scanner-elixir` 0.1.0) was
checked on the snapshots below with its default include and exclude lists and
no settings. The computer (macOS 27.2.1, arm64, Bun 1.4.4) has no Elixir,
Erlang or Mix installation. No project dependency was installed, no project
was built and no application code was run. Each repository was scanned
together with the built official scanners for its other languages:
JavaScript 0.2.4, TypeScript 0.2.5, React 0.2.5, Go 0.2.3, Python 0.2.3 and
PHP 0.2.2.

Two procedures ran on every snapshot:

1. **Scanner interface.** With an empty `PATH` and network fetches rejected:
   readiness, the source listing, two complete scans (the Elixir repeat with
   the selected input order reversed), outline loading for every reported
   Elixir source, and core's HTTP relationship rule over all observations
   together. SHA-256 hashes of every selected input matched before and after,
   and the checkout stayed clean.
2. **CLI flow** on a fresh clone of the same commit: `init --directory groma`,
   `plugin add` for each built package, `scanner check`, `scan` and a repeat
   `scan`. Afterwards Git reported only Groma's own `groma/` directory and
   `AGENTS.md`.

Ten repositories contain another language that an official scanner read
together with Elixir. Five of them use Ash.

| Repository | Exact commit | Companion scanners | Elixir inputs / sources | Modules | Functions | Ash actions | Interface functions | Entries | Endpoints bound / blockers | Frontend rows |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [tunez](https://github.com/sevenseacat/tunez), branch `end-of-chapter-10` (Ash) | `5ea6daeac0d8634bca22cddd3fc7331f6391f3c3` | JavaScript | 43 / 42 | 42 | 107 | 42 | 17 | 1 | 17 / 12 | 0 |
| [realworld](https://github.com/team-alembic/realworld) (Ash) | `0ee23dfb2ff0b93e9483c910d30f737b710b2509` | JavaScript | 45 / 44 | 44 | 99 | 26 | 12 | 1 | 8 / 3 | 0 |
| [noted_ash](https://github.com/joangavelan/noted_ash) (Ash) | `9aab813df533661e1c74072dbaa008d65acac146` | TypeScript, React | 41 / 40 | 41 | 98 | 42 | 26 | 1 | 36 / 1 | 1 |
| [chironium](https://github.com/sealambda/chironium) (Ash) | `447f76c85ac18717d721dc3ea151a9f4c3d3f7f9` | TypeScript, React, JavaScript | 250 / 249 | 252 | 586 | 9 | 3 | 1 | 12 / 8 | 0 |
| [ash_admin](https://github.com/ash-project/ash_admin) (Ash) | `82ea7f384ef2eceeb4312a9dc91a0ac2e891d3c8` | JavaScript | 61 / 60 | 62 | 340 | 59 | 0 | 0 | 0 / 0 | 0 |
| [papercups](https://github.com/papercups-io/papercups) | `6a6f5adc7f0cef5813b2c2f1c0659922defaf976` | TypeScript, React, JavaScript | 248 / 247 | 254 | 1493 | 0 | 0 | 1 | 262 / 5 | 0 |
| [plausible](https://github.com/plausible/analytics) | `f7b763dd41dd62362d102393180baaf155b7b294` | TypeScript, React, JavaScript, PHP | 640 / 639 | 684 | 4222 | 0 | 0 | 1 | 166 / 24 | 0 |
| [livebook](https://github.com/livebook-dev/livebook) | `8804d28662e4958961a33bd5344ca736ce44bf2b` | JavaScript, Python | 317 / 314 | 332 | 3296 | 0 | 0 | 2 | 64 / 1 | 1 |
| [sequin](https://github.com/sequinstream/sequin) | `46ce4e1048437575ce3c40ebb3eb589a4b9e4f27` | Go, TypeScript, JavaScript | 351 / 349 | 434 | 3044 | 0 | 0 | 2 | 91 / 5 | 0 |
| [teslamate](https://github.com/teslamate-org/teslamate) | `e8f031902a422388a52db3d87a5a41bd297d0def` | JavaScript | 95 / 94 | 114 | 720 | 0 | 0 | 1 | 13 / 0 | 0 |

Inputs are the selected `.ex` and `mix.exs` files; the difference to sources
is the `mix.exs` files. Functions are the `def`, `defp` and `defdelegate`
operations. Every Elixir scan repeated identically, also with reversed input.
No file failed to parse. The companion scanners reported these source counts:
tunez JavaScript 4; realworld JavaScript 3; noted_ash TypeScript 38 and React
34; chironium TypeScript 320, React 209 and JavaScript 6; ash_admin JavaScript
5; papercups TypeScript 182, React 154 and JavaScript 6; plausible TypeScript
169, React 120, JavaScript 67 and PHP 1; livebook JavaScript 74 and Python 1;
sequin Go 46, TypeScript 42 and JavaScript 11; teslamate JavaScript 8.

For every reported function, action and call in these ten snapshots and in the
four below (21,106 functions, 182 actions and 83,249 calls), the UTF-16
position was checked against the source text: a function position starts its
`def`, `defp` or `defdelegate` with that name, an action position starts its
entity or its `defaults` entry, and a call position and line start that call.
All positions matched. One reported call is a grammar misreading: in ash,
`lib/ash/type_resolver.ex:228` writes the range `cycle_start..-1//1`, which
tree-sitter-elixir 0.3.5 reads as a call of `cycle_start`. It stays an
unresolved call and derives nothing.

After the review fixes for a Phoenix router reached through `forward` and for
`forward` with router options, the scanner-interface procedure was repeated
on all fourteen snapshots. Every Elixir observation is byte-identical to the
one before the fixes: none of these repositories forwards to a second Phoenix
router or writes router options on a `forward`. No number or witness on this
page changed, and the CLI results below stand.

### CLI flow

| Repository | Scanners added | First scan | Repeat scan | Owned source files | Files with two owners | Containers from entries |
| --- | --- | --- | --- | ---: | ---: | --- |
| tunez | Elixir, JavaScript | created 48 | created 0, refreshed 46 | 46 | 0 | `tunez` |
| realworld | Elixir, JavaScript | created 49 | created 0, refreshed 47 | 47 | 0 | `realworld` |
| noted_ash | Elixir, TypeScript | created 80 | created 0, refreshed 78 | 78 | 0 | `noted` |
| chironium | Elixir, TypeScript, React, JavaScript | created 578 | created 0, refreshed 575 | 575 | 0 | `chironium`, and one JavaScript command |
| ash_admin | Elixir, JavaScript | created 66 | created 0, refreshed 65 | 65 | 0 | none |
| papercups | Elixir, TypeScript, React, JavaScript | created 437 | created 0, refreshed 435 | 435 | 0 | `chat_api` |
| plausible | Elixir, TypeScript, React, JavaScript, PHP | created 880 | created 0, refreshed 876 | 876 | 0 | `plausible`, and two JavaScript commands |
| livebook | Elixir, JavaScript, Python | created 392 | created 0, refreshed 389 | 389 | 0 | `livebook`, `livebook_space` |
| sequin | Elixir, Go, TypeScript, JavaScript | created 454 | created 0, refreshed 448 | 448 | 0 | `sequin`, `elixir_broadway`, the Go `cli`, and two TypeScript commands |
| teslamate | Elixir, JavaScript | created 105 | created 0, refreshed 102 | 102 | 0 | `teslamate`, and one JavaScript command |

`scanner check` reported every Elixir project ready. The architecture
directory was byte-identical after the repeat scan in every repository. The
derived relationships in Markdown are the two frontend rows below.

### Source witnesses

Each statement was checked against the files at the commits above.

- **tunez.** Entry: `mix.exs:24` `mod: {Tunez.Application, []}` gives
  `lib/tunez/application.ex` with all 42 sources. Outline:
  `lib/tunez/music.ex:47` `define :create_artist, action: :create` is the
  member `create_artist` of `Tunez.Music`; `lib/tunez/music/artist.ex:43`
  `read :search do` is the operation `Tunez.Music.Artist.search (action)`.
  Endpoints: `lib/tunez_web/router.ex:71` forwards `/` inside
  `scope "/api/json"` to `TunezWeb.AshJsonApiRouter`, whose domains are
  `[Tunez.Music, Tunez.Accounts]`; `lib/tunez/music.ex:24-31` declares
  `base_route "/artists"` with `index :search` and `related :albums, :read`,
  reported as `GET /api/json/artists` on `Tunez.Music.Artist.search (action)`
  and `GET /api/json/artists/:id/albums` on `Tunez.Music.Artist.read (action)`.
  Eleven AshJsonApi routes are bound. The six LiveView routes inside
  `ash_authentication_live_session` (router lines 44-49) are `GET` endpoints
  on their `mount/3`. Its JavaScript sends no request, so there is no row.
- **realworld.** Entry: `mix.exs:27`. Outline:
  `lib/realworld/accounts/accounts.ex:20`
  `define :get_user_by_username` is a member of the accounts domain. Endpoints:
  `live "/", PageLive.Index, :index` (`lib/realworld_web/router.ex:30`) is
  `GET /` on `RealworldWeb.PageLive.Index.mount/3`
  (`lib/realworld_web/live/page_live/index.ex:6`). No JavaScript request.
- **noted_ash.** Row: `assets/js/components/UserSearchResults.tsx:20`
  `axios.get("/workspace/search-users")` reaches
  `get "/search-users", WorkspaceController, :search_users`
  (`lib/noted_web/router.ex:70`, inside `scope "/workspace", NotedWeb`) and
  `NotedWeb.WorkspaceController.search_users/2`
  (`lib/noted_web/controllers/workspace_controller.ex:57`). All 36 routes are
  bound; `resources "/notes", NotesController, except: [:index, :show]` gives
  edit, new, create, update (`PATCH` and `PUT`) and delete in Phoenix's order.
  The other frontend calls go through Inertia, which no scanner reads as a
  request.
- **chironium.** Entry: `mix.exs:25`. Endpoints:
  `get "/", PortalController, :request` in `scope "/portal", ChironiumWeb`
  (`lib/chironium_web/router.ex:97`) is `GET /portal` on
  `ChironiumWeb.PortalController.request/2`
  (`lib/chironium_web/controllers/portal_controller.ex:47`). The frontend's
  `POST /portal/gql` meets the blocker for `forward` to `Absinthe.Plug`, so no
  row is derived.
- **ash_admin.** Its `elixirc_paths(:dev)` is `["lib", "dev"]`
  (`mix.exs:36-38`), so the 18 demonstration resources under `dev/` are
  sources; with one resource in `lib/` they supply 59 actions. `application/0` is declared inside
  `if Mix.env() == :text do` (`mix.exs:135`), so no entry is reported.
- **papercups.** Entry: `mix.exs:28`. Endpoints:
  `resources("/upload", UploadController, only: [:create, :show, :delete])`
  (`lib/chat_api_web/router.ex:43`) reports `POST /api/upload` on
  `ChatApiWeb.UploadController.create/2` and two blockers, because the
  controller declares only `create` (`upload_controller.ex:11`). Singleton
  resources report `POST /api/session` and `DELETE /api/session`. The React
  client sends its requests through `superagent` (`assets/src/api.ts:1`),
  which the TypeScript scanner does not recognize, so no row is derived.
- **plausible.** Entry: `mix.exs:41`. Endpoints:
  `post "/:domain/query", StatsController, :query`
  (`lib/plausible_web/router.ex:305`) is `POST /api/stats/:domain/query` on
  `PlausibleWeb.Api.StatsController.query/2`
  (`lib/plausible_web/controllers/api/stats_controller.ex:19`). The dashboard
  sends its requests through a helper with computed URLs
  (`assets/js/dashboard/api.ts`), which TypeScript reports as unknown.
- **livebook.** Entries: `mix.exs:46` declares the application callback and
  `mix.exs:100` an escript `main_module`; one entry, `lib/livebook/application.ex`,
  with 312 sources, and a second project `iframe/mix.exs:17`. Row:
  `assets/js/hooks/js_view.js:513-517` fetches
  `window.LIVEBOOK_PUBLIC_BASE_URL_PATH + "/public/health"`, a configured base,
  and reaches `get "/health", HealthController, :index` in
  `scope "/public", LivebookWeb` (`lib/livebook_web/router.ex:49-52`) and
  `LivebookWeb.HealthController.index/2`.
- **sequin.** Entries: `mix.exs:25` and the example project
  `examples/elixir_broadway/mix.exs:18`. Endpoints:
  `post("/config/plan", YamlController, :plan)`
  (`lib/sequin_web/router.ex:192`). The Go command line builds
  `fmt.Sprintf("%s/api/config/plan", serverURL)` (`cli/config/config.go:415`),
  which the Go scanner reports as an unknown base, so no row is derived.
- **teslamate.** Entry: `elixir/mix.exs:42`. All 13 routes of
  `elixir/lib/teslamate_web/router.ex` are bound: four controller routes, the
  seven `live` routes inside `live_session :default` (lines 38-45) and two
  `put` routes under `scope "/api"`. Its JavaScript sends no request.

### Blockers and what they hide

A blocker keeps core from deriving a relationship to any route registered
after it under its path. The count on the right is the number of bound
endpoints that stand behind an earlier blocker in the same router.

| Repository | Statements that became blockers | Bound endpoints behind a blocker |
| --- | --- | ---: |
| tunez | `forward` to `Absinthe.Plug.GraphiQL`, `Absinthe.Plug` and `OpenApiSpex.Plug.SwaggerUI`; the router's `open_api` document; the remainder of the AshJsonApi mount; AshAuthentication's `auth_routes`, `sign_out_route`, `sign_in_route`, `reset_route`, `confirm_route` and `magic_sign_in_route`; `if Application.compile_env(:tunez, :dev_routes)` | 0 of 17: all of them follow the routes |
| realworld | `auth_routes`, `sign_out_route`, `if Mix.env() in [:dev, :test]` | 8 of 8: `auth_routes` is the first statement of the root scope |
| noted_ash | `if Application.compile_env(:noted, :dev_routes)` | 0 of 36 |
| chironium | four `if Application.compile_env(:chironium, :dev_routes)` blocks, `forward` to `Absinthe.Plug` twice, `auth_routes`, `reset_route` | 12 of 12: the first conditional block precedes every route |
| papercups | `forward` to `PhoenixSwagger.Plug.SwaggerUI`, two `resources` actions the controller does not declare, two `if Mix.env()` blocks | 5 of 262: `POST /api/upload` and the four routes after the conditional blocks |
| plausible | fifteen `on_ee do` and one `on_ce do` blocks (the project's own edition macros), two `if Mix.env()` blocks, three `forward` calls and three routes without a selected handler | 166 of 166: a conditional block precedes every route |
| livebook | `live_dashboard "/dashboard"` | 3 of 64 |
| sequin | four `if` blocks on `@self_hosted` or a compile-time setting, `live_dashboard` | 88 of 91: the first conditional block is the fourth registration |
| teslamate | none | 0 of 13 |

Compile-time conditional blocks at the router root are the most frequent
cause, ahead of other libraries' routing macros. They are the first candidate
for a narrower rule, such as reading the documented forms inside a conditional
block as blockers at their own paths.

### Repositories that did not qualify together

- [ash_typescript](https://github.com/ash-project/ash_typescript) at
  `5d6e80aec1afcbabaf0831768c210fecd81bd869`: 115 Elixir sources, 131 modules
  and 1267 functions scan and repeat identically, and the CLI flow passes. Its
  Ash resources and all its TypeScript live under `test/`, which both scanners
  exclude by default, so no Ash evidence and no TypeScript observation exist.
  Eight files declare their only module inside
  `if Code.ensure_loaded?(Igniter) do` and have no outline.
- [hapesire](https://github.com/q60/hapesire) at
  `78cece6026c39e9493d76ee5abc426721d2962cb`: 11 sources, 4 Ash actions and 4
  interface functions, one entry. It has no other scanned language. Its
  AshJsonApi router is mounted by a `Plug.Router`
  (`lib/hapesire_web/plug_router.ex:30`), which the scanner does not read, so
  no endpoint is reported.

Two framework repositories were scanned as parser checks:
[phoenix](https://github.com/phoenixframework/phoenix) at
`789f851c3cda02f56702a16700ebba48d270cbd3` (85 sources, with JavaScript 26) and
[ash](https://github.com/ash-project/ash) at
`a80903c2051f651a018249b63618a87e267327d6` (660 sources). Both parse
completely and repeat identically.

### What could not be scanned together

- **Rust.** The Rust scanner package could not be built on this computer: it
  requires rustc 1.99 and rustc 1.91.1 is installed. The three Rust files of
  livebook and the seven of teslamate were not scanned.
- **Svelte.** sequin's 206 Svelte files have no official scanner.
- **React through the CLI on noted_ash.** With the React scanner added, `groma
  scan` stops with `undefined is not an object (evaluating
  'name.toLowerCase')`: `assets/package.json` states no `name`, the React
  scanner reports its package root without one, and core cannot name it. The
  failure is in the React scanner and core, outside this scanner, and was not
  changed here. The scanner-interface run includes React; the CLI flow for
  noted_ash ran with Elixir and TypeScript.

### Reproduced failure and its general fix

livebook's `elixirc_paths` is `["lib", "proto/lib"]` (`mix.exs:64`), and
`proto/` is also a Mix project. Assigning each file to its nearest project
left the files of `proto/lib` out of the livebook application, although Mix
compiles them into it. A file now belongs to every project whose source
directories contain it, and the application's entry includes them (312
sources instead of 265). The `elixir-mix` fixture has the same shape with
generic names, and its test failed before the change.

### Unsupported outcomes

- chironium declares 35 of its resources through its own base modules, such as
  `use Chironium.BaseResources.Identifiable`
  (`lib/chironium/base_resources/identifiable.ex:6-8` wraps `use
  Ash.Resource`). Only modules that state `use Ash.Resource` themselves are
  read, so 9 actions are reported.
- A module declared inside a conditional block is not reported: ash_typescript
  (8 files), sequin (`lib/sequin/havoc.ex`), livebook (`lib/livebook_app.ex`)
  and plausible (`lib/plausible_web/storybook.ex`).
- Source directories are the union over Mix environments. phoenix's
  `elixirc_paths(:docs)` adds `installer/lib`, so its entry lists those 12
  files although only the documentation environment compiles them there.
- No proven row from a frontend to an AshJsonApi route exists in these
  repositories: tunez has the routes but no client request, and the other Ash
  applications use LiveView, Inertia or GraphQL. The `elixir-ash` fixture
  proves the rule.

These checks qualify the documented extraction subset and its core
integration. They do not establish complete Elixir, Phoenix or Ash support,
each application's runtime route table, or runtime network behavior.
