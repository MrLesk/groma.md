# C++ scanner

The experimental `@groma/scanner-cpp` scanner reads selected C++ source and
headers with the MIT-licensed [Tree-sitter C++ grammar](https://github.com/tree-sitter/tree-sitter-cpp),
version 0.23.4 plus local syntax rules, and [web-tree-sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web)
0.27.1. JavaScript and WebAssembly are bundled. Scanning does not need Clang,
GCC, MSVC, CMake, project dependencies or a network connection. The same package
targets Groma's Windows, Linux and macOS hosts; repository trials ran on macOS
ARM64. See [qualification](https://github.com/MrLesk/groma.md/blob/main/docs/scanners/cpp/validation.md)
for pinned projects, results and verification boundaries.

## Install and select sources

```sh
groma plugin add @groma/scanner-cpp
```

For development before publication, build and install a local package:

```sh
export TREE_SITTER_WASI_SDK_PATH=/path/to/wasi-sdk-34
export TREE_SITTER_BINARYEN_PATH=/path/to/binaryen-version_133
bun plugins/scanners/cpp/build.ts /tmp/groma-cpp-package
groma plugin add /tmp/groma-cpp-package
```

The manifest selects `.cpp`, `.cc`, `.cxx`, `.C`, `.hpp`, `.hh`, `.hxx`, `.h`,
`.ipp` and `.tpp` files. Build directories are excluded by default. Edit the
scanner's include/exclude lists in `config.json` to select the source you want.
Shared `.h` files alone do not recommend C++ automatically; discovery uses C++
source and header extensions.

Only selected files are read. The scanner never follows an `#include`, reads a
compilation database or evaluates a build script. Include the headers containing
your declarations and macro definitions when selecting implementations. Headers
and implementations remain separate source facts; matching names do not establish
one component. There are no scanner-specific settings.

## Source evidence and outlines

The Code outline lists namespace-level functions, named classes, structs, unions
and enums, including templates. Types contain directly declared methods, including
constructors, destructors and operators. Fields, aliases, function-pointer
variables and nested types are omitted. A lambda assigned directly to a
namespace-level name is an outline function. Source order and physical name
lines are preserved.

Namespace-level names are public unless `static` or an unnamed namespace makes
them file-local. Const/constexpr named lambdas are also private, except inline/extern
bindings and variable templates. Class members default to private; struct and
union members default to public. Written access labels apply without narrowing
a member's access to match its enclosing type.

An earlier unconditional static declaration in the same file and namespace makes
a later function private when its parameter-list spelling matches. Different
parameter spelling or conditional private declarations leave the later function's
visibility uncertain, so its outline entry is omitted. Parameter types and aliases
are not resolved to prove overload identity.

A separate method definition joins its type's Code outline when selected source
identifies the type and one access level for that member name. Known written
parameter counts narrow same-named declarations; defaults still count as parameters.
Variadic or macro-dependent parameter counts remain unknown. If remaining
candidates disagree on access, the separate definition is omitted. Missing types, namespace aliases and dependent template qualifications
may also prevent an outline entry. The executable bodies remain operation evidence.
Context files establish access without appearing in another file's requested
outline. Anonymous-namespace type context stays within its own file. Operator
token spacing is normalized; conversion names retain const, pointer and reference
qualifiers.

Named function, method and constructor bodies produce operations. Declarations
without bodies are not implementations. Calls carry physical lines and UTF-16
positions. Local-class methods own their calls. Deferred lambda bodies do not
belong to the enclosing operation; their capture initializers do. Direct
namespace-level named lambdas own their body calls. Parameter defaults, field
initializers outside constructors and implicit construction are not modeled.
Written constructor initializer calls belong to the constructor. Named casts and casts using built-in type names
are expressions rather than calls; calls in their operands are retained.

Every invocation is unresolved. Syntax cannot prove overload lookup,
argument-dependent lookup, template instantiation, function-pointer values or
virtual dispatch. The scanner emits no derived-call claims, execution-entry
membership, HTTP facts or normalized tokens for duplicate comparisons.

## Macros and conditional source

The parser keeps the original source text and positions. Selected `#define`
declarations identify possible macro meanings; they do not prove an include graph
or choose a build configuration. No replacement text is expanded. Macro arguments
may be discarded, stringized or used as deferred code, so macro invocations and
their arguments do not become runtime calls.

Declaration modifiers preserve written access only when every selected replacement
is empty or has a recognized modifier form. Agreed `static` modifiers prove private
namespace linkage. Conflicting or unrecognized modifiers leave access uncertain.
Small parser probes classify these forms without producing source facts. Narrow
external declaration-modifier syntax and invocations with a written type argument
remain explicit uncertainty when their definitions are not selected. Their dependent
outlines or caller facts are omitted, with `CPP_MACRO_SCOPE` diagnostics. Unknown
scope delimiters and other unsupported declaration macros still fail.

A macro may change the current caller, class owner or access label. Literal delimiter
balance and selected dependencies bound the possible scope change. Unsafe uses
withhold later dependent facts; an explicit access label restores access only while
the class owner remains known. A bounded token-paste check accepts fixed identifier
prefixes or suffixes around one formal parameter only when all matching selected
macro definitions are contained. It never builds or emits the pasted name. Cycles,
unsafe alternatives and other paste shapes remain unknown.

There is one narrow scope exception for source-declared delimiter macros: all
selected replacements may agree on exact literal namespace openings or closing
braces. Paired empty/export-block alternatives are transparent scope frames.
These frames must balance, and an optional export close cannot consume a written
or namespace frame. This keeps later written declarations in their proven scope;
it does not create declarations from macro replacement text.

Conditional groups retain all parsed branches as source possibilities.
`CPP_CONDITIONAL_SOURCE` distinguishes them from one compiled program. Supported
forms include conditional declarations and shared function headers, initializer
and argument alternatives, attributes, guarded `extern "C"` delimiters and guarded
try/catch delimiters. Conditional access or owner changes can make later members
uncertain. `CPP_MACRO_SOURCE` reports encountered macro names and source-only limits.

`CPP_SOURCE_SCOPE` reports analysis limits on every scan. An unsupported or invalid
syntax form fails with its file, physical line, column and source fragment. There
is no source masking, parse recovery or partial-success fallback. Arbitrary macro
generated syntax and arbitrary directives splitting C++ constructs remain outside
this parser's syntax model. Successful parsing does not prove valid C++, an active
configuration, resolved includes or a buildable application.

## Ownership and parser maintenance

- `src/index.ts` reads all selected files, shares their macro definitions, and
  assembles the observation. It deletes every parser tree after collecting facts.
- `src/syntax.ts` owns parser assets, syntax errors and name spelling.
- `src/macros.ts` owns selected macro definitions, modifier and scope proofs, and
  explicit macro syntax validation.
- `src/declarations.ts` owns lexical declarations, access and caller evidence.
- `src/outline.ts` builds Code details from declarations and selected context.
- `build.ts` bundles JavaScript, parser assets and MIT licenses.

`grammar/grammar.cjs` extends the pinned official grammar. Its generated
`grammar/tree-sitter-cpp.wasm` is checked in; package builds never generate it.
To change it, a maintainer uses Tree-sitter CLI 0.27.1, WASI SDK 34, and Binaryen 133:

```sh
export TREE_SITTER_WASI_SDK_PATH=/path/to/wasi-sdk-34
export TREE_SITTER_BINARYEN_PATH=/path/to/binaryen-version_133
bun plugins/scanners/cpp/generate-parser.ts /path/to/tree-sitter
```

This explicit maintainer command may download the compiler SDK. Scanning and
package building need no toolchain. The engine identifies itself as
`0.23.4-groma.3`. All 179 original upstream corpus cases and the scanner regressions
must pass when changing the grammar. Run the corpus against the overlay with:

```sh
git clone --branch v0.23.4 --depth 1 https://github.com/tree-sitter/tree-sitter-cpp.git /tmp/groma-cpp-upstream
cp plugins/scanners/cpp/grammar/grammar.cjs /tmp/groma-cpp-upstream/grammar.js
(
  export NODE_PATH="$PWD/node_modules"
  cd /tmp/groma-cpp-upstream
  /path/to/tree-sitter generate grammar.js
  /path/to/tree-sitter test
)
```

These are temporary source facts. Groma core owns C4 systems, containers,
components and relationships. An ordinary OKF reader sees the same Markdown and
Code links. C++ classes, headers, namespaces and macros introduce no new
architecture level or stored metadata.
