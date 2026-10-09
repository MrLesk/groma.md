# COBOL scanner

The official `@groma/scanner-cobol` package reads IBM fixed-format COBOL from a
fresh source checkout. It includes Eclipse COBOL Language Support 2.5.1 and a
Java runtime. Scanning requires no compiler, editor, mainframe access, project
build, or network access.

This first revision is qualified against CardDemo's statement-generation
programs, `CBSTM03A` and `CBSTM03B`, and their local data copybooks. It does not
claim support for every COBOL dialect or every CardDemo application.

## Source selection and settings

The package selects `.cbl`, `.cob`, and `.cpy` files, with any letter case.
Groma supplies the selected files after Git ignores and scanner exclusions.
The worker receives those files as an in-memory snapshot. It cannot discover
additional files through an editor, a remote copybook library, or a filesystem
search. Source text must be UTF-8; convert an EBCDIC export before scanning.

Set `copybookPaths` on the scanner entry in `groma/plugins.json`. It is an
ordered list of directories relative to the repository root, defaulting to
`["."]`. Groma's configuration owns these paths; they are not OKF metadata.
For the supported CardDemo slice, retain the installed `source` and set:

```json
{
  "id": "cobol",
  "source": "./tools/cobol-scanner-package",
  "include": [
    "/app/cbl/CBSTM03A.CBL",
    "/app/cbl/CBSTM03B.CBL",
    "/app/cpy/*.[cC][pP][yY]"
  ],
  "exclude": [],
  "settings": { "copybookPaths": ["app/cpy"] }
}
```

COPY searches those directories in order for a selected member, with an optional
`.cpy` suffix and case-insensitive member matching. Two matching selected files
in one directory are ambiguous and fail the scan. An excluded file is never
read as hidden context. COPY and COPY REPLACING are handled by the parser.
A missing copybook or undefined data name produces a warning. Syntax errors
fail the scan without a partial observation; Groma's normal failed-scanner
lifecycle keeps the last saved architecture.

## Evidence and map meaning

Each selected source file enters the inventory. A top-level `PROGRAM-ID` adds a
named program symbol, using its declaration rather than the filename. Code
details in both viewers and static export list programs at their original name
lines. Separate programs in one source file remain separate outline entries.
Nested programs are omitted from the outline, like other nested declarations.
Paragraphs, sections, data items, and copybooks do not add outline entries.

The worker reports each declared program as an operation and each parsed CALL
with an original line and UTF-16 offset. Literal calls on one physical line can
name matching top-level program declarations as candidates. Literal spelling
is preserved; unquoted program identifiers are normalized to uppercase.
Runtime load libraries and link configuration are unknown, so every CALL stays
`unresolved: true`, including one with a local candidate. Calls through a data
item remain unresolved with no candidates; a VALUE clause is not proof of the
value at a later call. Procedure COPY containing CALL or PROGRAM-ID fails with
an explicit scope error because the current invocation contract cannot represent
its separate expansion and physical origins.

These are temporary source facts. Ordinary direct CALLs do not create map
arrows in this revision. There are no operation fingerprints, HTTP facts,
JCL entry points, or CICS/SQL relationships. A program name alone does not prove
an application boundary. Shared COPY does not emit `sourceUnits`, so using one
copybook never merges its callers into a component.

In C4, program declarations and calls are supporting Code knowledge. Core and
human curation still own system, container, component, and relationship meaning.
In OKF 0.2, architecture remains ordinary Markdown with exact Code links and
authored explanations. An ordinary reader can follow those links; Groma
interprets the existing ownership metadata and the scanner's temporary outline.
No COBOL-specific architecture kind or stored metadata is added.

Free-format source, other compiler dialects, EBCDIC decoding, runtime data flow,
PERFORM control flow, JCL, load-module aliases, CICS, SQL, and procedure-copy
call origins need a later approved example. The parser may recognize some of
that syntax; recognition does not establish supported architecture inference.

## Implementation and validation

`src/index.ts` owns the plugin hooks, source selection, and conversion to the
shared scanner contract. `java/md/groma/cobol/Engine.java` restricts Eclipse to
the supplied snapshot and local COPY paths. `Main.java` extracts parser nodes
and diagnostics; `Source.java` translates their ranges back to original source.
The shared outline contract owns `kind: 'program'`. Viewers only render it.

Maintainers build with a JDK supporting Java 21 or later and Bun:

```sh
bun plugins/scanners/cobol/build.ts
bun test test-bun/cobol-scanner.test.ts
```

The build downloads one pinned upstream VSIX into the ignored `dist/` directory,
checks its SHA-256, and packages its unmodified engine, licenses, worker, and
host runtime. Later builds reuse that verified archive. The release script
combines host runtimes through the same mechanism as the Java scanner. The
installed package has no project dependency installation or tool download step.

The independent fixture in `test/fixtures/cobol-source/` checks multiple
programs, original CRLF/UTF-16 locations, COPY REPLACING, exclusions, uncertain
calls, and failures after a copybook edit. The shared fresh-checkout package test
also relocates COBOL and runs it with language tools absent from PATH.

The real-project qualification uses
[CardDemo](https://github.com/aws-samples/aws-mainframe-modernization-carddemo)
at commit `59cc6c2fd7ebd7ef7925cad552a01a4b8b6e4d5e`. Its selected slice yields two
program operations, fourteen CALLs, and thirteen local `CBSTM03B` candidates.
The remaining call names external `CEE3ABD`. All remain uncertain runtime calls.

Potential later qualification projects are
[Bank of Z](https://github.com/IBM/bank-of-z) for mixed batch and transaction
code, and [GnuCOBOL contributions](https://github.com/OCamlPro/gnucobol-contrib)
for another compiler family. They are research candidates, not supported
examples for this revision.
