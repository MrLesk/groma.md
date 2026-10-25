# Ruby scanner validation

Automated fixtures describe generic language and framework rules. NomadNest is
an external validation target, never a source of application-specific extractor
rules or copied test architecture.

## Packaged regression checks

- `test-bun/ruby-scanner.test.ts` and `test/fixtures/ruby-rails/` verify
  source selection, basic declarations, visibility, positions, unresolved calls,
  Rails handler binding and code outlines. Invalid excluded specs are not parsed.
- `test-bun/ruby-constructs.test.ts` and
  `test/fixtures/ruby-rails-constructs/` verify resource contexts, irregular
  inflection, singular resources, nested paths, member/collection actions,
  `%i[...]`, registration order, singleton/concern ownership and nested operations.
  A public class helper cannot expose a private instance action.
- `test-bun/ruby-coverage.test.ts` and `test/fixtures/ruby-coverage/` verify
  nearest project membership, nested project boundaries, gem executables, file
  guards, Rack/Rails entries, local requires, binding-normalized method bodies
  and an actual core duplicate finding. Constructed types supply named operations
  without static type outlines; a named arrow lambda supplies an outline without
  a standalone compared operation.
- `test-bun/ruby-http.test.ts` uses the coverage fixture and the minimal
  `test/fixtures/ruby-http-blocked/`. It checks methods, paths, configured bases,
  URI values, client/session identity and unknown values. Core derives the proven
  client/handler row and abstains when an earlier unknown mount can capture it.
  A nested type's client field cannot become an outer type's client.

The project/entry, comparison, HTTP, blocker and receiver-isolation regressions
were observed failing before their corresponding implementations or fixes.

Run the package and repository checks:

```sh
bun test test-bun/ruby-scanner.test.ts test-bun/ruby-constructs.test.ts test-bun/ruby-coverage.test.ts test-bun/ruby-http.test.ts
bun plugins/scanners/ruby/build.ts /tmp/ruby-packages/ruby
GROMA_TEST_PACKAGES=/tmp/ruby-packages bun test --timeout 60000 test-bun/scanner-fresh-checkout.test.ts --test-name-pattern '^ruby package'
bun run check
```

The shared fresh-checkout suite uses the coverage fixture, with language tools
absent and network access disabled. It compares repeated observations and verifies
that source files remain unchanged. Application gems are not installed or loaded.

## NomadNest qualification

On 25 October 2026, the local package was tested against NomadNest commit
`c12c2466bfb22b9d49d0c5b0324080ed5c12284c`. Only scanner-selected inputs were
copied into isolated repositories. The original checkout stayed clean and hashes
of all selected original files were unchanged. No application dependencies were
installed and no Rails code or project test suite was executed.

| Check | Result |
| --- | --- |
| Inputs | 172 selected paths; 168 Ruby sources, including Rack configuration and Ruby command scripts |
| Project roots | Gemfile declares one Ruby project |
| Named source evidence | All 588 independently inventoried method declarations have operations and comparison tokens |
| Non-compared operations | One route-file module operation carries uncertainty blockers |
| Rails endpoints | 137 resolved local handler facts, retaining the previously qualified handler facts |
| Route uncertainty | 19 blocker facts for external, missing or unsupported routes |
| Requests | 10 HTTP request facts; helper parameters and literal external hosts remain unknown |
| Execution | `config.ru` supplies one Rack/Rails entry with 110 selected application/configuration sources |
| Core placement | One application container; 110 components placed, with 168 source components in total |
| Core findings | The CLI reports 65 possible duplicate-logic findings for review |

The 588 methods include newly selected executable scripts; the earlier Ruby-only
inventory of 548 methods is therefore not a like-for-like input count. Supported
standard Ruby constructs also recover the named methods in an executable's
constructed module. Unknown constructed ownership is not asserted as a static type.

Local package installation, readiness, scan and `groma lint` were exercised through
the CLI. Positive execution evidence creates the application container; package
folders alone do not. The findings are review candidates, not confirmed defects.

The outgoing requests in this source remain non-comparable because they use
external literal hosts or unresolved helper parameters. This does not establish
client-to-endpoint arrows. The independent HTTP fixture verifies that comparable
facts can derive a row and that uncertainty blocks false rows.

These checks qualify the documented extraction subset and its core integration.
They do not establish complete Ruby metaprogramming support, every client-library
API, the application's runtime route table, or runtime network behavior.
