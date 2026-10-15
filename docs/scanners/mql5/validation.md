# MQL5 repository trials

An independent agent chose these four projects and recorded expected source
responsibilities before scanning. Its first full-selection trial exposed ordinary
language defects and macro/conditional-source gaps. Those witnesses drove the
focused corrections below. The implementation replay on 2026-10-15 uses
`@groma/scanner-mql5` 0.1.0, macOS ARM64, Bun 1.4.3, Groma base
`9cc7e909febc63d5128f65ecb65bd5226fa829d8` plus TASK-597. Final independent qualification confirms all six full selections and all 58
original source witnesses; integration checks remain separate.

The final grammar WASM SHA-256 is
`2b6ab7d8b63d329b6a0784f15032950857e0bec50bb09e4f845c2a43d66e7110`.
The packaged JavaScript entry SHA-256 is
`7024c4f7f1e6dde0a8824d3c0b6cab6522ebd3afb03d2f51f5fb55aacbbf1dd2`.
Its upstream revision, source patch, licenses and rebuild instructions are in
[parser provenance](../../../plugins/scanners/mql5/assets/PROVENANCE.md).

## Full selected-source coverage

Selection includes `.mq5`, `.mqh` and explicitly selected `.h` headers.
PositionSizer excludes `MQL4/**`. EA31337 includes all 272 original MQL files
plus 171 shared `.h` files; their actual macro definitions are needed to interpret
opaque source roles without guessing names. `.h` is not a discovery signal.
No failing selected file is hidden or removed. No `.mq4`, compiled binary, DLL,
MetaTrader SDK or project dependency is loaded.

