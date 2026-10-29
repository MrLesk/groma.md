# Ruby and Rails scanner

The experimental `@groma/scanner-ruby` plugin uses
[tree-sitter-ruby 0.23.1](https://github.com/tree-sitter/tree-sitter-ruby/tree/v0.23.1)
with web-tree-sitter 0.27.1. The package carries its WebAssembly parser and
`inflection` 3.0.2. Scanning needs no Ruby installation, Bundler, installed gems,
application build or network access. It never evaluates application or package code.

## Install and scan

Build a local package from the Groma repository:

```sh
bun plugins/scanners/ruby/build.ts /tmp/ruby-scanner
```

Copy it into the consumer repository as `tools/ruby-scanner`, then run:

```sh
groma plugin add ./tools/ruby-scanner
groma scanner check
groma scan
```

After publication, install with `groma plugin add @groma/scanner-ruby`.
The scanner returns the same source, entry, operation and HTTP evidence contracts
as Python. Both leave ordinary dynamic call targets unresolved.

## Inputs and project membership

The manifest selects `**/*.rb`, `**/*.ru`, `**/*.erb`, `**/bin/*`, `**/exe/*`,
`**/Gemfile` and `**/*.gemspec`. Extensionless commands are Ruby source only
when their first line is a Ruby shebang. Listing reads that marker without
parsing or running the command. Other selected bin scripts contribute no Code.
Gemfiles and gemspecs supply metadata, not Code ownership.

Default exclusions omit vendor, temporary, log, coverage, test and spec folders,
plus `db/schema.rb` and `db/structure.sql`. The existing configuration owns
editable include/exclude lists; excluded files are never read.

Every selected Gemfile or gemspec declares a project at its directory. Sources
belong to their nearest declared project. Nested projects retain parent links;
source without a declaration belongs to a repository source group. A literal
`spec.name` in a `Gem::Specification.new` block names its project; other names
come from the directory. The scanner parses these declarations without executing
the Ruby DSL, resolving gems or loading installed dependencies.

Projects are transient source groups, not C4 systems or containers. Ordinary
Markdown and OKF readers retain existing architecture records and Code links.
Core owns identity, curated source ownership, placement and derived relationships;
this scanner introduces no new stored metadata or architecture level.

### ERB templates

The scanner selects `.erb` templates, including compound extensions such as `.html.erb`, `.js.erb` and `.yml.erb`. It reads Ruby inside execution tags (`<% ... %>`), output tags (`<%= ... %>`) and whitespace-trimming tags (`<%- ... -%>`). Ruby blocks can span tags. Literal template text, ERB comments (`<%# ... %>`) and escaped tags (`<%% ... %>`) contribute no Ruby declarations.

`src/erb.ts` replaces template text and delimiters with spaces and statement separators before `src/index.ts` sends the embedded code to the existing Ruby parser. It preserves UTF-16 offsets and line breaks, so named Ruby declarations, method calls and Code outlines address the original template. A template containing only markup or expressions still contributes a file reference; expressions do not become named methods.

Templates retain their nearest declared project and join the existing source membership of a proven Rails application under `app/`. A template does not declare a launch entry. The scanner leaves render calls, partial lookup, helper dispatch and route helpers unresolved. It does not infer relationships from HTML links or JavaScript, parse the surrounding language, or evaluate templates. Percent-line shorthand requires an ERB trim-mode setting and is not supported.

Template methods do not supply duplicate-body comparison tokens because literal output affects their behavior and the Ruby projection omits that output. Invalid embedded Ruby and unclosed ERB tags stop the scan with a template-specific error. Tag syntax follows the [Ruby ERB documentation](https://docs.ruby-lang.org/en/master/ERB.html).

## Execution entries

Positive launch declarations supply `entryPoints` for the existing container
placement rule:

- A Ruby equality guard between `__FILE__` and `$PROGRAM_NAME` or `$0`.
- Selected Ruby commands named by literal gemspec `executables` and `bindir`
  declarations; the default bindir is `bin`.
- A direct `run` declaration in `config.ru`.

Each entry includes itself and selected local sources reachable through literal
`require_relative` or `require`. Relative requires resolve beside their source;
ordinary requires resolve from the project directory or its `lib` directory.
Only one selected matching file is accepted. Requires inside methods or
anonymous blocks do not supply a loading closure. The closure stops at separately
declared project boundaries; an imported dependency does not become owned by the
application.

An explicit `run Rails.application` whose require closure declares a subclass of
`Rails::Application` also supplies that project's selected Ruby files under
`app/`, `config/initializers/`, `config/environments/`, and `config/routes.rb`.
Literal `config.autoload_lib(ignore: ...)` adds the selected `lib/` sources outside
the named ignored directories. This models Rails' standard application input
unit, not which environment or method executes at runtime. Custom autoload/build
configuration, Rack mappings, dynamic requires, gem-installed code and command
directories outside the declared input patterns are not inferred.

An entry is positive execution evidence. Its source folders alone never establish
a container. Core merges entries by physical file, places unambiguous components,
preserves curated ownership and leaves shared or unknown placement under its system.

## Code outlines and calls

Top-level classes, modules, methods and directly assigned arrow lambdas supply
outlines. A module also namespaces directly declared classes and modules.
Members include instance methods, `def self.method`, and methods inside
`class << self`. Nested types contribute symbols and operations but remain
absent from outlines under the shared contract.

Code names distinguish `Module::Type#method` instance methods from
`Module::Type.method` singleton methods. A module explicitly extending
`ActiveSupport::Concern` contributes its `class_methods` definitions as
`Concern::ClassMethods#method`: Rails defines instance methods on that generated
module. They appear under the declaring concern in the outline. The scanner does
not infer which including classes receive them.

Standalone `public`, `protected` and `private` directives apply in their own body.
Instance `initialize` is private. Singleton methods default to public; visibility
inside a singleton-class body does not change later instance methods.
Top-level methods and script-local lambda bindings are private.
An entry link names its exact symbol; naming a type never marks all its members.

Named methods inside a `Module.new` or `Class.new` block assigned to a name also
supply operations. Their constructed owner is labelled by the source binding in
parentheses, such as `(factory)#convert`; no static type outline or controller
identity is invented.

Explicit method-body calls provide invocation positions and owning operations.
All targets remain unresolved. Anonymous blocks, lambdas, declaration headers
and type initialization do not lend invocation facts to an enclosing method.
Computed visibility, attribute macros, arbitrary-object singleton classes and
other metaprogramming remain outside the declared analysis.

## Compared operations

Every supported named method supplies its inclusive declaration line range and
binding-normalized body tokens for `groma lint` and scan findings. Parameters
receive slots in declaration order; other assigned locals receive slots in
declaration order. Block parameters and block-local names have their own bindings.
Names of methods, constants and instance state remain significant, as do
operators, parentheses and literal values. Comments and declaration headers
are excluded. Harmless renaming of local bindings does not hide a copy.

Anonymous callbacks, including a named variable holding a lambda, are not
standalone compared operations. Their syntax can remain within a containing
named method's body, as in Python. Module initializers carry no comparison
tokens. Core owns minimum body sizes, similarity and finding presentation.

## Rails endpoints

Direct declarations in `Rails.application.routes.draw` support literal HTTP
verbs with `to: 'controller#action'`, the hash-mapping route spelling, `root`,
plural and singular resources, nested resource blocks, `member`, `collection`
and literal namespaces, including a literal `defaults: { format: ... }`. The
format default does not add an optional suffix to the observed path. Resource options include `only`, `except`, `controller`
and `path`; action filters accept symbols, arrays and `%i[...]`.

Nested plural resources use a singular parent parameter such as `:person_id`.
Member actions use `:id`; collection and singular resource actions add no own
ID segment. Conventional English inflection, including irregular nouns, comes
from the bundled library. Custom application inflections are not loaded.

An endpoint resolves only to one public instance method in the matching selected
local controller file, under the same application directory. Missing, non-public,
redeclared, dynamic or external handlers are not guessed.

The shared HTTP producer decisions are:

1. **Prefixes:** namespaces and resource/member/collection prefixes remain in
   the path. An unreadable scope reports its readable prefix as a blocker.
2. **Endpoints:** controller actions answer requests. Middleware, source imports
   and application launch declarations are not endpoints.
3. **Dynamic values:** literal segments and whole `:parameter` segments are
   read directly. Unsupported path expressions retain only their readable prefix.
4. **Helpers:** routing helpers and includes are not evaluated.
5. **Base:** outgoing configuration and host handling follows the request rules below.
6. **File-location routes:** Ruby/Rails has no supported file-location route form;
   a controller method must be identified.
7. **Constraints:** an unreadable or constrained route is a conservative blocker:
   its readable literal prefix plus a constrained optional catch-all, method `*`.
   The scanner does not widen it into an unconstrained route.
8. **Order:** routes retain registration order. Rails evaluates a resource block
   before its standard routes; those standard routes share a position. Conditional
   routes, mounts, unresolved includes/concerns, unsupported scopes and unknown
   handlers retain blocker facts. Rails `constraints` and Devise `authenticate`,
   `authenticated` and `devise_scope` preserve their child paths as uncertain
   routes. These request guards do not turn an unrelated engine mount into a
   blocker at the application root. Unsupported namespace options retain the
   known namespace path, or a literal path override; an unreadable override
   remains unknown. Each blocker names the route file's non-compared
   `(module)` operation. Core cannot derive a relationship through an earlier
   blocker or to the blocker itself.

These facts describe supported paths without Rails' optional format suffix.
Engine internals, arbitrary routing DSL extensions and template execution are
not analyzed.

## Outgoing HTTP requests

Inside supported named methods, literal library requires identify these clients:

- `net/http`: `Net::HTTP.get`, `get_response`, `get_print`, `post`,
  `post_form` and `put`; HTTP verb calls on a source-proven `Net::HTTP.new`
  session or the block parameter of `Net::HTTP.start`.
- `net/http` request construction: `Net::HTTP::Get.new`, `Post.new`, `Put.new`,
  `Patch.new`, `Delete.new`, `Head.new` and `Options.new`. As with Go's
  `http.NewRequest` evidence, constructing a request supplies its method and URL;
  it does not prove a network exchange occurred.
- `faraday`: direct HTTP verb calls, verb calls on a source-proven
  `Faraday.new` connection, and `run_request` with a literal method.
- `httparty`: direct `HTTParty` HTTP verb calls.

Single plain assignments can identify local connections, constants, URIs and
instance fields within their lexical type and receiver context. Reassignment,
compound writes, shadowing and unsupported producers remain unresolved.
Value/expression resolution stops after eight steps. `URI(...)`, `URI.parse`,
two-argument `URI.join`, concatenation and interpolated strings supply URL parts.

A root-relative path needs no base. `ENV` reads and supported Rails configuration
reads establish a configured base; a complete interpolation segment is dynamic.
An explicit host, an unresolvable base or partial computed segment remains unknown.
Queries and fragments do not enter path matching. Plain static hosts used to open
a Net::HTTP session remain unknown bases.

Facts belong to the operation supplying the URL. As in Python, arguments through
local helper methods are not propagated; an unresolved helper parameter does not
become a known request at its caller. Other client libraries, HTTParty class DSLs,
Faraday builder configuration and unsupported HTTP call shapes are not inferred.
Core derives a relationship only when its shared matching and uncertainty rules
identify a provider.

Every observation carries `RUBY_SOURCE_SCOPE` with the remaining limits. Invalid
source syntax fails with a file, line and column. This parser version is not a
guarantee for every Ruby or Rails release. The [validation record](validation.md)
documents fixture and external-project evidence.
