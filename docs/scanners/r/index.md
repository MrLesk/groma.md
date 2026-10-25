# R scanner

The experimental `@groma/scanner-r` plugin parses R source with
[r-lib/tree-sitter-r 1.3.0](https://github.com/r-lib/tree-sitter-r/tree/v1.3.0)
and web-tree-sitter 0.25.10. Its runnable package includes the JavaScript parser
and both WebAssembly assets. It needs no R installation, package library,
project build, or network access while scanning. Project code is never run.

## Build and install locally

The scanner has not been published yet. Build its package in the groma.md
checkout, then copy that folder into the project:

```sh
bun install --ignore-scripts
bun plugins/scanners/r/build.ts /tmp/r-scanner
# Copy /tmp/r-scanner into your project's tools/r-scanner, then:
groma plugin add ./tools/r-scanner
groma scanner check
groma scan
```

The build bundles its pinned parser dependencies and copies their licenses.
Consumers install the built folder, not the scanner's source directory.

## Source evidence

The scanner reads selected UTF-8 `.R` and `.r` files and `DESCRIPTION`
metadata. Its default exclusions are `tests/`, `test/`, `revdep/`,
`renv/`, `packrat/`, and `RcppExports.R`. The existing
[include and exclude lists](../index.md#selecting-source-files) control selection.

A selected `DESCRIPTION` supplies a package source root and its `Package:`
name. A file belongs to the nearest containing package root. Other files
belong to the repository source root. These are source groupings, not C4
systems, containers, or collaborations. Core retains ownership of architecture
placement and existing curation. Ordinary Markdown readers see the resulting
Code links and names; no new OKF fields or C4 levels are added.

Each source file is inventoried, including a file with no named functions.
The scanner reports a function when a direct top-level assignment uses
`<-`, `=`, or `<<-`, has an identifier on the left and a function literal
on the right. Both `function(...)` and `\(...)` literals are supported.
Backtick-quoted names retain their source spelling without the outer backticks.

Function aliases, chained or rightward assignments, assignments inside blocks
or functions, wrapped functions, object fields, and anonymous callbacks are
not named declarations in this first scanner. S3 dispatch, S4 and R6 class
models, package loading, calls, HTTP behavior and runtime entry points are
not inferred. Every scan includes an `R_SYNTAX_ONLY` diagnostic.

An invalid file fails the complete R observation with its path and source line.
Files that are templates rather than valid R must be excluded explicitly.
For example, Shiny's `inst/app_template/` contains HTML template sections
inside files ending in `.R`. Other healthy scanners keep their existing
failure isolation. R Markdown, Quarto and Sweave documents are outside this
source-only scope.

## Source outline

The outline lists the same direct top-level named functions in source order,
using the line of each assigned name. A Code reference naming that function
marks it as an entry. Nested functions and function values wrapped in calls
are omitted under the [shared outline contract](../creating-a-plugin.md#source-outline).

Visibility describes the top-level source binding as `public`. This syntax-only
view does not verify package exports in `NAMESPACE`, so it cannot establish
which functions a package makes available through `::`. It does not read or
evaluate `NAMESPACE` or claim package export visibility.

[Executed repository validation](validation.md)
