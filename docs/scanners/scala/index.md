# Scala scanner

The experimental Scala scanner parses selected Scala 3 source with Scalameta.
Its package includes the parser and a Java runtime. Scanning and source outlines
need no installed Java, Scala, sbt, project dependencies, build, or network access.

From an initialized project:

```sh
groma scanner add @groma/scanner-scala
groma scan
```

## Source selection

The scanner reads the `.scala` files selected by Groma's
[include and exclude lists](../index.md#selecting-source-files), wherever they
live in the repository. Defaults exclude `target/`, `project/`, `.bloop/`,
`.metals/`, and `src/test/`. Adjust those lists to scan test code or a custom
source layout.

It does not evaluate `build.sbt`, discover sbt modules, inspect dependencies, or
generate source. A `.scala` file is a discovery clue; it does not prove a
compiler version. Files are parsed with Scalameta 4.13.4's Scala 3 dialect.
Scala 2 syntax and newer syntax outside that parser's support are not promised.

## Evidence and outlines

The TypeScript entry point filters the selected paths and invokes the bundled
worker. The worker parses each file, reports top-level declarations, and extracts
methods, secondary constructors, named given aliases, and named function values
as operations with original source positions. Ordinary and infix call expressions
inside those bodies have call-site positions. Calls remain unresolved because
syntax alone cannot prove their runtime targets. Constructor calls, implicit
calls, macros, and build-generated code are not resolved.

The scanner supplies no body fingerprints for duplicate-code findings.
A parse or read failure rejects the whole observation and names the source file.
There is no successful partial scan.

The same parser supplies [source outlines](../creating-a-plugin.md#source-outline):
top-level types and objects, their methods and constructors, and top-level
functions or named lambdas. Packages and package objects are scopes. Nested
types, fields, type aliases, and given values are omitted from the outline.
Code links use bare symbol names; a type link does not mark its members.

Source listing filters the supplied candidates by `.scala` without parsing
files or starting any worker.

## Architecture ownership

The worker's single source root groups evidence for this scan. A Scala package,
object, file, or sbt module does not imply a C4 system or container. Groma core
owns architecture boundaries and interprets operation evidence through the
[shared scanner contract](../creating-a-plugin.md).

Architecture remains ordinary OKF Markdown with Code links. Other Markdown
readers can follow those links without the scanner. Groma interprets the source
evidence through its existing scanner and component model; Scala adds no new
architecture kind or metadata.

## Maintainer build

Maintainers need Bun, a JDK with `java` and `jlink`, and network access:

```sh
bun plugins/scanners/scala/build.ts
```

The build downloads the pinned sbt launcher and compiles the worker in a temporary
directory. It does not require an installed sbt. This build-time tooling is not
part of scanning. The result is `plugins/scanners/scala/dist/package`; use this
local package when working on the scanner before publication.

The existing scanner release workflow builds each supported host and combines
the runtimes. The package contains bundled JavaScript, `dist/worker.jar`, a
runtime under `dist/<host>/runtime`, and third-party notices. The runtime's
licenses remain in its `legal/` directory. There are no install scripts or
scan-time downloads.

The Scala test builds an isolated package and checks selection, declarations,
calls, positions, parse failure, and outlines. The shared fresh-checkout test
also runs the relocated package with an empty home and no language tools on
`PATH`, checks repeatability, and checks that the checkout stays unchanged.
