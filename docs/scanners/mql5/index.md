# MQL5 scanner

**Experimental.** `@groma/scanner-mql5` reads selected `.mq5`, `.mqh` and `.h`
source files. Only `.mq5` signals automatic discovery; shared headers do not identify
the project language. Its packaged Tree-sitter parser runs locally as
WebAssembly (WASM), a portable binary format. Scanning needs no MetaTrader,
MetaEditor, compiler, project dependencies or network. It never runs trading code.

```sh
groma plugin add @groma/scanner-mql5
```

## Source evidence

The scanner lists each selected file, top-level functions, classes, structures,
interfaces and enums. Code outlines include methods, constructors, destructors
and declarations without bodies in physical source order. Fields, inputs, type
aliases and nested types are not outline rows. MQL5 input/sinput declarations,
input labels/groups, color/date literals, property/include/import directives and
top-level templates use an MQL-specific grammar derived from C++. This parser is
not the MetaQuotes compiler or a language-validity check.

Global functions and types are public. Class members default to private;
structure and interface members default to public. Written access labels establish
visibility. Conditional access labels and opaque member macros make following
members' visibility unknown until another written label. Unknown members stay
out of the outline; source-written bodies can still supply operations.
If a member-level macro can change the enclosing type, later member ownership
remains unknown even after a written access label. Those member declarations,
operations and calls are omitted with an owner diagnostic; the literal type and
proven earlier members remain. Inside a method, directly balanced replacement
tokens can prove how many enclosing brace scopes they may close. Closing only
the method keeps sibling ownership; reaching the type, or an unknown escape
depth, withholds later members. The independently written first method remains,
but its body calls stay uncertain. Unsafe selected references, uncertain arguments
and unbalanced replacement tokens have no proven depth bound. A pasted identifier
with exactly one formal operand and fixed identifier prefix or suffix has a bound
only if every matching selected macro name has contained scope. This includes an
empty argument and all selected alternatives. Two-formal pastes, cycles and
unknown token shapes stay unbounded; no generated name or call is inferred.
Out-of-class methods inherit access only when selected declarations agree.
Member Code symbols use `Type::member`; a type link never marks its constructor.
Name lines and operation/call offsets refer to physical source, with zero-based
UTF-16 offsets. BOM-marked UTF-16 source is supported as well as UTF-8.

Implemented functions and methods report operations. Calls inside their bodies
remain unresolved, including ordinary calls, member calls and `new` expressions.
Built-in conversions and `typename` are operators; real nested calls remain
visible. There is no type checking, overload dispatch or callback binding.
Nested function/type/lambda bodies are not attributed to an outer operation.
Implicit constructors, constructor initializer lists, default arguments and field
initializers do not contribute calls. Operation-copy tokens are not emitted.

A direct `.mq5` `void OnTick()` or `void`/`int OnStart()` definition with no
parameters (or `void`) provides execution-entry evidence. Library/indicator
properties, configured branches, macro-dependent names/signatures, opaque global
declarations, template handlers and conflicting handlers suppress entries. Unrelated
constant definitions used in version metadata or call arguments do not. Membership contains only the declaring
file. `OnCalculate` and other event forms provide ordinary declarations only.

## Macros and conditional source

Only Groma-selected files are read. Includes and binary imports are never loaded
and never create relationships or combine files. Shared `.mqh` and `.h` files
can contain other languages; selecting them here does not claim MQL4 or general
C++ support. Existing Groma source ownership rules still apply.

Selected `#define` values identify bounded opaque macro forms: whole declarations
or statements, control headers, parameter aliases and member-access fragments.
The bounded shared-header forms include DLL signature wrappers and pasted
virtual boolean callable headers with a string-reference parameter. Their entire
dependent signatures and bodies remain omitted; no ABI or generated name is inferred.
All selected alternatives must agree on the syntactic role. The scanner does not
expand values, evaluate arguments, resolve includes or select compiler flags.
It uses same-width parser punctuation while preserving all original source
locations. That punctuation supplies no declaration, type, access, call or entry
fact. Dependent headers and affected statements/control bodies are omitted with
file/line diagnostics. Parsed macro invocations and call chains built from their result also omit their argument calls. A callable or type whose
actual name is a selected macro stays omitted even if its spelling already parses.
When selected macro tokens can change the enclosing brace scope, the literal
operation remains but its entire body-call evidence is omitted with a caller
uncertainty diagnostic. Selected macro references and brace-bearing arguments are
checked conservatively, without expansion. A pasted name outside the bounded
selected-name proof also leaves scope uncertain. Such source cannot prove an
execution entry. Unknown unsupported macro syntax and too-short placeholder spans fail explicitly.

The observed backslash-before-line-comment continuation form in RoffildLibrary
is retained only as opaque directive input, with an explicit diagnostic. The
scanner does not claim compiler acceptance of that comment ordering. Ordinary
source after the first noncontinued newline remains outside the definition.

The documented standard-library `EVENT_MAP_BEGIN` / `EVENT_MAP_END` block is a
bounded opaque syntax form even when its SDK definitions are absent. Generated
members and callback calls are omitted. Its surrounding written classes and
methods remain visible.

An entire-file `#ifndef NAME` / `#define NAME` guard is unwrapped, including when
forward type declarations precede it. Other conditional branches stay omitted
with diagnostics. Supported raw fragments include conditional parameters,
initializers, bases, template/constexpr prefixes and shared constructor/if headers.
Unconditional names and bodies remain evidence where their own syntax is proven;
uncertain signatures never prove entries. The scanner does not join arbitrary
configured fragments into guessed declarations.

Malformed or unsupported syntax fails the whole request with a source location.
The [repository trials](https://github.com/MrLesk/groma.md/blob/main/docs/scanners/mql5/validation.md)
record full selected-file coverage separately from missing architecture evidence.
A successful parse does not mean all generated APIs or collaborations are known.
Groma core owns C4 boundaries, relationships and OKF Markdown. Classes, filenames
and imports do not establish architecture boundaries or add language metadata.

## Development

`src/index.ts` coordinates the contract. `syntax.ts` reads selected inputs,
collects macro definitions through `preprocessing.ts`, and owns parser trees.
`preprocessing.ts` records opaque spans without moving source positions.
`declarations.ts` owns names, visibility and Code outlines; `evidence.ts` owns
operations, unresolved calls, diagnostics and conservative entries.

```sh
bun plugins/scanners/mql5/build.ts
bun test test-bun/scanner-mql5.test.ts test-bun/scanner-mql5-preprocessing.test.ts
GROMA_TEST_PACKAGES=/path/to/staged-packages bun test test-bun/scanner-fresh-checkout.test.ts -t 'mql5 package'
```

The package bundles JavaScript, grammar, WASM runtime and license notices. The
same assets run on Groma's Windows, Linux and macOS hosts. Local macOS evidence
is separate from release platform qualification. See
[parser provenance](../../../plugins/scanners/mql5/assets/PROVENANCE.md).
