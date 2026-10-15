# C++ scanner qualification

Engine `0.23.4-groma.3` was tested against seven pinned open-source selections.
Six complete selections pass: **262 of 262 selected files**. The unchanged
1,300-file OpenTTD selection fails explicitly. It includes Objective-C and
JavaScript source plus macro definitions outside the selection. This is useful
experimental C++ coverage, not universal preprocessing or mixed-language support.

The independent tester chose the projects and recorded expected responsibilities
from source before scanning. No source selection was narrowed to obtain a pass.
No project was built, no SDK headers were followed, and no macro replacement or
build configuration was invented. The final tests used the same frozen package.

## Pinned selections and results

| Repository and exact revision | Intended source selection | Result | Operations | Unresolved calls |
| --- | --- | --- | ---: | ---: |
| [TinyXML2](https://github.com/leethomason/tinyxml2/tree/8224e427b655b83dae5e2298f1e6919523a78737) — `8224e427b655b83dae5e2298f1e6919523a78737` | `tinyxml2.h`, `tinyxml2.cpp` | 2/2 files | 397 | 680 |
| [LevelDB](https://github.com/google/leveldb/tree/bb74ef739973a70ca9f0d90788a1da89b788c0ad) — `bb74ef739973a70ca9f0d90788a1da89b788c0ad` | `include/**/*.h`; `.h`/`.cc` below `db`, `table`, `util`, `port`; exclude `**/*test*`, `**/*bench*` | 92/92 files | 905 | 3,441 |
| [CLI11](https://github.com/CLIUtils/CLI11/tree/07c9f13b15a70c367a406e1cfe2c363aa1b66894) — `07c9f13b15a70c367a406e1cfe2c363aa1b66894` | `include/**/*.hpp` | 29/29 files | 735 | 3,185 |
| [Taskflow](https://github.com/taskflow/taskflow/tree/a7157ce166784126c3c1ee71388897b71b0bdff2) — `a7157ce166784126c3c1ee71388897b71b0bdff2` | `taskflow/core/**/*.hpp`, `taskflow/utility/**/*.hpp`, `taskflow/taskflow.hpp` | 32/32 files | 617 | 1,700 |
| [Ninja](https://github.com/ninja-build/ninja/tree/1d8d3becbfa7ebedab908cdf025a6c8d09cc5ff6) — `1d8d3becbfa7ebedab908cdf025a6c8d09cc5ff6` | `.h`/`.hpp`/`.cc` below `src`; exclude `src/third_party/`, `src/*_test.cc`, `src/*_perftest.cc`, `src/*_bench.cc`, `src/test.cc`, `src/test.h` | 87/87 files | 684 | 3,634 |
| [fmt](https://github.com/fmtlib/fmt/tree/b4ffa39b9994c961418406f47358791d89a5aa48) — `b4ffa39b9994c961418406f47358791d89a5aa48` | `include/fmt/**/*.h`, `src/**/*.cc`, including module and C-wrapper sources | 20/20 files | 1,227 | 2,604 |
| [OpenTTD](https://github.com/OpenTTD/OpenTTD/tree/daa6e1ca1c357eb9e6ae3d69af134205e1be8517) — `daa6e1ca1c357eb9e6ae3d69af134205e1be8517` | `.h`/`.hpp`/`.cpp`/`.cc` below `src`; exclude `src/3rdparty/`, `src/tests/` | Full selection fails | — | — |

Counts are source evidence, not architecture component or collaboration counts.
A file containing only includes, aliases or macros can correctly have no outline.
Both platform alternatives remain selected source possibilities.

## Expected and observed architecture evidence

- **TinyXML2:** XMLDocument manages allocation and parsing; XMLNode and XMLElement
  navigate the tree; XMLPrinter serializes it. All four types now have header and
  implementation outlines. The [XMLDocument::Parse](https://github.com/leethomason/tinyxml2/blob/8224e427b655b83dae5e2298f1e6919523a78737/tinyxml2.cpp#L2455)
  operations and their calls are present, including the internal ParseDeep call.
  The header distinguishes the public two-parameter Parse from private Parse().
  Written parameter counts now preserve both separate definitions with their
  correct public/private access and physical name lines, and distinguish the
  public two-parameter constructor from the private copy-constructor declaration.
- **LevelDB:** DBImpl coordinates reads and writes; MemTable and Version supply
  data; VersionSet manages persisted versions; TableCache retains table readers;
  Env provides operating-system interactions. These central types are now
  inspectable, including [DBImpl::Get](https://github.com/google/leveldb/blob/bb74ef739973a70ca9f0d90788a1da89b788c0ad/db/db_impl.cc#L1120).
  Separate TableCache definitions retain public Get and private FindTable access.
  Combining its header and implementation with `groma edit --combine` preserves
  both Code links, both outlines and the chosen ownership after rescanning.
- **CLI11:** App coordinates parsing/subcommands; Option owns option state;
  Validator checks values; Config reads configuration. All are inspectable.
  [App::parse](https://github.com/CLIUtils/CLI11/blob/07c9f13b15a70c367a406e1cfe2c363aa1b66894/include/CLI/impl/App_inl.hpp#L745)
  retains calls to _parse_setup, _parse and run_callback; _parse retains
  _parse_single and _process. Separate definitions preserve public parse and
  protected _parse access. Timer's deferred formatting lambda does not leak its
  body calls into make_time_str.
- **Taskflow:** Taskflow owns a graph; FlowBuilder adds nodes; Task represents
  node/dependency handles; Executor schedules submitted graphs. Graph and Executor
  are now inspectable alongside those other types. [Executor::run](https://github.com/taskflow/taskflow/blob/a7157ce166784126c3c1ee71388897b71b0bdff2/taskflow/core/executor.hpp#L2161)
  retains run_n calls, and [FlowBuilder::emplace](https://github.com/taskflow/taskflow/blob/a7157ce166784126c3c1ee71388897b71b0bdff2/taskflow/core/flow_builder.hpp#L1781)
  retains _graph._emplace_back calls without attributing deferred task bodies to
  graph construction. LazyString's conversion name retains `const std::string&`.

- **Ninja:** NinjaMain loads the manifest and delegates builds to Builder.
  ManifestParser fills the graph, DependencyScan identifies dirty work, Plan
  schedules ready edges, and CommandRunner uses subprocesses. The written
  [NinjaMain::RunBuild](https://github.com/ninja-build/ninja/blob/1d8d3becbfa7ebedab908cdf025a6c8d09cc5ff6/src/ninja.cc#L1749)
  retains Builder calls; Builder::Build retains Plan and command-runner calls.
  Private ManifestParser::Parse/ParseEdge and Builder::ExtractDeps keep their
  selected header access. Both platform subprocess implementations remain source
  possibilities, without selecting the host build configuration.
- **fmt:** Public format/vformat delegates to the parser and buffer writer; vprint
  adds file output. parse_context owns argument indexing, detail::buffer owns
  storage operations, and basic_memory_buffer owns allocation/growth. Selected
  literal namespace/export macros preserve `fmt::v12` and the later `detail`
  boundaries. [vformat](https://github.com/fmtlib/fmt/blob/b4ffa39b9994c961418406f47358791d89a5aa48/include/fmt/format-inl.h#L1458)
  retains its own detail::vformat_to/to_string calls. Private deallocation/growth
  and protected buffer::set remain distinct from public storage methods.

These calls remain unresolved; they do not become guessed architectural
relationships. In C4, library folders alone do not establish deployed containers.
In OKF, curated components remain ordinary Markdown with exact Code links.

## OpenTTD boundary and affected responsibilities

The full OpenTTD selection is **not qualified**. Its `.h` selection contains
Objective-C, and several `.cpp` files contain JavaScript embedded in Emscripten
macros. A diagnostic file-by-file parse is useful for locating these boundaries;
it is not a successful partial Groma scan and does not produce a complete map.

- [random_func.cpp](https://github.com/OpenTTD/OpenTTD/blob/daa6e1ca1c357eb9e6ae3d69af134205e1be8517/src/core/random_func.cpp#L93)
  embeds JavaScript in `EM_ASM_INT`. Rejecting that file loses RandomBytesWithFallback,
  Randomizer::Next/SetSeed and SetRandomSeed evidence.
- [unix.cpp](https://github.com/OpenTTD/OpenTTD/blob/daa6e1ca1c357eb9e6ae3d69af134205e1be8517/src/os/unix/unix.cpp#L227)
  embeds JavaScript in OSOpenBrowser. Rejecting it also loses filesystem, locale
  and clipboard helpers. Other selected `EM_ASM` source appears in
  `bootstrap_gui.cpp`, `ini.cpp`,
  `network/network_content.cpp`, `network/network_gui.cpp`, `openttd.cpp`,
  `saveload/saveload.cpp` and `video/sdl2_v.cpp`. This affects the central
  main-loop source file itself, not only optional platform helpers.
- The three `video/cocoa/cocoa_ogl.h`, `cocoa_v.h` and `cocoa_wnd.h` headers use
  Objective-C `@class`/`@interface`. Their rejected source includes the Cocoa
  video drivers and cursor, window, view and delegate interfaces.
- `survey.cpp` and `network/network_survey.cpp` use
  `NLOHMANN_JSON_SERIALIZE_ENUM`, whose definition is in the explicitly excluded
  `src/3rdparty/nlohmann/json.hpp`. The scanner does not read that file implicitly.
  Survey collectors and NetworkSurveyHandler::CreatePayload/Transmit remain
  unavailable for this selection.

These language distinctions follow the [Emscripten API](https://emscripten.org/docs/api_reference/emscripten.h.html)
and [Objective-C language documentation](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ProgrammingWithObjectiveC/DefiningClasses/DefiningClasses.html).
They are separate from the corrected C++ member pointers, conditional syntax,
selected Pool macros and other ordinary C++ grammar gaps. The missing platform,
input, display and survey responsibilities cannot be presented as a complete
OpenTTD architecture, even when individual central game-loop files parse.

A separate **1,286-file diagnostic** explicitly omits those 14 boundary files:
nine JavaScript-bearing `.cpp` files, three Cocoa headers and two JSON-macro files.
It retains 13,684 operations and 73,149 unresolved calls, but is not another
qualified full selection. All six recorded access and six caller witnesses pass,
including public [ClientNetworkGameSocketHandler::GameLoop](https://github.com/OpenTTD/OpenTTD/blob/daa6e1ca1c357eb9e6ae3d69af134205e1be8517/src/network/network_client.cpp#L223),
protected network receive/check methods, Vehicle::Tick, and game-script/video
loop members. A literal CloseConnection name alias no longer erases the later
GameLoop outline; the aliased member itself remains omitted with a diagnostic.
The diagnostic still lacks startup and both global game loops, save/load
implementation, platform/video portions and survey behavior.

## Syntax, caller and ownership checks

The grammar passes all **179 unchanged upstream v0.23.4 corpus cases** and the
independent **23 reduced source probes**. The scanner suite has **25 concurrent
tests and 137 assertions**. The new regression groups fail against the preserved
earlier package and pass with this candidate. Coverage includes:

- Complete conversion/operator identities, separate definitions, parameter-count
  access proof and anonymous-namespace ownership.
- Standard member pointers, casts, explicit instantiation, direct-list syntax,
  module/reflection syntax, selected format-string macros and conditional source.
- Physical source retention after quoted macro values, real comments and line
  continuations.
- Selected macro scope changes, opaque callable chains, guarded blocks and unsafe
  arguments. A macro closing a method cannot assign later calls or members to a
  falsely certain caller or type.
- Typed member-name aliases omit only the unproven name; literal aliases cannot
  erase later written access. Selected access-changing chains remain uncertain.
- Exact literal namespace/export frames, balanced boundaries and conservative
  fixed-prefix/suffix token-paste proof. No generated declarations or pasted
  names are emitted.

Named and built-in casts are not runtime calls. Compared with the earlier package,
TinyXML2 and CLI11 preserve their invocation evidence; LevelDB removes 15 false
primitive-cast calls and Taskflow removes nine false sized-type-cast calls.
The final guard correction removes six false `FMT_CATCH` operations while retaining
their proven surrounding caller. Typed TinyXML2 definitions remain intact even
when alternate branches define macro aliases with the same names.

The scanner never expands macros. An unknown external modifier or type-argument
invocation retains only independently proven facts and emits `CPP_MACRO_SCOPE`.
For example, Ninja's Windows SDK declaration modifiers and `va_arg` lack selected
source definitions; dependent API/caller facts are omitted even though its full
source inventory is retained. Other unproven macro scope boundaries fail explicitly.
Arbitrary replacement-generated syntax, arbitrary directive splits, full type
analysis and resolved call targets remain unsupported. See [the scanner contract](index.md#macros-and-conditional-source).

A small existing outline-label issue remains: two fmt destructor names contain
leading whitespace (`core.h:1779`, `format.h:1018`). Ownership and visibility are
correct; the independent tester recorded this as a non-blocking follow-up.

## Verification and package identity

The frozen package was checked through Groma installation, scan/reconciliation,
Code outlines, repeat scans and source-owner lookup. All 15,244 call positions
in the six complete selections match their physical source. All 1,562 selected
files across the seven snapshots remain unchanged. The independent targeted
suite passes 13 tests and 71 assertions. The selected-input and
no-tools/no-network controls ensure the scanner does not build the project,
load unselected dependencies or download tooling. This is macOS ARM64 execution
coverage; Windows/Linux execution and an operating-system network audit are not
claimed.

| Asset | SHA-256 |
| --- | --- |
| npm archive | `83c4bfaa4fd6b5d6d787f0f48449814867f2e518088d0a3c6dfdb81917582761` |
| `dist/index.js` | `4cf2f8485cf70a970c290332ca9b7da531691fd74014858063b226c4a1bee0a6` |
| C++ grammar WASM | `d9f47c06edb4363192e097a86ac91c64bd4193150ffdcc6628aa474d28f6fa4c` |
| Tree-sitter runtime WASM | `beca80e44cccbf2299ed4d1e3fa6462a9a6fe818aeebf847547a392227ce4acc` |

The independent final reports are under
`/tmp/groma-cpp-confidence/final-round-v4/reports/`; the immutable package is
`/tmp/groma-cpp-packages-confidence-v4/cpp`. Earlier packages and failure reports
remain separate. This page preserves the revisions, source scope and conclusions
without depending on those temporary artifacts.
