# Kotlin scanner validation

The experimental scanner was tested on 2026-10-11 using its built, relocated
package on macOS ARM64, Bun 1.4.3 and the bundled Java runtime. Each checkout
was pinned to the commit below. No project build or dependency installation ran.

| Project | Commit | Selected `.kt` files | Operations | Unresolved calls |
| --- | --- | ---: | ---: | ---: |
| [Coil](https://github.com/coil-kt/coil) | [`8efac6f9`](https://github.com/coil-kt/coil/tree/8efac6f9d34716e5bbdd08a7e31c6e075dfca542) | 347 | 1,351 | 2,813 |
| [Koin](https://github.com/InsertKoinIO/koin) | [`dc86ef8d`](https://github.com/InsertKoinIO/koin/tree/dc86ef8dd8fbe8564fb7453c03f5b738da3450bb) | 357 | 1,262 | 3,221 |
| [Arrow](https://github.com/arrow-kt/arrow) | [`3373cce8`](https://github.com/arrow-kt/arrow/tree/3373cce8a0658c95857d748210547d6b50dd5e9d) | 253 | 2,552 | 4,640 |
| [Now in Android](https://github.com/android/nowinandroid) | [`a49ed253`](https://github.com/android/nowinandroid/tree/a49ed253d75e61a2b6ab80a8da677b57437b08eb) | 253 | 526 | 1,156 |
| [Ktor](https://github.com/ktorio/ktor) | [`4717dd5f`](https://github.com/ktorio/ktor/tree/4717dd5fe8270a40fc97ba0b03bb63f722717786) | 2,432 | 13,513 | 35,580 |

All five passed, covering **3,642 files, 19,204 operations and 47,410 calls**.
Selection used Groma's normal scanner include/exclude rules. Ktor has custom
folders such as `jvm/test`, which remain selected by the defaults; these counts
are selected source, not production-only source. Adjust the selection for a
project's intended architecture view.

## Checks performed

The scanner ran with an empty home directory and `PATH=/nonexistent`, using its
bundled runtime. JavaScript network requests were blocked. For each project:

- File inventory and source listing matched the selected paths exactly.
- Two scans produced identical observations.
- Operation and call offsets were within the original UTF-16 source; call lines
  matched those offsets and every call named an existing caller operation.
- Calls remained unresolved with no guessed targets.
- Outlines contained only selected files, with valid source lines and visibility
  values from the shared outline contract.
- Git status was unchanged after scanning and reading outlines.

These checks establish parsing, delivery and structural consistency on real
source. They do not independently prove every inferred declaration or call.
The authored regression fixture in `test/fixtures/kotlin-source/scopes/` checks
call ownership and visibility against known answers: deferred nested bodies and accessors,
immediate object initialization, sealed/enum constructors, inherited access,
cross-file imports, and omission of overrides whose access cannot be proved.

The isolated-package test is `test-bun/kotlin-scanner.test.ts`. The shared
`test-bun/scanner-fresh-checkout.test.ts` also verifies scanning with no project
dependencies or installed language tools. See the [scanner documentation](index.md)
for the supported evidence and source-only limits.
