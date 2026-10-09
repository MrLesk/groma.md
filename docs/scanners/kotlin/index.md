# Kotlin scanner

The experimental Kotlin scanner parses selected Kotlin source with the Kotlin
compiler's own parser. Its package includes the compiler jars and a Java runtime.
Scanning and source outlines need no installed Java, Kotlin, Gradle, Maven,
project dependencies, build, or network access.

From an initialized project:

```sh
groma scanner add @groma/scanner-kotlin
groma scan
```

## Source selection

The scanner reads the `.kt` files selected by Groma's
[include and exclude lists](../index.md#selecting-source-files), wherever they
live in the repository. Defaults exclude `build/` and `.gradle/`, but keep a
package folder named `build` under a source set's `kotlin/` or `java/` root,
such as `src/main/kotlin/shop/build/`. They also exclude, in every module,
`src/test/` and the other test source sets: `src/*Test/` such as
`src/commonTest/` and `src/androidTest/`, and their variants and fixtures such
as `src/testDebug/`, `src/androidTestDebug/` and `src/testFixtures/`.
Adjust those lists to scan test code or a custom source layout.

It does not evaluate Gradle or Maven builds, discover modules or source sets,
inspect dependencies, or read generated source. Kotlin scripts (`.kts`) are not
read. A `.kt` file is a discovery clue; it does not prove a compiler version.
Files are parsed with the parser of `kotlin-compiler-embeddable` 2.4.21. Syntax
newer than that parser supports is not promised.

## Evidence and outlines

The TypeScript entry point (`src/index.ts`) filters the selected paths and
`src/adapter.ts` starts the bundled worker (`worker/md/groma/scanner`). The
worker parses each file without analyzing it and reports:

- **Symbols**: top-level classes, interfaces, objects, enum classes and
  functions. An extension function is a function under its own name. A top-level
  `val` initialised directly with a lambda or an anonymous function is a
  function too; a `var` is not, because it can be reassigned.
- **Operations**: functions with a body, secondary constructors, and such
  function-valued properties, with original source positions. A member is named
  by its type, such as `Orders.place`. A secondary
  constructor is `Orders.constructor`. Functions of a companion object belong to
  the enclosing type, as `Orders.create`, because that is how Kotlin declares
  static functions. Unlike the outline, operations also cover the functions of
  nested types, as `Orders.Nested.run`, and function-valued properties declared
  in a type. A position is the declaration's start after its KDoc and comments.
- **Invocations**: every call expression inside an operation, parameter
  defaults included, at the start of its receiver when it has one. Calls remain unresolved because syntax alone
  cannot prove their targets: `Orders()` may construct a type or call a function.
  A secondary constructor's `this(...)` or `super(...)` delegation is not a
  call, though calls in its arguments are. Operators, infix calls such as
  `1 to 2`, property accessors, and initializer blocks are not reported.

The scanner supplies no body fingerprints for duplicate-code findings and no
HTTP facts. A parse or read failure rejects the whole observation and names the
source file, with the line of a syntax error. The worker runs with a 512 MB stack for long generated
expressions; a file nested deeper than that fails the same way. There is no successful partial scan. In a file with CRLF
line endings or a leading byte order mark, positions and lines still refer to the file on disk.

The same parser supplies [source outlines](../creating-a-plugin.md#source-outline):
top-level types and objects with their functions, and top-level functions or
function-valued properties. A type's members also include its constructors,
named `constructor`: the primary constructor when the class header declares one,
then each secondary constructor. Companion-object functions are members of the
enclosing type. Other nested types, properties, and type aliases are omitted.
Code links use bare symbol names; a type link does not mark its members.

Visibility is read from the written modifier: `private`, `protected`,
`internal`, or `public` when there is none. An `override` without a modifier
therefore reads as `public` even when it inherits `protected`.

Source listing filters the supplied candidates by `.kt` without parsing
files or starting the worker.

## Architecture ownership

The worker's single source root groups evidence for this scan. A Kotlin
package, object, file, Gradle module, or source set does not imply a C4 system
or container. Groma core owns architecture boundaries and interprets operation
evidence through the [shared scanner contract](../creating-a-plugin.md).

Architecture remains ordinary OKF Markdown with Code links. Other Markdown
readers can follow those links without the scanner. Groma interprets the source
evidence through its existing scanner and component model; Kotlin adds no new
architecture kind or metadata.

## Maintainer build

Maintainers need Bun, a JDK with `java` and `jlink`, and network access:

```sh
bun plugins/scanners/kotlin/build.ts
```

The build downloads the pinned compiler jars from Maven Central, rejects a jar
whose SHA-256 differs from the one recorded in `build.ts`, and compiles the
worker with that same compiler, so it needs no installed Kotlin compiler or
Gradle. This build-time tooling is not part of scanning. The result is
`plugins/scanners/kotlin/dist/package`; use this local package when working on
the scanner before publication. To change the parser version, change `kotlin`
and the jar checksums in `build.ts`, and the version named in
`THIRD-PARTY-NOTICES.txt` and on this page.

The existing scanner release workflow builds each supported host and combines
the runtimes. The package contains bundled JavaScript, `dist/worker.jar`, the
unmodified compiler jars under `dist/lib`, a runtime under
`dist/<host>/runtime`, and third-party notices. The runtime's licenses remain in
its `legal/` directory. There are no install scripts or scan-time downloads.

The compiler's parser links desktop classes when it loads, so the runtime
includes the `java.desktop` module. That makes each host runtime about 77 MB
(24 MB compressed), beside about 60 MB of compiler jars shared by all hosts.

The Kotlin test builds an isolated package and checks selection, declarations,
calls, positions, parse failure, and outlines. The shared fresh-checkout test
also runs the relocated package with an empty home and no language tools on
`PATH`, checks repeatability, and checks that the checkout stays unchanged.
