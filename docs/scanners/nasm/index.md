# NASM assembly scanner

The official `@groma/scanner-nasm` package reads one NASM x86-64 assembly unit
in its Linux ELF64 configuration. It includes NASM 3.02. Scanning needs no
installed assembler, linker, SDL library, project build, or network access.
This revision is qualified against the city-building game
[Cityssembly](https://github.com/mixy1/cityssembly/tree/b5ff5470bedd24ad6bd55e71fa47d3ffcc7ed4b0).
It does not cover MASM, other CPUs, or every NASM build configuration.

## Source selection and settings

The package selects `.asm` and `.inc` files. Groma applies Git ignores and the
configured include/exclude lists first. The scanner copies only the selected
UTF-8 sources to a temporary directory, then preprocesses the configured entry.
An included file must be selected; excluded files never supply hidden context.
Literal relative `%include` paths are supported. Missing includes and
preprocessor errors fail the scan without a partial observation.

`entry` defaults to `main.asm`; `includePaths` defaults to `["."]`. Both use
paths relative to the repository. For Cityssembly, keep the installed `source`
and set its scanner entry in `groma/scanners.json` to:

```json
{
  "id": "nasm",
  "source": "./tools/nasm-scanner-package",
  "include": ["/src/*.asm", "/src/*.inc"],
  "exclude": [],
  "settings": { "entry": "src/main.asm", "includePaths": ["src"] }
}
```

The scanner uses NASM `-E -f elf64` without project-defined command-line macros.
It does not run Makefiles or link the game. Preprocessing handles macros,
includes and active conditional branches; it does not validate all assembly
instructions or expressions that need assembled addresses. Binary assets are
not architecture sources.

## Evidence and map meaning

An exported or directly called label in `.text` is a routine entry. Data and
ordinary branch labels do not become routines. Nonlocal routines appear as
function declarations in Code details, at their original source lines. An
exported routine has public visibility; other routines have internal visibility
within the selected assembly unit. Called local labels supply operation facts,
but do not add top-level outline entries.

Direct calls to known labels in this unit have local targets. Register calls,
memory calls and external providers remain unresolved. Calls retain their
original physical file, line and UTF-16 offset. A macro-generated label or call
points to the outer macro invocation, so a developer opens the code they wrote.
The scanner does not follow jumps or recover complete control flow.

These facts are temporary. Calls and includes do not add automatic map arrows,
merge source owners, or establish an application container. The scanner emits
no execution-entry facts, operation fingerprints or explicit source units.
Components remain under their known system when core has no container evidence.
People curate the game's responsibilities and relationships using the existing
architecture commands.

In C4, routine declarations are supporting Code knowledge, not new architecture
elements. In OKF 0.2, the map remains ordinary Markdown with typed architecture
concepts and source links. An ordinary reader can follow those links and read
the explanations. Groma interprets existing ownership and temporary scanner
facts; no assembly-specific stored metadata or C4 level is added.

## Implementation and validation

`src/index.ts` owns the plugin hooks and shared-contract output.
`src/preprocess.ts` builds the selected snapshot and invokes the bundled tool.
`src/evidence.ts` reads NASM source-location directives, labels and calls.
For an outline, core supplies Code paths from the loaded architecture, filtered
by scanner selection. This includes macros owned by another component and works
with historical source snapshots that have no Git metadata.

Maintainers build with Bun and a C compiler: `make` on Unix, or Visual Studio
C tools and `nmake` on Windows.

```sh
bun plugins/scanners/nasm/build.ts
bun test test-bun/nasm-scanner.test.ts
```

The build downloads the pinned NASM source archive, verifies its SHA-256, and
changes one preprocessing location lookup from the macro definition to the outer
invocation. It bundles the resulting host executable and its BSD license. The
Windows builds also apply NASM's
[upstream header inclusion fix](https://github.com/netwide-assembler/nasm/commit/ace0078261329437224d4875b289647279a41fa1)
so the Windows SDK receives its host architecture definitions. These changes
preserve macro expansion and assembly semantics.
The release script combines the five host builds into the installed package.

The small fixture tests active branches, macro/include origins, CRLF/UTF-16
positions, local labels, uncertain calls and excluded includes. The shared
package test relocates the scanner and scans twice with no language tools on
PATH or network access. Cityssembly at the pinned revision supplies 59 source
files, 924 routine operations and 4,392 calls. Its `main`, `game_tick`,
`sim_tick`, `render_world` and `audio_update` routines provide a concrete
game-loop navigation example.
