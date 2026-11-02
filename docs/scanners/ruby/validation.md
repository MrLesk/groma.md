# Ruby scanner validation

Automated fixtures describe generic language and framework rules. Public projects
and NomadNest are external validation targets, never sources of application-specific
extractor rules or copied test architecture.

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
The nested-project fixture uses a one-character directory to distinguish it from
the repository root. Compared-body checks also distinguish a block-only local
from a later method call, while preserving equivalent block-local renaming and
captured outer locals.

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

## Maintainer qualification on six public repositories

On 26 October 2026, the built package passed with default selection and exclusion
settings on all six snapshots below. No extra exclusions were added. Scanner
execution had an empty PATH and rejected network fetches. No Ruby installation,
project dependency installation, project build or application execution was used.

| Repository | Exact commit | Selected inputs | Ruby sources | Named methods | Files with outlines |
| --- | --- | ---: | ---: | ---: | ---: |
| [puma](https://github.com/puma/puma) | `bbffd8dfb78bc37b557c8a78c04582498f8da38f` | 66 | 63 | 658 | 52 |
| [rails](https://github.com/rails/rails) | `ad242026bf6a7f3f0db133749e80cf40884a9060` | 1627 | 1598 | 15711 | 1529 |
| [rack](https://github.com/rack/rack) | `412b7e5250612e8b23095eee65ee3268addb4776` | 53 | 51 | 567 | 50 |
| [sinatra](https://github.com/sinatra/sinatra) | `cb22afd7902b566b6eaba6c4ea89739494a65d12` | 63 | 57 | 569 | 50 |
| [lobsters](https://github.com/lobsters/lobsters) | `ceb5e71f0d9f5b8ea20b4d96c6c46e1aed27a913` | 393 | 390 | 1017 | 319 |
| [chatwoot](https://github.com/chatwoot/chatwoot) | `bfa47377144440959bb1074e65d53a153818e31b` | 1848 | 1845 | 10889 | 1786 |

Each snapshot passed readiness, source listing, two complete scans with reversed
input order, and outline loading for every reported source. The complete
observations were identical. Every named method's UTF-16 position and line range
was checked against source text; three declaration witnesses per repository were
inspected. SHA-256 hashes of every selected input matched before and after the
checks, and all original Git checkouts remained clean.

Representative declaration witnesses are `Puma::DSL#http_content_length_limit`
(`lib/puma/dsl.rb:1662`), `ActionCable::Channel::Base#defer_subscription_confirmation!`
(`actioncable/lib/action_cable/channel/base.rb:266`),
`Rack::Auth::AbstractHandler#initialize` (`lib/rack/auth/abstract/handler.rb:15`),
`Sinatra::Helpers#logger` (`lib/sinatra/base.rb:373`),
`AboutController#four_oh_four` (`app/controllers/about_controller.rb:7`), and
`ContactIdentifyAction#merge_if_existing_email_contact`
(`app/actions/contact_identify_action.rb:36`). These are source checks, not
application-specific extractor rules or automated fixtures.

Lobsters supplies two execution entries, 118 resolved handler facts and 111
uncertainty blockers. Chatwoot supplies one entry, 108 resolved handlers and 154
blockers. These counts describe the supported literal routing subset, not either
application's complete runtime route table. Puma supplies three command entries;
Rails supplies one entry and two route blockers. Sinatra supplies three outgoing
HTTP facts; Rails supplies one. The other snapshots supply no outgoing facts.

A separate copy of Lobsters' selected inputs passed the published Groma 0.7.8
CLI flow: `init --directory groma`, `plugin add` with the built local package,
`scanner check`, `scan`, repeated `scan`, and source-owner lookup. The first scan
created 393 architecture records; the repeat created zero and refreshed 390.
The 54 duplicate-logic findings are review candidates. Original checkouts were
not used as Groma output directories.

The Ruby HTTP pass now skips binding analysis when no supported client is
imported. All request producers already require one of those imports. The Rails
qualification (two scans and all outlines) fell from 354.46 seconds to 6.73 seconds
on the same machine; the evidence counts were unchanged. This is a local timing
observation, not a benchmark across platforms.

## Combined Ruby and Vue qualification

On 26 October 2026, both built packages were checked together against these
additional snapshots. Vue uses its pinned compiler and no application dependencies.
Each successful scanner result passed readiness and two complete scans with the
selected input order reversed. Observations and core HTTP rows were identical, including
when the scanner order was reversed. All selected-input SHA-256 hashes matched
before and after scanning; original Git checkouts remained clean.

| Repository | Exact commit | Ruby sources | Vue-owned sources / SFCs | Proven frontend-to-Rails rows |
| --- | --- | ---: | ---: | ---: |
| [Chatwoot](https://github.com/chatwoot/chatwoot) | `bfa47377144440959bb1074e65d53a153818e31b` | 1845 | 2483 / 1245 | 0 |
| [Loomio](https://github.com/loomio/loomio) | `24380e2131c1e43594a241814f3f460a9b0065f6` | 1898 | 540 / 242 | 1 |
| [Docuseal](https://github.com/docusealco/docuseal) | `13a1835c006e218e2e48ede3eb153812bd025a05` | 422 | 161 / 71 | 4 |
| [Zammad](https://github.com/zammad/zammad) | `e735c02c6bf53b939c690839158d06c1b097c7c8` | Parser failure | 3533 / 672 | Not qualified together |
| [Dashy](https://github.com/Lissy93/dashy) | `93a33d945c8b84e5dd37c8bef103770d4701d175` | Not applicable | 306 / 174 | Not applicable |
| [Vue REPL](https://github.com/vuejs/repl) | `9b5bc873415bbc6fcba6080b9402d140175d5b03` | Not applicable | 41 / 16 | Not applicable |

All six Vue scans completed. Zammad's Ruby scan is a failure, not a partial
success: its anonymous block forwarding in `app/controllers/graphql_controller.rb:70`
is rejected by tree-sitter-ruby 0.23.1. The Microsoft tree-sitter WASM package's
Ruby asset has the same SHA-256 as the pinned asset and rejects the same syntax;
changing that download would not repair the grammar. No source exclusion,
project patch, per-file recovery or application execution was used.

These independent projects exposed shared causes:

- Chatwoot, Loomio and Docuseal have Vue source without an applicable TypeScript
  config. The scanner previously returned no project. It now forms an in-memory
  compiler configuration from selected source. An unrelated test config, such
  as Chatwoot's Playwright config, does not configure the application.
- Reversing selected input paths changed Vue evidence order on Chatwoot, Loomio,
  Zammad and Vue REPL. Source paths are now ordered before project compilation.
- Docuseal and Dashy have parseable templates with render-generation diagnostics.
  The scanner now reports those diagnostics as warnings while preserving readable
  source facts. Actual source syntax errors still fail the scan.
- Loomio and Docuseal place API routes in a namespace with a response-format
  default. Rails request guards around engines also became root catch-all
  blockers. Namespace paths and guarded child paths are now retained; guarded
  endpoints remain uncertain. No repository names, URL mappings or error-code
  exceptions enter extraction.

Loomio's `vue/src/components/report/page.vue:388` calls `GET /api/v1/reports`.
The namespace and resource declaration in `config/routes.rb:137-151` resolve to
`Api::V1::ReportsController#index` in
`app/controllers/api/v1/reports_controller.rb:2`.
Docuseal's `app/javascript/submission_form/form.vue:1612` calls
`POST /api/submitter_form_views` after a configured base; its literal namespace
and resource declaration resolve to `Api::SubmitterFormViewsController#create`
in `app/controllers/api/submitter_form_views_controller.rb:5`. The other three
Docuseal rows connect autocomplete and user-configuration browser callers to
their selected local controllers. Each row was checked against the source.

Chatwoot yields 18 frontend HTTP request facts and 262 Rails endpoint/blocker
facts. Its directly readable sign-in request targets an external Devise route;
other calls depend on wrappers, unresolved bases, conditional enterprise routing,
or an optional format suffix not represented by the supported path facts.
Zero proven rows therefore remains an explicit coverage result, not proof of no
frontend/backend interaction. The scanner does not manufacture targets.

Separate selected-source copies of Loomio and Chatwoot also passed the released
Groma 0.7.8 CLI flow: init, install both local packages, readiness, scan and rescan.
Loomio retained 2438 unique physical source owners and its one HTTP relationship.
Chatwoot retained 4328 unique source owners and 90 Vue event relationships; it
still has no proven frontend-to-Rails HTTP row. Owner IDs and relationship records
were unchanged on the second scan. The copied source bytes matched the originals.

The generic `test-bun/ruby-vue.test.ts` uses the existing coverage fixture with
one Vue client and an API controller. It verifies a config-free scan, preserved
HTTP evidence despite a template-generation warning, the API relationship through
a namespace format default, and no relationship past an earlier guarded engine.
An unknown full URL stays unknown and malformed template syntax still fails.
The config-free, input-order, template-generation and namespace/guard regressions
were observed failing before their fixes. These tests contain no external
application code or architecture.

## Additional parser limits

Four additional public snapshots did not qualify. Their selected source reaches
syntax rejected by the bundled tree-sitter-ruby 0.23.1 parser. They are recorded
as failures; no source patch, extra exclusion, fallback or partial observation was
used to turn them into a success.

| Repository and commit | First reported parser location |
| --- | --- |
| [rubocop](https://github.com/rubocop/rubocop) `04be5a255f9ab32afd3c2f9bcf891bd71b5e8489` | `lib/rubocop/cop/style/perl_backrefs.rb:83:16` |
| [sidekiq](https://github.com/sidekiq/sidekiq) `0aaab7f396c02e3d0d5262535e5d8b8533959195` | `lib/sidekiq/cli.rb:259:18` |
| [forem](https://github.com/forem/forem) `c8f8ed49963b13b026b03e40341b37df7f63e3ab` | `app/services/ai/content_moderation_labeler.rb:1:1` |
| [discourse](https://github.com/discourse/discourse) `882af7fc25634228aed91f625021838bc6d28fcf` | `lib/json_api_kit/version_change/declaration.rb:1:1` |

The RuboCop location uses the `:$'` symbol spelling, and Sidekiq uses an unquoted
Unicode symbol. Forem and Discourse are file-level parser failures; their precise
grammar cause was not established. All selected input hashes and clean Git states
were preserved for these failed checks as well. The scanner contract permits a
concrete failure for unsupported syntax; these limits remain explicit and are not
claims of complete Ruby support.

## Maintainer regression and repository checks

The private-action redefinition, block-parameter URL, nearest-project ranking and
block-local token regressions failed before their fixes and pass afterward. The first reuses the existing controller-route
assertion; the second adds one assertion to the existing HTTP test. The built
package also includes this validation record beside its README.

The block-local correction follows [Ruby assignment scope](https://ruby-doc.org/3.3/syntax/assignment_rdoc.html#label-Local+Variable+Scope):
new block locals stay in their block, and existing outer locals remain captured.
The token visitor now binds assignments in its current scope and source order.
A separate automated URL suggestion was not applied: the shared
[HTTP producer rule](../evidence.md#producer-checklist) classifies a computed
value filling one complete source segment as dynamic, without asking whether its
runtime value might contain slashes. Leading unknown bases and partial computed
segments retain their existing uncertainty.

The focused Ruby and Vue suites pass 29 tests with 194 assertions. The isolated package
check passes 1 test with 7 assertions. Required development tools are Bun 1.4.4
and Node 26.12.1; the complete check uses Node's bundled npm 11.20.0.
`bun run check` passes: lint, TypeScript, 26 Node tests, and 938 Bun tests
with 64 opt-in skips and zero failures. The earlier
31 tool/configuration failures from the initial qualification are cleared in this
provisioned environment. A separate trial with npm 12.2.1 exposed its changed
`npm pack --json` output shape; no Ruby change or weakened assertion was used to
address that unrelated environment difference.

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

## Production configuration qualification

`test-bun/ruby-runtime.test.ts` builds the package and verifies production YAML aliases, unresolved ERB expressions, one source-owned PostgreSQL container, its storage relationship and Solid Queue hosted through Puma. It also checks selection exclusions, disabled hosting, persistence and stable rescans. Run it with the packaged regression checks above.

The local scanner and core were installed in NomadNest on 29 October 2026. The rendered map showed one PostgreSQL production container, four logical database roles, the Rails storage relationship, and source-linked hosted Solid Queue configuration. A repeat scan created no additional records. These results describe checked-in configuration; live deployment was not verified.

The combined ERB and runtime implementation completed `bun run check` locally: lint and TypeScript passed, Node passed 26 tests, and Bun reported 908 passed, 64 skipped and 31 failed. Of those failures, 22 require unavailable JVM tools and 6 require unavailable `swiftc`. Three native npm CA-configuration failures retain an unverified underlying cause. The Ruby assertions passed; the full local suite remains non-green.

The isolated runtime PR branch was then checked against upstream `b088b2eea41872ad7dd2db32a3366e4ba62c535d`: lint and TypeScript passed, Node passed 26 tests, and Bun reported 914 passed, 64 skipped and 31 failed. The same failure categories remain: 22 unavailable JVM tools, 6 unavailable `swiftc`, and 3 unresolved native npm CA-configuration failures. All runtime and Ruby assertions passed. The memory guard did not trigger; minimum sampled available memory was 5617 MiB.
