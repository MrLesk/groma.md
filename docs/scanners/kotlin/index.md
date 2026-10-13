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

The lists also select `pom.xml`, `build.gradle` and `build.gradle.kts`. The
scanner never opens them: the path of such a build declaration only marks where
a build unit lives, for [execution entries](#execution-entries).

It does not evaluate Gradle or Maven builds, discover source sets,
inspect dependencies, or read generated source. Kotlin scripts (`.kts`) are not
read. A `.kt` file is a discovery clue; it does not prove a compiler version.
Files are parsed with the parser of `kotlin-compiler-embeddable` 2.4.21. Syntax
newer than that parser supports is not promised.

## Evidence and outlines

The TypeScript entry point (`src/index.ts`) hands the selected paths to
`src/adapter.ts`, which starts the bundled worker (`worker/md/groma/scanner`). Running
a worker on the bundled Java runtime and turning its outline into Code entries
is shared with the Scala scanner in `plugins/scanners/jvm-worker.ts`. The
worker parses each file without analyzing it and reports:

- **Symbols**: top-level classes, interfaces, objects, enum classes and
  functions. An extension function is a function under its own name. A top-level
  `val` initialised directly with a lambda or an anonymous function is a
  function too; a `var` is not, because it can be reassigned.
- **Operations**: functions with a body, secondary constructors, and such
  function-valued properties, with original source positions. A member is named
  by its type, such as `Orders.place`. A secondary
  constructor is `Orders.constructor`. Functions of a companion object belong to
  the enclosing type, as `Orders.create`, matching the shared outline convention. Unlike the outline, operations also cover the functions of
  nested types, as `Orders.Nested.run`, and function-valued properties declared
  in a type. A position is the declaration's start after its KDoc and comments.
- **Invocations**: call expressions belonging to the operation, parameter
  defaults included, at the start of its receiver when it has one. Bodies of
  nested functions, lambdas and local-class methods are not attributed to the
  enclosing operation. A named function value keeps its own direct calls;
  anonymous-object initialization still runs at the enclosing expression.
  Calls remain unresolved because syntax alone
  cannot prove their targets: `Orders()` may construct a type or call a function.
  A secondary constructor's `this(...)` or `super(...)` delegation is not a
  call, though calls in its arguments are. Operators, infix calls such as
  `1 to 2`, and property accessors are not reported. Initializer blocks do not
  become separate operations.

The scanner supplies no body fingerprints for duplicate-code findings. A parse or read failure rejects the whole observation and names the
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

Explicit visibility is preserved. Without a modifier, constructors are
`protected` in sealed classes and `private` in enums; other declarations default
to `public`, except overrides that inherit their access.

`Visibility.kt` finds inherited access in the requested files and the selected
source context supplied by Groma. It follows enclosing types, same-package
names, explicit imports (including aliases) and qualified type names. It does
not resolve wildcard imports or type aliases. Overloads are compared by name,
parameter count and presence of an extension receiver; all plausible declarations
must agree on access. If a base is missing, duplicated across source sets, or
ambiguous, that override member is omitted from the outline. Explicitly visible
members and the containing type remain. File inventory, symbols and operations
are unchanged. This keeps unknown access from being reported as public without
requiring project dependencies. See Kotlin's [visibility rules](https://kotlinlang.org/docs/visibility-modifiers.html).

Source listing filters the supplied candidates by `.kt` without parsing
files or starting the worker.

## Execution entries

`Entries.kt` reports the [execution entries](../evidence.md#execution-entries-and-container-placement)
from which core places a C4 container. A file is an entry when it declares a
top-level `fun main` with a body, no receiver, and either no parameter, one
`Array<String>` parameter or one `vararg String` parameter. This is the
function the JVM starts, such as the `main` that calls `runApplication` in a
Spring Boot application. The entry is named after its file, `Application` for
`Application.kt`, and the file is its own declaration.

The entry's files are the selected `.kt` files of its build unit. A unit is a
directory that holds a `pom.xml`, `build.gradle` or `build.gradle.kts`, and a
file belongs to the nearest such directory above it. A module nested in another
unit therefore keeps its own files, and a `main` in the parent does not claim
them.

Not reported:

- a `main` under no build declaration, because nothing bounds the files that
  run with it;
- a `main` declared in an object or companion object, including `@JvmStatic`;
- a launch a build configures, such as a main class named only in a plugin
  setting.

Only the paths of build declarations are used. Source directories, modules,
packaging and dependencies they declare are not read, so a POM-only aggregator
is a unit like any other and a Gradle subproject without its own build script
belongs to the unit above it. Files of another language in the same unit come
from that language's scanner. Spring Modulith modules are packages inside one
application, not separate units: they stay in the application's container, and
grouping them is authored curation.

## HTTP endpoints

`Endpoints.kt` reports the [HTTP endpoints](../evidence.md#http-endpoints-and-requests)
that core joins with the requests of other scanners into derived
relationships. It reports no requests.

Endpoints come from Spring MVC and WebFlux annotated controllers: a class
annotated `@RestController` or `@Controller`, for each function with a body
annotated `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`,
`@PatchMapping` or `@RequestMapping`. The endpoint names that function's
operation. Its path is the class's own `@RequestMapping` path followed by the
function's. A mapping with several paths or methods reports one endpoint for
each combination. `@RequestMapping` takes its methods from `method =`; without
one it serves every method. A class-level `method` joins each function's own,
as Spring serves both.

The parser resolves no names, so annotations are matched by their simple name
and an endpoint is reported only where the source text states it:

- A path is a string without interpolation, passed positionally or as `value =`
  or `path =`, alone or inside `[...]` or `arrayOf(...)`.
- A method is `RequestMethod.GET` or another `RequestMethod` constant written
  with that qualifier.

A mapping with any other path or method, such as a constant, a string template
or an imported `GET`, reports no endpoint for its function. An unreadable
class-level mapping reports none for the whole class. This differs from the
Java scanner, which resolves constants and reports a blocker for a route it
cannot read; a request to such a Kotlin route stays unmatched or may match
another readable route.

Also not reported: a mapping on an interface, which may be a declarative
client; a class-level mapping or a function mapping inherited from a supertype;
a function without a body; functional WebFlux routes, Ktor routes and JAX-RS
resources; filters, interceptors and security matchers. A mapping's `params`,
`headers`, `consumes` and `produces` conditions are not part of the fact.

The [producer checklist](../evidence.md#producer-checklist) for Kotlin:

1. **Which prefixes belong in the path.** The `@RequestMapping` paths on the
   controller class itself. `@RequestMapping("/api")` with
   `@GetMapping("/talks")` reports `/api/talks`.
2. **Whether the construct is an endpoint.** Only a mapped function of a
   controller class is. An interface never serves.
3. **Dynamic or unknown.** The scanner reports no requests.
4. **The local helper.** The scanner reports no requests.
5. **The base.** The scanner reports no requests.
6. **Which operation a file-location route names.** Spring declares no routes
   by file location.
7. **Which segments are constrained.** `{id}` and `*` are parameters.
   `{id:\d+}` and a segment mixing text with a placeholder or wildcard, such
   as `v{version}` or `*.json`, are constrained parameters. `{*path}`, `**`, a
   `${...}` configuration placeholder and a segment outside URL path
   characters end the route with a constrained optional catch-all.
8. **Registration order.** Spring prefers the most specific route, so
   endpoints carry no `order`.

## Architecture ownership

The worker's single source root groups evidence for this scan. A Kotlin
package, object, file, Gradle module, or source set does not imply a C4 system
or container; only an execution entry lets core place one. Groma core owns architecture boundaries and interprets operation
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

`build.ts` owns the worker compilation; `plugins/scanners/jvm-package.ts`
assembles the package around it, as it does for the Scala scanner.

The existing scanner release workflow builds each supported host and combines
the runtimes. The package contains bundled JavaScript, `dist/worker.jar`, the
unmodified compiler jars under `dist/lib`, a runtime under
`dist/<host>/runtime`, and third-party notices. The runtime's licenses remain in
its `legal/` directory. There are no install scripts or scan-time downloads.

The compiler's parser links desktop classes when it loads, so the runtime
includes the `java.desktop` module. That makes each host runtime about 77 MB
(24 MB compressed), beside about 60 MB of compiler jars shared by all hosts.

The Kotlin test builds an isolated package and checks selection, declarations,
calls, positions, parse failure, outlines, execution entries and HTTP endpoints. The shared fresh-checkout test
also runs the relocated package with an empty home and no language tools on
`PATH`, checks repeatability, and checks that the checkout stays unchanged.

Real-project qualification is recorded in [Kotlin scanner validation](validation.md).
