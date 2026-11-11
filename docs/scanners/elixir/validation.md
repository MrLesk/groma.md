# Elixir scanner validation

Automated fixtures describe generic language and framework rules. Public
projects are external validation targets, never sources of
application-specific extractor rules or copied test architecture.

## Packaged regression checks

- `test-bun/elixir-scanner.test.ts` and `test/fixtures/elixir-mix/` verify
  source selection through `elixirc_paths`, umbrella membership, the unreadable
  source-directory fallback, declarations, visibility, positions, unresolved
  calls, the single execution entry per project and Code outlines. A template
  under `priv/` that is not Elixir is never parsed. A second test scans the
  fixture through core and checks that a `Module.name/arity` Code symbol is
  written to architecture Markdown, read back unchanged and marked as an entry.

- `test-bun/elixir-phoenix.test.ts` and `test/fixtures/elixir-phoenix/` verify
  scope and resource prefixes, scope and lexical aliases, the order of
  `resources` routes, mixed and glob segments, LiveView routes inside and
  outside `live_session`, registration positions and each kind of blocker.
  Discovery reports Elixir from `mix.exs` and Phoenix from the router file.
  With the built JavaScript scanner, core derives the rows from a browser
  client to the controllers that handle its requests, and no row for a route
  registered after a blocker that could take the request first.

Run the package and repository checks:

```sh
bun test test-bun/elixir-scanner.test.ts test-bun/elixir-phoenix.test.ts
bun plugins/scanners/elixir/build.ts /tmp/elixir-packages/elixir
GROMA_TEST_PACKAGES=/tmp/elixir-packages bun test --timeout 60000 test-bun/scanner-fresh-checkout.test.ts --test-name-pattern '^elixir package'
bun run check
```

The shared fresh-checkout suite uses the `elixir-mix` fixture, with language
tools absent and network access disabled. It compares repeated observations
and verifies that source files remain unchanged.
