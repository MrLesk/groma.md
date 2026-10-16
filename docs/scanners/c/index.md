# C scanner

The experimental C scanner reads selected `.c` and `.h` source files using the
[official Tree-sitter C grammar](https://github.com/tree-sitter/tree-sitter-c)
with a small C-owned extension for macro syntax.
The package includes its parser and WebAssembly runtime. Scanning needs no C
compiler, system headers, build tools, project dependencies or network access.
The portable package passed [fresh-checkout fixture checks](https://github.com/MrLesk/groma.md/actions/runs/38817786034)
on Windows x64/ARM64, Linux x64/ARM64 and macOS ARM64. Real-project trials ran
on macOS ARM64.

## Source selection

Discovery proposes C only when it finds `.c` source. A `.h` file alone cannot
identify its language: C++ projects also use that extension. Once C is enabled,
its default selection includes `.c` and `.h`, and interprets both as C. Edit the
scanner's include/exclude settings to select the C part of a mixed project.
Upper-case `.C` and `.H` are not selected by default.

`listSourceFiles` filters only the candidate paths Groma supplies. The scanner
never follows an `#include`, reads a compile database, searches the filesystem,
or runs a preprocessor. A selected header is parsed as its own physical file;
including it elsewhere neither duplicates its inventory nor transfers ownership.
A header omitted by selection stays unread, even when selected code includes it.
Scans and outlines collect macro definitions from the selected source context
Groma supplies. An outline request without that context uses only its requested
files; it does not discover missing definitions through includes.

## Evidence and outlines

The scanner reports:

- Every selected source file, including files with no recognized declarations.
- Top-level function definitions and prototypes, and named `struct`, `union`
  and `enum` definitions. Each declaration keeps its physical source name and
  line. Prototypes remain declarations, not executable operations.
- One operation per written function definition, including GNU nested functions. Operation
  positions and call positions are zero-based UTF-16 offsets into the physical
  file. CRLF line endings, a byte order mark and non-ASCII text keep their offsets.
- Call expressions in each function body. A nested function owns its own calls.
  `sizeof`, `_Alignof`, `typeof` and `_Generic` operands are omitted because the
  scanner does not establish which of their expressions execute. Parameter
  declarations and variable-length array bounds outside the body are not analyzed.

Preprocessor directive conditions contribute no runtime invocations. Calls in
each parsed conditional branch remain source possibilities.

Calls remain unresolved, with no claimed providers. A direct-looking call may
name a function pointer or an unselected macro, and an external declaration does not prove
which implementation a linker selects. Member calls keep the written field name;
other indirect calls retain their source position without an invented name.
A call whose name has a selected macro definition contributes no invocation or
argument calls: a macro may discard or stringify those arguments. The same
boundary covers a macro inside the callee of an outer call: its expansion may
turn that entire expression into an unevaluated operand such as `sizeof`. Neighboring
explicit calls remain only when the macro's scope is proven. Every selected
replacement must have balanced braces with no closing brace before its matching
opening brace. The same proof follows referenced selected macros. A small lexical reader keeps
comments and string/character literals separate from brace and identifier tokens;
parser error recovery is not used to infer missing replacement tokens.
A pasted name can preserve scope only when it has exactly one formal parameter
and a fixed literal prefix or suffix, and every matching selected macro name
preserves scope. Empty arguments include the fixed name itself in that check.
Cycles, two-formal pastes and other unproven paste shapes remain uncertain.
No actual argument is substituted and no generated name becomes source evidence. Actual macro
arguments with braces or unproven selected macro references remain uncertain.
This is replacement classification, not source expansion.

An unproven runtime macro call, object macro use or bare macro statement makes
its containing body's caller scope uncertain. A macro can close one function
and open another even when its invocation has a semicolon. The scanner retains
explicit operations and outlines, but omits that body's invocations and reports
`C_CALLER_SCOPE_UNCERTAIN`. It does not invent generated function names.
Directive condition macros do not trigger this rule because those expressions
cannot insert runtime function scopes. These proofs are conservative across
selected source files; they do not resolve includes, `#undef` or the active macro
environment. Unselected macro definitions remain outside the scanner's evidence.
The scanner does not report callback bindings, duplicate-body tokens or HTTP facts.

Outlines use the same parsed declarations in source order. Code links use bare
names. Fields, typedef aliases, anonymous types, nested types, nested functions
and function-pointer variables are not outline declarations. Types have no
function members in C; a function-pointer field remains a field. A named tag in
`typedef struct Tag { ... } Alias` is listed as `Tag`, not as the alias.
Forward tags without a body are not listed.

Function visibility follows the linkage visible within each physical source file:
`static` is `private`; external linkage is `public`. A later `extern` or default
function declaration inherits a preceding same-file static declaration.
These rules follow [C 6.2.2](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf).
Mutually exclusive preprocessor branches do not share that linkage. If a preceding
conditional static declaration could change the linkage, the scanner retains the
symbol and operation but omits that uncertain declaration from the outline and
reports `C_LINKAGE_UNCERTAIN`. Unproven macro modifiers use the same uncertainty
rule. Named file-scope type definitions are `public`:
code that includes their declaration can use the tag. Types have no C access modifiers.

This is source analysis, not a configured compilation. Includes may introduce
further declarations or macros, and compiler flags may change the compiled API.
Every scan reports `C_SOURCE_SCOPE` to make that limit visible. Preprocessor
branches are kept as source possibilities, even `#if 0`; the scanner does not
choose a configuration or claim that every reported body is compiled. It does not
expand macros, infer declarations generated by macros or support C++ syntax.

Invalid or unsupported syntax reports `C_PARSE_ERROR` with the file and line.
The affected top-level declaration contributes no symbols, operations or calls;
other parsed declarations and the file inventory remain available. This is the
scanner's explicit syntactic scope, not a claim that the whole file compiled.

Common C public headers wrap their declarations in `extern "C"` behind
`#ifdef __cplusplus`. The parser recognizes that container, and the scanner
checks each child declaration independently. Wrapper errors remain diagnostics;
a malformed child does not erase valid siblings. C++ linkage blocks are excluded.

The pinned parser represents a conditional function header followed by one shared
body as branch declarations with inserted semicolons, then a compound statement.
The scanner recognizes that exact shape only when every terminal branch has one
otherwise valid signature, the only signature error is the missing semicolon,
and the body immediately follows. Nested directive-only guards are allowed.
Function bodies must be error-free except for two exact conditional shapes in
the pinned parser. In curl, a complete `#ifdef` with no alternative wraps a valid
`if` header, leaving its parser-inserted empty consequence before a valid
expression statement outside the guard. In Zstd, the guard wraps a valid `if`
with a complete consequence and a lone trailing `else` marker; the next statement
outside the guard is its valid expression consequence. The scanner accepts only
these markers, including in an ordinary definition with an error-free signature.
Missing next statements, declarations in that slot, incomplete guards and other
syntax errors stay rejected. Written-semicolon prototypes, incomplete signature
alternatives and intervening declarations are also rejected. Each real signature
keeps its own position and possible body calls; neither becomes a claimed
active-platform entry. Explicit nested functions in a shared body are reported
once. The same macro caller-scope rule applies to each possible owner.

Macro candidates have explicit grammar nodes. An identifier is accepted as a
macro modifier, version annotation, field block or bare statement only when selected source contains
its `#define`; unknown candidates report `C_MACRO_UNRESOLVED` and contribute no
declaration evidence. A normal type name does not become a proven modifier. Macro candidates may mix
with ordinary modifiers before the type, so a written `static` stays attached to
its declaration even when inline/attribute macros follow it. The suffix keeps
the original C grammar and cannot consume the function name as a macro.
For function linkage, `src/macros.ts` parses each selected replacement against a
small declaration probe. Every definition of the prefix must contain only empty
text, comments, linkage-neutral storage (`extern` or inline), attributes or a
calling convention before it can preserve public visibility. Object-like aliases
are proven in successive passes: an alias is neutral only after all the modifier
names it uses are proven. A cycle, an unknown name, or any selected `static`
alternative leaves linkage uncertain. No platform branch is chosen and no
replacement is applied to the original source. An externally configurable macro
without a selected definition remains unknown, including `ZSTDLIB_VISIBILITY` in
Zstd's public export chain.

Function-like return-type macros use a second proof: one formal parameter must
remain the type in a synthetic parameter declaration, surrounded only by neutral
modifiers or independently proven object-like modifier names. This covers forms
such as `CJSON_PUBLIC(type)` without evaluating its platform guards. A static or
unproven alternative leaves linkage unknown. A selected object macro used as the
return type, including inside another macro's type argument, also stays unknown;
ordinary typedef names are unaffected. The scanner does not recursively expand
macro-defined types.

After-type function annotations support a numeric/version argument and an optional
string argument, such as `CURL_DEPRECATED(7.56.0, "")`. Their explicit grammar node
belongs to the following function declarator. This narrow shape preserves ordinary
function parameter clauses and conditional signatures. Every selected definition
must be function-like, and its replacement must pass the same neutral-modifier
proof before the function can be public. Unknown, static or parameter-dependent
replacement shapes remain uncertain; actual arguments are not expanded. Other
annotation forms are outside this grammar extension.

Quoted macro replacements keep comment-like text inside their literal, so a
string such as `"/*stdin*\\"` cannot swallow following physical declarations.
This also applies inside parentheses and adjacent string literals. Real comments
and line continuations keep their grammar meaning.

A selected calling-convention macro inside a callback field declarator preserves
the explicit surrounding type, such as `cJSON_Hooks`. The field itself is not an
outline declaration, and no generated fields are inferred.

Known field blocks preserve the explicit surrounding type and report
`C_MACRO_FIELDS_OMITTED`. Known bare statements preserve written function
boundaries and report `C_MACRO_BODY_OMITTED`. Their generated fields, declarations
and runtime behavior remain absent. Macro-generated enum members and other syntax
outside these narrow forms can still cause `C_PARSE_ERROR` and omitted declarations.

Unreadable files or invalid UTF-8 reject the scan and identify the source file.

## Architecture ownership

The scanner reports one source group, not an application or library boundary.
It supplies no execution entries or source units: a function named `main`, an
include, a folder or a build filename does not prove which selected files form
one executable. Core owns initial placement and curated component ownership.
Unresolved calls create no claimed architecture relationships. Use Groma's
existing curation tools to describe supported boundaries and collaborations.

C adds no OKF metadata or C4 concept. The resulting architecture uses the same
Markdown documents and Code links as other scanners. An ordinary reader can
follow those links; Groma interprets temporary scanner facts through the shared
scanner contract and its existing component model.

## Real-project qualification

An independent review tested the same packaged scanner through Groma installation,
source selection, scan reconciliation, saved architecture and Code views. The
selection included every Git-listed, unignored lowercase `.c` and `.h` file in
these revisions, including tests, examples and alternative platforms:

| Repository | Pinned revision | Files | Source responsibilities checked |
|---|---|---:|---|
| [Kilo](https://github.com/antirez/kilo) | [323d93b](https://github.com/antirez/kilo/commit/323d93b29bd89a2cb446de90c4ed4fea1764176e) | 1 | Main loop, screen refresh, key dispatch and saving. |
| [hiredis](https://github.com/redis/hiredis) | [058ebcd](https://github.com/redis/hiredis/commit/058ebcdf36c5b05b759c613564fb958ec363c90f) | 52 | Public reply/context types, socket reads, parser feed and async callbacks. |
| [cJSON](https://github.com/DaveGamble/cJSON) | [6d9f244](https://github.com/DaveGamble/cJSON/commit/6d9f2443ab071f86e5d9b43025a40929ec41c46c) | 99 | Public hooks and APIs, parsing, printing and allocation. |
| [libuv](https://github.com/libuv/libuv) | [ad0679a](https://github.com/libuv/libuv/commit/ad0679ae37afe4ea415772b5a86020032d5db2f8) | 369 | Public loop/handle types, event polling, queued work and timer callbacks. |
| [curl](https://github.com/curl/curl) | [87a1dc7](https://github.com/curl/curl/commit/87a1dc71d7583e85576f8602ccba4f0df6f269ac) | 1,066 | Easy/multi/list APIs, transfer calls and both written CLI entry alternatives. |
| [Zstandard](https://github.com/facebook/zstd) | [49cf517](https://github.com/facebook/zstd/commit/49cf51799ea051457f57243527aa2058f999f005) | 263 | Compression wrappers, streaming, CLI file operations and allocation callbacks. |

Across 1,850 files, the scanner reported 16,527 outline declarations, 12,897
operations and 41,586 unresolved calls. All 41 sampled central declaration/type/
entry-outline checks passed. Every reported call offset and line matched the
physical source, and actual Code views matched the package outlines. All six
complete flows repeated with network access denied and only Git in `PATH`;
source hashes, selections and repeated results stayed unchanged. This was a
macOS ARM64 run using Node 24.13.0 and Bun 1.4.3. Counts describe observed coverage,
not complete architecture inference.

One expected curl call remains omitted: the selected
[`multi_perform` test macro](https://github.com/curl/curl/blob/87a1dc71d7583e85576f8602ccba4f0df6f269ac/tests/libtest/first.h#L318)
shares its name with a library function. The
[call inside `curl_multi_perform`](https://github.com/curl/curl/blob/87a1dc71d7583e85576f8602ccba4f0df6f269ac/lib/multi.c#L2978)
is therefore treated as macro syntax. The operation and public API remain visible.
The scanner collects definitions across the selected files without resolving each
translation unit's includes or `#undef`; the test files were not excluded to hide
this collision. Some macro-dependent bodies, including curl's private
`easy_perform`, also retain operations but omit uncertain calls.

All reported calls remain unresolved, so they create no inferred architecture
relationships or runtime containers. The map provides initial physical source
ownership and inspectable Code evidence; library, CLI, parser and event-loop
collaborations still need curation. Zstd's externally configured export visibility
and other unsupported syntax retain the uncertainty described above.

## Maintainer build

From this repository, with its locked Bun dependencies installed:

```sh
bun plugins/scanners/c/build.ts
```

The result is `plugins/scanners/c/dist/package`. Before publication, install that
local package with `groma plugin add /absolute/path/to/package` from a target
project. Publication is a separate release step.

`build.ts` bundles the adapter, copies the checked-in grammar WASM and
`web-tree-sitter@0.27.1` runtime, and includes their MIT license texts. The grammar
extends pinned `tree-sitter-c@0.24.1`; its native npm install script is not used.
The final scanner has no runtime npm dependencies or install scripts. The existing
release stage builds this portable package on each host.

Only maintainers changing `grammar/grammar.cjs` regenerate the checked-in binary:

```sh
bun plugins/scanners/c/generate-parser.ts /path/to/tree-sitter
```

The generator requires Tree-sitter CLI 0.26.3 and its supported WASM build toolchain
(WASI SDK or Emscripten). Consumers and normal package builds do not run it.
The grammar extension keeps source bytes and positions intact. Validate grammar
changes against the pinned upstream syntax corpus as well as the scanner tests.

The implementation flow starts at `src/index.ts`, which receives Groma's selected
paths. `src/parser.ts` reads and parses those files, then `src/macros.ts` collects
selected definitions and proves object/annotation modifier shapes, single-formal
type macro shapes, and replacement brace boundaries. Its lexical reader exists
only for the brace proof; declarations and definitions remain parser-owned. `src/source.ts` validates
macro candidates and extracts C declarations and body calls. The same resulting
facts feed scanning and source outlines. No module owns preprocessing or linkage
resolution across translation units.

Focused tests cover linkage, function-pointer syntax, conditional and macro
uncertainty, physical positions, guarded public headers, parse diagnostics and
caller ownership. The shared fresh-checkout test runs the relocated package
without language tools or network and checks that source stays unchanged.
