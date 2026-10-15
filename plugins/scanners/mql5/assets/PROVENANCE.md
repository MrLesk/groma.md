# MQL5 parser asset

`tree-sitter-mql5.wasm` comes from
[davalillo/tree-sitter-mql5 dfbd597792789c5e5083078e5dda77c26b7ecd67](https://github.com/davalillo/tree-sitter-mql5/tree/dfbd597792789c5e5083078e5dda77c26b7ecd67)
with `grammar.patch` from this directory applied before generating C sources.
The grammar is ISC licensed and derives from MIT-licensed tree-sitter-cpp 0.23.4
and tree-sitter-c 0.23.6, fixed by the upstream package lock. Their license texts
are beside this file. The runtime is MIT-licensed web-tree-sitter 0.27.1, pinned
in the scanner manifest and lockfile.

## Source forms in the patch

The patch adds documented MQL5 forms missing from the pinned grammar:
[`typename(T)` expressions](https://www.mql5.com/en/docs/basis/oop/templates),
[`long(...)` / `short(...)` conversions](https://www.mql5.com/en/docs/basis/types/casting),
[named inputs](https://www.mql5.com/en/docs/basis/variables/inputvariables),
[void-prefixed constructors with initializer lists](https://www.mql5.com/en/docs/basis/types/classes),
[`this` as an assignable object variable](https://www.mql5.com/en/book/oop/classes_and_interfaces/classes_this),
and [explicit-void destructors](https://www.mql5.com/en/book/oop/structs_and_unions/structs_ctor_dtor).
The `this = other` interpretation follows the book's object-variable rule; it is
not a claim of compiler validation of an EA31337 template.

[Conditional compilation](https://www.mql5.com/en/docs/basis/preprosessor/conditional_compilation)
nodes preserve raw parameter/initializer alternatives, shared constructor and
`if` headers, conditional bases, and conditional `template`/`constexpr` prefixes.
The scanner never selects a branch. Shared EA31337 headers also define C++
constructors named `color` and `datetime` inside configured branches. These parse
without changing ordinary MQL5 primitive conversion nodes.

[Macro definitions](https://www.mql5.com/en/docs/basis/preprosessor/constant) may
contain comments between continued replacement fragments. The raw directive rule
retains them without consuming the next declaration. The pinned RoffildLibrary
`ArrayList_macros.mqh` also places a backslash before horizontal space and a line
comment on a continued line. That observed source shape is accepted only as raw
directive input and reported by `MQL5_OBSERVED_MACRO_CONTINUATION`; this is not a
claim that the compiler accepts that comment ordering. The first noncontinued
newline still ends the definition. Complete quoted tokens inside the directive
sequence keep comment markers literal, including parenthesized and adjacent
strings. This fixes the C-derived rule silently consuming a following function
when a replacement contained `"/*stdin*\\"`; reduced scan/outline regressions
preserve the following declaration and its physical call positions. Real comments
and existing continuation boundaries retain their grammar ownership. Ordinary
slash tokens exclude both comment openers, so a quote inside a trailing line
comment is never treated as a replacement string delimiter.
Input group and display-label
identifiers parse as source tokens; their values are not expanded.

The [official controls example](https://www.mql5.com/en/docs/standardlibrary/controls/cbmpbutton)
shows the paired `EVENT_MAP_BEGIN` / `ON_EVENT` / `EVENT_MAP_END` form between a
class and its constructors. The bounded grammar rule also retains the
`ON_INDEXED_EVENT` form and nested conditions found in PositionSizer. It provides
an opaque event-map node, never generated `OnEvent` members or callback calls.
The [MQL5 book](https://www.mql5.com/files/book/mql5book.pdf) identifies these paired
macros in `Controls/Defines.mqh`.

Exact project revisions and witnesses are in
[repository trials](../../../../docs/scanners/mql5/validation.md).
Both focused test files (`test-bun/scanner-mql5*.test.ts`) exercise their evidence.
All 109 upstream syntax corpus examples pass unchanged with this patch.

## Runtime boundary

The package additionally has a source-token adapter in `src/preprocessing.ts`.
It recognizes bounded macro roles only from selected `#define` values and replaces
their invocation spans with same-width parser punctuation. Every newline and
UTF-16 position is preserved, and each span remains explicitly opaque. The
scanner withholds all facts that depend on it. This is separate from the grammar
patch: there is no macro expansion, branch selection, project execution or
error-node recovery. Unknown unsupported syntax still fails the entire request. Shared Roffild DLL
signatures and pasted virtual-boolean/string-reference callable headers use
bounded selected-definition roles; their entire dependent signatures and bodies
remain opaque. Literal replacement braces bound possible scope escape. An
unbalanced replacement, unsafe selected reference or unknown pasted shape leaves
the depth unbounded. Exactly one formal operand with fixed identifier tokens can
prove containment only when every selected name matching its prefix/suffix has
contained scope, including empty arguments and all alternatives. Cycles and
two-formal pastes stay uncertain. The scanner withholds unproven caller and member
ownership instead of expanding tokens or inventing owners.

## Regeneration

Build provenance: tree-sitter CLI 0.26.3, wasi-sdk 29, macOS arm64.
With that CLI version on PATH, rebuild in a checkout of the pinned grammar:

```sh
npm ci --ignore-scripts --no-audit --no-fund
git apply --unidiff-zero /path/to/groma/plugins/scanners/mql5/assets/grammar.patch
tree-sitter generate --abi 15
tree-sitter test
tree-sitter build --wasm -o tree-sitter-mql5.wasm
```

SHA-256: `2b6ab7d8b63d329b6a0784f15032950857e0bec50bb09e4f845c2a43d66e7110`.
The scanner reports the upstream revision with the suffix `+groma.5`.
Normal scanner builds copy this portable asset; consumers need no compiler,
SDK, native add-on, MetaTrader or MetaEditor. No upstream install script runs.
