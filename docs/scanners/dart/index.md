# Dart scanner

The experimental `@groma/scanner-dart` package reads Dart source, including Flutter
applications and Serverpod backends. It supplies source inventory, Code outlines,
operation and unresolved call evidence, `main` entries and explicit library parts.

```bash
groma plugin add @groma/scanner-dart
```

The package contains Dart analyzer 14.5.0 compiled with Dart SDK 3.13.5 into a
standalone executable. Scanning requires no installed Dart or Flutter SDK,
project dependencies, package download, `pub get`, build or code generation.
The package passed [fresh-checkout fixture checks](https://github.com/MrLesk/groma.md/actions/runs/38817786034)
on Linux and Windows x64/ARM64 and macOS ARM64. Real-project qualification is
from macOS ARM64.

## Inputs and source structure

The scanner reads selected `**/*.dart` source and `**/pubspec.yaml` language
metadata. Its defaults exclude
`.dart_tool/`, `build/`, `test/`, `integration_test/` and `**/*_test.dart`.
Generated Dart remains available when selected. Edit these patterns in the
scanner's `config.json` entry when generated code or tests belong in the view.
Only selected inputs are read; analysis options, generated package configuration
and imported source are never discovered automatically. Syntax errors fail with
the physical filename and line.

The nearest selected ancestor `pubspec.yaml` sets the package language version
from the major/minor lower bound of `environment.sdk`, following
[Dart language versioning](https://dart.dev/language/versioning). A source
`// @dart = major.minor` comment overrides that default through the parser. This
matters for valid older syntax, such as generated `final` parameters that Dart
3.13 no longer accepts. Without selected package metadata or an SDK lower bound,
the parser retains its bundled latest-language default. Excluded metadata cannot
affect parsing. Pubspecs supply parser settings only: they never become source
inventory, Code files, component owners or runtime boundaries. Code outlines use
the same selected metadata supplied by Groma, including historical snapshots.

A library's literal relative `part` directive groups selected files only when
the selected part agrees through `part of` URI or its library name. Ordinary
imports, shared directories and similar filenames never group files. Missing,
excluded and package-URI parts do not gain an association. The library's source
file is the unit's primary file; core decides how that unit joins existing owners.

Code outlines list top-level functions, direct top-level function values,
classes, enums, mixins and extension types. Direct methods and explicit
constructors appear beneath their type in source order. Names and lines are
physical source locations; operation and invocation positions count UTF-16
code units. Members retain their own visibility. Names beginning with `_` are
library-private; other names are public. Dart privacy covers the declaring
library and its parts, not just the declaring class.

Aliases, fields, properties, accessors and nested functions are absent from
outlines. Extensions contribute inventory and operations, but their method sets
are not presented as a new type. Bare names mark function and member Code entries;
named constructors use `Type.name`. An unnamed constructor is displayed as `Type`
but requires an explicit `Type.new` entry link, so a type link never marks its constructor.

## Execution and calls

A top-level `main` function with a body provides an execution entry. Its membership
contains its physical file and explicit selected library parts. Import closure,
Flutter build targets and Serverpod configuration do not establish membership.
The parser does not type-check the `main` signature against dependencies.

Named top-level functions, function values, direct methods and explicit
constructors provide operations. Calls and constructions in their bodies and
constructor initializer lists remain unresolved: neither import spelling nor
method name proves a target. Nested local functions and callbacks are omitted,
so their calls never appear as work owned by an enclosing method. Accessors,
field initializers and implicit constructors are outside the supported evidence.
No binding-normalized body tokens or duplicate-body findings are produced.

A Flutter `Widget`, `build` method or Serverpod `Endpoint` is source detail. It
does not by itself establish a C4 component, container, endpoint, lifecycle call
or cross-process relationship. The scanner does not infer Flutter navigation,
provider dispatch, Serverpod RPC or HTTP routes. These limits apply to both
client and server code even when they share a repository.

## Ownership and maintenance

The adapter reads selected text and starts the packaged worker.
`worker/lib/language_versions.dart` reads selected package language defaults;
`worker/bin/main.dart` parses Dart with those defaults and source overrides; `worker/lib/source.dart` owns declarations and operations;
`worker/lib/calls.dart` walks only the current executable body. `src/parts.ts`
checks reciprocal library associations. Core owns architecture placement and
relationship interpretation. Existing OKF Markdown and Code links stay readable
without this scanner; no Dart-specific architecture metadata or C4 level is added.

Maintainers need Dart SDK 3.13.5 only when building the package:

```bash
bun plugins/scanners/dart/build.ts /tmp/scanner-packages/dart
GROMA_TEST_PACKAGES=/tmp/scanner-packages bun test test-bun/scanner-fresh-checkout.test.ts -t 'dart package'
```

The build resolves only the worker's committed dependency lock, compiles a native
executable and carries all dependency license notices. Each target is built on
its native CI host. The packaged scanner never executes project tooling.

## Real-project qualification

Independent retesting on 2026-10-14 used each package's default source selection
without extra exclusions or source changes:

| Project | Pinned revision | Dart files / selected pubspecs | Result |
| --- | --- | ---: | --- |
| [LocalSend](https://github.com/localsend/localsend/tree/14f3a87426eedffaa9d87d011132eca5501abeb8) | `14f3a87426eedffaa9d87d011132eca5501abeb8` | 369 / 6 | Scan and Code outlines pass |
| [Pub](https://github.com/dart-lang/pub/tree/9df389a76385f82c1165c7cf93b78807b5ea8890) | `9df389a76385f82c1165c7cf93b78807b5ea8890` | 145 / 2 | Scan and Code outlines pass |
| [Pixorama](https://github.com/serverpod/pixorama/tree/6a3603ddfd5cc9368ad90ca839b377f33d099d6e) | `6a3603ddfd5cc9368ad90ca839b377f33d099d6e` | 14 / 3 | Scan and Code outlines pass |

LocalSend retains its server and outgoing-transfer responsibilities, 38 explicit
library-part associations, and all 40 declarations in the previously rejected
generated server file. Its callback bodies do not become direct calls of their
enclosing methods. Pub retains its command and dependency-solver declarations;
Pixorama retains separate Flutter and Serverpod entries without invented RPC edges.

Historical LocalSend outlines use the pinned package language version even after
the current pubspec changes. Excluding that metadata makes old-language syntax
fail in both scans and outlines, confirming there is no hidden metadata lookup.
All selected source files have one owner; metadata has none. Repeated scans and
outlines agree, source hashes remain unchanged, and scans run with networking
denied and without Dart or Flutter tools. These macOS ARM64 results establish
the documented source evidence, not resolved framework or runtime relationships.