| Repository | Exact revision | License | Selected / inventoried | Operations | Unresolved calls | Own-file entries |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| [EarnForex/PositionSizer](https://github.com/EarnForex/PositionSizer) | `dadf3d5c869c34cac40db3fb6858b188cf101a25` | Apache-2.0 | 19 / 19 | 245 | 5,871 | 1 |
| [dingmaotu/mql-zmq](https://github.com/dingmaotu/mql-zmq) | `802c86c9e3647c917151ff724ffd15baa9bc152c` | Apache-2.0 | 12 / 12 | 170 | 262 | 0 |
| [geraked/metatrader5](https://github.com/geraked/metatrader5) | `d3eb29c382acf715727d5cd6a0414151e821fc2d` | MIT | 48 / 48 | 368 | 2,728 | 18 |
| [EA31337/EA31337-classes](https://github.com/EA31337/EA31337-classes) | `a723dd7768f4b1cfb97b2be2216d1aa951565bda` | GPL-3.0 | 443 / 443 | 3,964 | 8,955 | 99 |

All four complete selections now parse, scan and produce Code outlines. The
outline totals are respectively 24/19/27/618 types and 358/186/117/3,492 members.
These are source-evidence counts, not complete architecture coverage. Every call
remains unresolved and no collaboration relationship is inferred. Missing edges
do not prove that responsibilities are independent.

## Expected responsibilities and observed evidence

| Project | Source-backed expectation | Observed result and limit |
| --- | --- | --- |
| PositionSizer | The main EA refreshes a position-calculation panel and calls trailing-stop support. `CPositionSizeCalculator` and `CHorizontalRadioGroup` own UI behavior. | The main file retains 7 operations, the calculator 206 and radio group 12. `OnTick` at main source line 675 owns the calls to `ExtDialog.RefreshValues()` at 684 and `DoTrailingStop()` at 686. `CPositionSizeCalculator::RefreshValues` owns recalculation and display calls at 2455–2460. SDK event maps remain opaque: no generated `OnEvent` or callback relationships. |
| mql-zmq | Context owns native context lifetime, Socket owns socket operations, ZmqMsg owns messages and SocketOptions owns settings. Reusable headers do not establish an executable boundary. | All headers are inventoried. `Socket::send` keeps physical native-call evidence; `SocketOptions` retains 5 proven body operations. `getStringOption` calls `getOption` and conversion/free helpers at 336–342. `subscribe`/`unsubscribe` keep their written bodies and calls: selected pasted-name candidates cannot change their owner. Their outline access remains unknown after the preceding opaque member macros. Generated overload wrappers are absent, and no target for `setSubscribe` is invented. |
| metatrader5 | Strategy EAs, indicators, storage helpers and scripts have separate source responsibilities. `Storage_Test.mq5` is a direct script entry. | StorageGet/StorageSet and strategy/indicator methods remain. `StorageGet` owns DatabasePrepare/DatabaseRead calls; `Storage_Test` owns StorageGet calls. Six direct EA entries previously hidden by unrelated path/buffer constants are now retained. Indicator properties still suppress entries, and OnCalculate remains an ordinary operation. |
| EA31337-classes | Framework classes cover trade/account state, timing, indicators, serialization and storage; explicit test scripts are entries, not deployed services inferred from directory names. | Trade retains 92 body operations, Timer 14, Database 20 and Matrix 123. `Trade::RequestSend` owns source-written account/logger/Order calls at 767–786; `Timer::Stop` owns GetTickCount/GetPointer calls. Trade's actual class now follows its forward declaration and include guard in the outline. Macro-dependent APIs and configured bodies remain withheld. The 99 entries are selected test programs. |

PositionSizer's `#define VERSION "3.16d"` at line 9 is metadata, not uncertainty
about its literal `void OnTick()` signature. Its entry contains only
`MQL5/Experts/Position Sizer/Position Sizer.mq5`. The same rule restores the
metatrader5 AFAOSMD, BBRSI, CEZLSMA, DHLAOS, LRCMACD and LRCUTB entries, and
EA31337 OrderTest/ValueStorageTest. Conditional handlers/properties, macro-replaced
names or result types, competing hidden handlers and opaque global declarations
still prevent a certain entry. Includes never establish membership.

## Evidence deliberately withheld

Selected macro definitions supply bounded syntax roles, not expanded declarations.
Same-width placeholders retain every newline and UTF-16 offset. Unknown unsupported
syntax still fails. All selected definition alternatives must support the chosen
role; the scanner neither resolves an include graph nor chooses compiler flags.
Ordinary constant arguments such as `Print(LABEL)` remain source call evidence.
Actual macro invocations and their arguments do not become runtime calls.

Comparing the bounded analysis with an intentionally unsafe candidate walk of the
same parse trees shows why a parse count is insufficient:

- EA31337 withholds **25 operation candidates whose headers depend on macros**
  and **2,435 call candidates** in affected statements, control bodies or macro
  invocations. Examples are `STRUCT_ENUM` headers in `EA.mqh`, `EA.struct.h`,
  `Task/*.struct.h`, `Trade/TradeSignal*.h`, and the `DictIteratorBase` constructor.
- mql-zmq withholds **13 call candidates**. The generated SocketOptions API is
  additionally unknown; its number cannot be measured without expansion.
- These candidate counts are not guaranteed missing runtime calls. Macro
  arguments may never execute or may expand differently. The unsafe candidate
  walk is a measurement only, not shipped scanner behavior.
- Opaque member macros can inject access labels. Later access remains unknown
  until a written label restores proof. This removes 7 mql-zmq and 58 EA31337
  outline members compared with the earlier prototype, plus one EA type row
  whose only usable out-of-class members became uncertain. Body operations remain.

Central methods survive, but the macro-generated event dispatch and overload APIs
are not explained. Conditional constructors and shared conditional `if` bodies
remain omitted. Conditional bases do not create inheritance facts. Class-template
methods, nested types, inherited members, implicit constructors and call target
resolution remain outside the current evidence scope. The result is useful source
responsibility evidence, not a complete inferred collaboration diagram.

## Concrete witnesses and regressions

The two focused MQL5 test files cover these source-backed failures. Before-fix
runs confirmed the reported defects; tests check evidence and locations rather
than exact diagnostic prose.

- metatrader5 `Include/Storage.mqh:58`: `typename(T)` comparison and operator
  treatment; mql-zmq `Include/Mql/Lang/GlobalVariable.mqh:304`: `long(...)` casts.
  Primitive conversions omit pseudo-calls while nested real calls remain.
- PositionSizer main source: named inputs and identifier-valued input groups/
  labels. Its two UI headers use the documented paired standard-library event map.
- mql-zmq `Include/Mql/Lang/Error.mqh:36`: UTF-16 conditional array entries;
  `Include/Zmq/SocketOptions.mqh:149–194`: selected wrapper/declaration macros.
- EA31337 `BufferFXT.mqh:235/239`, `Trade.mqh:103`, `BufferStruct.mqh:58`:
  explicit-void constructors/destructors and `this` object assignment.
- EA31337 `Indicators/Indi_OBV.mqh:79`, `Database.mqh:121–137`,
  `Dict.mqh:377–379`, `Log.mqh:232–234`: raw conditional parameters,
  constructor/template and shared `if` headers, without branch selection.
- EA31337 `Candle.struct.h:46–50`, `Bar.struct.h:45–49`,
  `SymbolInfo.struct.h:40–44`, `Std.h:271–274`: conditional bases/constexpr.
  `DateTime.extern.h:38–52` and `Std.h:212–222` contain configured C++
  emulation constructors named `datetime`/`color`; their configured classes
  remain omitted.
- EA31337 `Indicator.define.h:106–132`: continued macro comments must not
  consume the following declaration. `MQL4.mqh:565` and `Matrix.mqh:1987–1990`
  supply control-header macro witnesses; their dependent body calls stay absent.
- Reduced controls prove unchanged CRLF/astral UTF-16 locations, no reads of
  unselected defining headers, no macro-argument execution, access uncertainty,
  rejection of too-short placeholders and invalid/undefined syntax, and no entry
  from an already-parseable handler name replaced by a selected macro.

## Macro caller and member ownership

Selected macros can close a written function or type and open another. The
literal-replacement control for `OPEN()` → `} void generated() {` proves that
following calls cannot be assigned to the apparent outer caller. Likewise,
`SHIFT()` → `}; class Generated {` cannot leave following members assigned to
`Written`, even after a written `public` label. These follow the official
[macro substitution rule](https://www.mql5.com/en/docs/basis/preprosessor/constant),
without compiler or project execution.

The scanner records how many enclosing brace scopes directly balanced replacement
tokens can close. Unsafe selected references, uncertain arguments and unbalanced
tokens leave that depth unbounded. Mixed object/function-like conditional
definitions retain uncertainty even when they have no common invocation shape.
A literal function header remains, but its unproven body calls are omitted with
`MQL5_UNCERTAIN_CALLER`. An escape reaching the enclosing type also withholds later
members, operations and calls with `MQL5_UNCERTAIN_OWNER`. Earlier members remain.
A written access label cannot reestablish an unknown type owner.

The independent double-scope witness uses
`ESCAPE()` → `} }; class Generated { void generated() {` inside `Written::first`.
The literal control proves that the later `second` belongs to `Generated` with
private access. The regression retains `first` and earlier members but rejects
false `Written::second`, public access and its calls. The one-brace
`METHOD_SHIFT` control still preserves sibling ownership. No generated name is
inferred from either original macro.

Pasting with exactly one formal operand and fixed identifier prefix or suffix can
be bounded without constructing a name. Every selected macro name matching that
prefix/suffix must have contained scope. Empty arguments can yield just the fixed
tokens; all selected alternatives participate. Cycles, two-formal pastes and
unknown token shapes remain unbounded. The unsafe matching-name regression uses
`_pool_d` as a conditional scope-changing alternative to `_pool_##N##d`, invoked
with `CHECK()`. Generated declarations, bodies and argument calls remain opaque.

This bounded proof preserves literal evidence in the unchanged selected sources:

- EA31337 `Matrix.mqh:1872` uses `_pool_##num##d` and `_stride_##num##d`.
  Compared with the frozen unbounded-paste guard, **10 methods and outline
  members, plus 52 source-written calls**, are restored. The methods are
  GetPooledSizeTotal, GetDimensionsTotal, GetPooled, ChunkOp, ShapeCompatible,
  ShapeCompatibleLossely, CreateFromString, FromString, ToString and Repr.
  The 52 calls include 10 inside GetPooledSize; macro calls remain omitted.
- Roffild `Include/Roffild/UnitTest.mqh:54` uses `test_##NUM`. The proof restores
  **getCount, the constructor and setCount**, plus **5 literal run-body calls**
  at lines 33/155/157/159/163. It also preserves the direct own-file OnStart
  entries of ArrayList, MLPDataFile and Serialization unit-test scripts.
- mql-zmq `SocketOptions.mqh:196` uses selected `get##NAME`/`set##NAME` wrappers.
  **subscribe/unsubscribe and their two calls** retain their written owner.
  Both outlines still lack proven access, and no generated wrapper is emitted.

No previous operation, call or entry is removed by that refinement. PositionSizer,
metatrader5 and Ehlers are unchanged. These are source-backed restorations, not a
claim to know macro-expanded APIs or complete collaboration evidence.

## Quoted directive boundaries

The C-derived raw directive rule could silently consume a following function when
a quoted replacement contained `"/*stdin*\\"` before a later real block comment.
Complete quoted tokens now remain literal throughout the directive sequence,
including inside parentheses and adjacent to another string. The reduced
regression first failed by omitting `middle` and its call. It now preserves all
three written functions, calls and exact physical positions. Real comments and
continued directives keep their boundaries, and all 109 original grammar examples
pass unchanged. A trailing line comment containing an apostrophe also keeps its
comment boundary: ordinary slash tokens exclude both comment openers. The
regression includes that reported failure and a continued real block comment;
MQL5 already handled the latter through its existing continuation rule. These
lexical corrections change no facts in the six selected repositories.

## Two further independently selected projects

The independent tester recorded exact selections, source hashes and expected
responsibilities before scanning. Both use the full original selections below;
no failing file was removed. The final independent packaged/core replay confirms
these observations and all original witnesses without changing the expectations.

| Repository | Exact revision | License | Selected / inventoried | Operations | Unresolved calls | Own-file entries |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| [Roffild/RoffildLibrary](https://github.com/Roffild/RoffildLibrary) | `6285c60f36334c6c8507c358fded789cebd344dc` | Apache-2.0 | 30 / 30 | 273 | 1,021 | 8 |
| [thetestspecimen/ehlers-indicators-mql5](https://github.com/thetestspecimen/ehlers-indicators-mql5) | `4208821b05355dd1330cf20298b11ef0ce3f280a` | MIT translation; README records original algorithm copyright | 12 / 12 | 101 | 492 | 0 |

Roffild selects 29 MQL files and the explicitly named shared
`Libraries/Roffild/PythonDLL/public.h`; native private/build headers remain outside
the prepared selection. Its source-backed responsibilities are collections,
logging/data utilities, chart output and a Python bridge. The scan keeps 49 types
and 255 members, including literal collection methods and bridge/example source.
Both direct PythonDLL and ToIndicator example entries remain. No DLL, Python
resource or trading code is loaded or run, and calls do not create cross-language
architecture edges.

Three exact source forms blocked its original full scan:

- `Include/Roffild/ArrayList_macros.mqh:19/72/78/277`: backslash before whitespace
  and a line comment within a continued definition. This observed shape is opaque
  directive input, with a diagnostic; compiler acceptance is unverified. Reduced
  controls prove the first ordinary newline ends the definition and ordinary
  following declarations retain exact CRLF/UTF-16 positions.
- `Libraries/Roffild/PythonDLL/public.h:36–39/79–91`: selected DLL signature
  wrappers and reference/pointer/array parameter wrappers. All alternatives must
  have the bounded source form. Whole dependent callable signatures are omitted;
  no branch, return type, visibility or ABI is chosen.
- `Include/Roffild/UnitTest.mqh:17` and
  `Scripts/Roffild/UnitTests/ArrayList_UnitTest.mq5:33`: selected virtual boolean
  headers with a pasted name parameter and string-reference parameter. All **29
  generated callable headers** remain omitted with their bodies; the placeholder
  creates no method name, access, operation or call. Adjacent literal methods
  remain. The bounded selected-name proof preserves five literal `CUnitTest::run`
  body calls and the three direct unit-test script entries; no generated test
  method or callback invocation is inferred.

Ehlers selects all 12 `.mq5` indicator translations and no compiled `.ex5` files.
Its calculation and helper operations remain; indicator properties correctly
produce no OnTick/OnStart execution entries. The 12 type rows and no member rows
come from its written source types. Repeated helper names in different files do
not prove a target or common deployment boundary.

Unknown definitions, nonmatching header/linkage shapes and ordinary malformed
code still fail. This complete selected-source processing is not a claim of
complete macro-generated architecture or compiler-level language validation.

## Operational evidence and integration

The promoted source passes 33 concurrent semantic tests with 157 assertions,
TypeScript and Biome checks. All 109 upstream grammar corpus cases pass without
changing their expectations. The isolated package consumer passes 7 assertions.
No compiler, MetaTrader, MetaEditor, project build/install script, trading code,
broker access or macro expansion ran.

Final independent qualification uses the frozen package hashes above. All **58
original source witnesses** and **11 precision/comment controls** pass through
packaged hooks and actual Groma core. The same six full selections scan, load
architecture and expose Code outlines. No file, source expectation or prepared
include/exclude rule was changed. All project observations, diagnostics and Code
outlines match the previous bounded-paste candidate after normalizing only the
engine revision. The exact quoted/comment regression is repaired without changing
any previous project fact.

The independent replay also runs all six CLI scans with network denied and only
Git on PATH. The implementer package replay uses an empty tool PATH. Observations
repeat exactly, selected inventories match, source hashes and tracked files stay
unchanged, and entries contain only their declaring file. Every call stays
unresolved; the six worlds contain zero relationships. Full source processing is
not complete macro-generated architecture or collaboration reconstruction.

Cold simplicity and full-context complexity reviews pass. The final targeted
complexity re-review found no material recommendation; implementer specification/
quality reviews and independent replays pass for the reproduced corrections. The earlier full repository check
passed 16 Node tests and 819 Bun tests, with 55 opt-in skips, zero failures and
3,086 Bun assertions. Parent integration owns the final combined repository
check; no repeated standalone full check is claimed here. Windows/Linux execution
qualification is separate from this macOS trial; all platforms use the same
packaged WASM assets.
