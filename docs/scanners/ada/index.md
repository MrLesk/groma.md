# Ada scanner

The experimental `@groma/scanner-ada` plugin reads selected `.ads` and `.adb`
source files. It carries its parser as WebAssembly and needs no GNAT, Alire,
GPRbuild, application dependencies, or network connection during a scan.
The same package runs on Groma's supported Windows, Linux and macOS hosts.
Default exclusions omit root `alire/` and `obj/` directories and test directories.
Source packages such as `src/alire/` and `src/obj/` stay selected.

```bash
groma plugin add @groma/scanner-ada
groma scan
```

## Source evidence

The scanner lists declarations from parsed source and reports named subprogram
bodies, expression functions and null procedures as operations. Procedure-call
statements belong to their nearest subprogram body, including nested local
subprograms. Package elaboration and task/entry execution are not assigned to an
enclosing subprogram. All procedure calls are unresolved: overloads, access-to-
subprogram values and dispatch require semantic analysis beyond this parser.
Function expressions are omitted because Ada uses the same syntax for calls,
array indexing and type conversions. Duplicate-body comparison is not supported.

Exactly one selected library package specification and one selected body with
the same case-insensitive declared unit name form a `sourceUnits` claim. The
specification is primary. Filenames and directories do not establish this
association. Duplicate declarations or bodies remain separate; no build variant
is chosen. Subunits (`separate`) and standalone subprogram specifications/bodies
are not associated in this first version.

There are no inferred execution entries: a library procedure is not necessarily
a program's main procedure. GPR files, Alire manifests, dependency closure and
launch configuration are not analyzed. Package hierarchy supplies source names,
not C4 boundaries. Core owns component placement and OKF Markdown output.

## Code outline

Package scopes act as namespaces. Their ordinary type declarations and
subprogram declarations/bodies, including generic subprograms, appear in physical
source order. Local
subprograms and local types inside executable bodies are omitted from the
outline. Subtypes, renamings, instantiations, generic formal parameters and
protected/task types and entries are not listed. Ada primitive operations remain
functions; the scanner does not invent methods on their parameter types.
Separate subunit files (`separate`) have no Code outline in this version, even
though their named subprogram operations remain in scan evidence.

Visible declarations are `public`. A package's private part and private child
units are `internal`, because Ada permits access inside the package and its
children. Package-body-only declarations are `private`. A subprogram body in a
package inherits visibility only from one selected specification with the same
syntactic profile, ignoring case, whitespace, comments and default expressions.
When an identically named declaration exists but its profile cannot be matched,
that body is omitted from the outline. A package body without its selected
specification also omits subprogram outlines, while retaining operation evidence.
The outline reads only requested Code files and supplied selected source context.
Names and entry symbols use Ada's case-insensitive spelling. Lines refer to the
physical name; evidence positions use zero-based UTF-16 offsets.

## Parser limits and ownership

The MIT-licensed [Tree-sitter Ada grammar](https://github.com/briot/tree-sitter-ada)
is pinned to `a45fd9c65a791cbe7d146e85a53fbe43a6d52a61` with a small local patch
for GNAT array type indexes such as `Positive range 1 .. <>`. It is a partial
Ada grammar, not a compiler or a complete Ada legality checker. A syntax error or a source
form the grammar cannot parse fails with its file and physical position. GNAT
preprocessor directives are rejected rather than treating both branches as active.
The scanner's diagnostic states the supported evidence limits on every scan.

At [HAC revision 8710a2c](https://github.com/zertovitch/hac/tree/8710a2c2608fed51e409f954838b82e0b6107e0c),
the complete 99-file compiler implementation under `src/` was verified. Its
396-file default selection correctly rejects four invalid examples under
`exm/not_working/`: three use non-Ada colon formatting in procedure arguments,
and one has an empty statement sequence instead of `null;`. These failures were
checked against the Ada reference manual and separate minimal controls; the
directory name was not used to classify them. The complete default selection
is not counted as a successful scan.

`src/index.ts` receives selected paths, reads each source and constructs the
shared observation. `src/syntax.ts` owns parser initialization, diagnostics and
WASM memory. `src/declarations.ts` owns outlines and spec/body associations.
`src/evidence.ts` owns subprogram boundaries and procedure-call facts. `build.ts`
bundles JavaScript, both WASM assets, licenses and this documentation.

To regenerate the checked-in grammar asset, check out the pinned upstream commit
and apply `assets/gnat-fixed-lower-bound.patch` with `git apply`. Run
`tree-sitter generate --abi 14`, then `tree-sitter build --wasm`, using Tree-sitter
CLI 0.26.3 and wasi-sdk 29. Copy its `tree-sitter-ada.wasm` into `assets/`.
Normal package builds only need the repository's locked Bun dependencies and
do not rebuild the grammar.
