# Mojo scanner

The experimental Mojo scanner provides source inventory, Code outlines, named
operations and unresolved call evidence for modern Mojo source. It is a syntax
scanner, not a compiler or a complete architecture analysis.

It bundles [tree-sitter-mojo e5905c4](https://github.com/lsh/tree-sitter-mojo/tree/e5905c480b9ebbeb4195032805781a5e535547f7)
with a small [documented syntax patch](../../../plugins/scanners/mojo/grammar/README.md)
and [web-tree-sitter 0.27.1](https://github.com/tree-sitter/tree-sitter/tree/v0.27.1)
as JavaScript and WebAssembly. No Mojo, Python, Pixi, compiler, project dependency
installation or project build is needed. Scanning reads selected source and
package-owned parser assets only; it does not download or execute project code.
The portable package uses the same parser on Windows, Linux and macOS.

## Selected source

The manifest selects `.mojo` and `.🔥` source files. It excludes `.pixi/`,
`build/`, `tests/`, `test/` and `test_*` source files by default. Change the
configured include/exclude lists to scan tests or other source sets. No project
configuration is evaluated, and no imported file is read unless Groma selected it.
There are no scanner-specific settings.

The syntax boundary is the pinned grammar's modern Mojo 1.x syntax, including
`def`, structs, traits, ownership conventions, parameter lists, capturing
functions, `if case` and `where ... else` clauses. It is not a promise to accept every Mojo 1.x construct or to perform
compiler semantic checks. Older `fn` syntax is unsupported. A parser recovery
node or missing token fails the observation with a file, line and column;
Groma retains previously stored evidence for that failed scanner.

## Evidence and outlines

Top-level named functions, structs and traits appear in source order. Struct and
trait entries list their directly declared functions and constructors, including
trait requirements with an ellipsis body. Decorators keep the declaration's name
line. Fields, compile-time aliases and nested types/functions are not separate
outline entries. Bare symbol names mark Code entries; a type entry does not mark
all its methods.

Visibility is `public`. Mojo's underscore prefixes are naming conventions, not
Python's protected/private mapping. The scanner does not interpret `@doc_hidden`
as an access restriction. See the official [struct conventions](https://mojolang.org/docs/manual/structs/#field-conventions)
and [declaration syntax](https://mojolang.org/docs/reference/function-declarations/).

Named function and method bodies produce operations with exact UTF-16 source
offsets. A nested named function owns its own calls. Trait requirements without
an implementation do not become operations. Calls to functions, constructors
and members remain unresolved, including apparently local calls: overloads,
trait constraints, imported APIs and compile-time specialization need semantic
analysis that this scanner does not perform. No target is selected from matching
names alone.

Lambda and generator bodies, declaration headers (defaults, annotations and
decorators), and explicit `comptime` statements do not contribute calls to an
enclosing runtime operation. Calls inside square brackets are also omitted:
Mojo uses brackets for [compile-time parameters](https://mojolang.org/docs/manual/parameters/)
and runtime indexing, and syntax alone cannot distinguish them. Thus
`consume[config()](argument())` reports `consume` and `argument`, while
`items[index()]` does not report `index`. Calls in the indexed base, such as
`make_items()[index()]`, are retained. Generated constructors, implicit lifecycle calls,
operator dispatch, Python interoperability, framework bindings and HTTP evidence
are not analyzed. Body tokens for duplicate-code comparison are not emitted.

A top-level, non-parameterized `def main()` with no arguments is execution-entry
evidence for its own file, following Mojo's [entry-point rule](https://mojolang.org/docs/manual/basics/#hello-world).
Imported files are not assigned to that entry without compilation-unit evidence.
Imports, folders, structs and traits do not establish C4 boundaries or
collaborations. Groma core owns the existing OKF Markdown, source ownership and
C4 interpretation; this scanner introduces no architecture concept or metadata.

## Development

```sh
bun plugins/scanners/mojo/build.ts /tmp/scanner-packages/mojo
bun test test-bun/mojo-scanner.test.ts
GROMA_TEST_PACKAGES=/tmp/scanner-packages bun test test-bun/scanner-fresh-checkout.test.ts -t 'mojo package'
```

Run the build command before using the scanner from this workspace. It also
populates the ignored `plugins/scanners/mojo/dist/` assets loaded by the source
entry point. The focused test builds its own temporary runnable package.

The maintainer build copies the checked-in parser and installed runtime assets.
The [grammar provenance](../../../plugins/scanners/mojo/grammar/README.md) records
the upstream revision, narrow patch, tool versions, rebuild commands and SHA-256.
It bundles the JavaScript adapter and both WebAssembly assets with MIT notices. Consumers receive a runnable package with no install scripts or runtime
npm dependencies. `scripts/scanner-release.ts` stages this package beside the
other scanners; no native platform assembly is needed.

The flow is `src/index.ts` → `src/parser.ts` → `src/source.ts`: the entry point
reads selected files, the parser owns loading and syntax diagnostics, and the
source analyzer maps parsed declarations and calls into the shared contract.
The same analysis supplies scanning and outlines.
