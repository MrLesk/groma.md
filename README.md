<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/lockup-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset=".github/assets/lockup.svg">
    <img src=".github/assets/lockup.svg" alt="groma.md" width="300">
  </picture>
</p>

<p align="center">
  <strong>Your architecture, alive.</strong><br>
  A live C4 map of your repository, stored as OKF Markdown in Git.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/groma.md"><img src="https://img.shields.io/npm/v/groma.md?color=1D9E75&label=npm" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-1D9E75" alt="MIT license"></a>
  <a href="https://groma.md"><img src="https://img.shields.io/badge/docs-groma.md-1D9E75" alt="Documentation"></a>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" type="image/avif" srcset=".github/assets/web-dark.avif">
    <source media="(prefers-color-scheme: dark)" type="image/webp" srcset=".github/assets/web-dark.webp">
    <source media="(prefers-color-scheme: dark)" type="image/gif" srcset=".github/assets/web-dark.gif">
    <source media="(prefers-color-scheme: light)" type="image/avif" srcset=".github/assets/web-light.avif">
    <source media="(prefers-color-scheme: light)" type="image/webp" srcset=".github/assets/web-light.webp">
    <source media="(prefers-color-scheme: light)" type="image/gif" srcset=".github/assets/web-light.gif">
    <img src=".github/assets/web-light.gif" alt="groma.md's browser map stepping through project setup, then opening the hierarchy and selecting Scan lifecycle" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://mrlesk.github.io/groma.md/architecture/auto/"><img src=".github/assets/explore-live-map.svg" alt="Explore the live map" width="232" height="48"></a>
</p>

groma.md scans your code into a first [C4](https://c4model.com) architecture map. You can curate it into the architecture you would explain to a new teammate, either yourself or with your coding agent. The map stays open while you work. Save a file and the map updates. Work on a [Backlog.md](https://github.com/MrLesk/Backlog.md) task and it appears pinned to the components it touches. Everything is plain Markdown in your repository, so architecture changes are reviewed in the same pull request as the code.

Want automatic architecture diffs on your PRs? **[Add them to your repository.](https://github.com/MrLesk/groma.md-action/pull/4)**

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/workflow-dark.png">
    <source media="(prefers-color-scheme: light)" srcset=".github/assets/workflow-light.png">
    <img src=".github/assets/workflow-light.png" alt="groma.md scans your repository with a deterministic scan into a first map, a starting point. You or your coding agent curate it: name, merge and connect components into your architecture, stored as C4 Markdown in Git. The map stays live as your code changes, and later scans keep your curation." width="100%">
  </picture>
</p>

> [!NOTE]
> groma.md is free, MIT-licensed, and runs locally with no account or backend. Scans run offline once the scanners are installed. They use deterministic code analysis (fixed rules) and call no AI service. The initial map is limited to what the scanners can detect.
>
> We recommend reviewing and curating the map at least once after the first scan to check its names, responsibilities, boundaries, and relationships. You can do this yourself with groma.md's commands, or ask your coding agent to help and review its changes. **You can use groma.md entirely without AI.**

## Get started

Three steps. Scan your code, then review and curate the map yourself or with your coding agent.

### 1. Install

```sh
npm i -g groma.md backlog.md
```

Backlog.md provides the tasks shown on the map; groma.md works without it. macOS requires Apple Silicon.

### 2. Scan

```sh
cd your-repo
groma web     # browser map on http://localhost:4747
```

On a new project, `groma web` walks you through project setup and scanner selection, then runs the first scan and opens the map.

### 3. Review and curate

Compare the map with your code and your knowledge of the system. Name responsibilities, combine records that belong together, and add missing descriptions and relationships. Run `groma instructions` for the human guides and use `--help` for each command. Keep the map open while you work: your changes appear on it. If you use a coding agent, you can ask it:

```text
Read the current groma.md architecture with `groma agent-instructions` and `groma view --plain`. Compare it with the source code, then annotate the architecture so it reflects the code: combine records that share a responsibility, add missing overviews and relationships, and keep Backlog.md task links current. Use groma.md's CLI for architecture changes, then summarize what you changed.
```

Setup registers groma.md in your `AGENTS.md` or `CLAUDE.md`, so your agent knows where to start. Later scans keep your curation, whether you or an agent made the changes.

## Work with your agent

Agents use the same CLI as people. `groma agent-instructions` prints an index of task-focused agent guides, and every command explains itself through `--help`. Any file resolves to the architecture that owns it, so an agent can start from the code it just changed:

```sh
groma view src/orders.ts    # the owner of this file and its relationships
```

[Agent guides](docs/agent-instructions/index.md)

## What you get

- <img src=".github/assets/features/browser-map.svg" width="20" height="20" alt=""> **A browser map you can walk.** Zoom from systems to containers to components. Select anything to read what it does and open the source behind it. [Browser guide](docs/viewers/web/index.md)
- <img src=".github/assets/features/live-updates.svg" width="20" height="20" alt=""> **Live updates.** Saving code refreshes source evidence and detected relationships; new files become new components.
- <img src=".github/assets/features/relationships.svg" width="20" height="20" alt=""> **Relationships and flows.** Describe how components interact, then chain relationships into named flows readers can step through. [Relationships and flows](docs/component-markdown.md)
- <img src=".github/assets/features/drafts.svg" width="20" height="20" alt=""> **Drafts.** Sketch systems, containers, and components before they exist. They appear dashed beside the real ones until a scan matches their code and you accept them. [Draft lifecycle](docs/product-model.md#drafts)
- <img src=".github/assets/features/work.svg" width="20" height="20" alt=""> **See work across the architecture.** Backlog.md tasks pin where people and agents are working; select one to highlight the components it touches and inspect its changes without leaving the map. [Task links](docs/agent-instructions/backlog.md)
- <img src=".github/assets/features/history.svg" width="20" height="20" alt=""> **Explore past architecture with its code.** Open an earlier revision and inspect the source from that same commit, down to functions and methods.
- <img src=".github/assets/features/publish.svg" width="20" height="20" alt=""> **Publish a static site.** `groma export ./site` captures the working tree with architecture, flows, and source. Add `--revision <commit>` for one commit or `--from <base> --revision <head>` for a comparison. Exports contain no task data. Scanning and hosting run separately. [Static publication](docs/viewers/web/index.md#static-publication)

## Plain Markdown, C4, OKF

The architecture lives in a `groma/` folder as an [Open Knowledge Format 0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md) bundle: one Markdown document per element, plus records for relationships, flows, and drafts. C4 gives the structure, OKF keeps it portable, and the documents stay readable without groma.md. [Architecture Markdown contract](docs/component-markdown.md)

## Languages

| Language or framework | Status |
| --- | --- |
| [TypeScript](docs/scanners/typescript/index.md) | ✅ Available |
| [JavaScript](docs/scanners/javascript/index.md) | ✅ Available |
| [Angular](docs/scanners/angular/index.md) | ✅ Available |
| [React](docs/scanners/react/index.md) | ✅ Available |
| [Vue](docs/scanners/vue/index.md) | ✅ Available |
| [C#/.NET](docs/scanners/dotnet-csharp/index.md) | ✅ Available |
| [Go](docs/scanners/go/index.md) | ✅ Available |
| [Java (Maven, Gradle)](docs/scanners/java/index.md) | ✅ Available |
| [Scala 3](docs/scanners/scala/index.md) | 🧪 Experimental |
| [Kotlin](docs/scanners/kotlin/index.md) | 🧪 Experimental |
| [Python](docs/scanners/python/index.md) | ✅ Available |
| [Rust](docs/scanners/rust/index.md) | ✅ Available |
| [PHP](docs/scanners/php/index.md) | ✅ Available |
| [Swift](docs/scanners/swift/index.md) | ✅ Available |
| [COBOL (IBM fixed format)](docs/scanners/cobol/index.md) | 🧪 Experimental |
| [Assembly (NASM x86-64, Linux ELF64)](docs/scanners/nasm/index.md) | 🧪 Experimental |
| Your favorite language or framework | [Submit an issue with your request](https://github.com/MrLesk/Groma.md/issues) |

More languages arrive as [scanner plugins](docs/scanners/creating-a-plugin.md); add your own with `groma scanner add`. Each scanner's page describes what it reads. See [which relationships groma.md detects](docs/relationship-inference.md#current-inference-rule).

## FAQ

> ### Why can't I just ask my agent to draw an architecture diagram?

You can, and the diagram will be right on the day it is drawn. After that it is a static picture: it falls behind with every commit, and asking again gives you a new drawing that you cannot compare with the old one.

groma.md keeps the architecture live. Your agent's curation is saved as Markdown in your repository, and the map follows the code from there: saving a file updates it, later scans keep what your agent wrote, and you can compare any two commits, or your uncommitted changes, to see how the architecture changed.

> ### Does groma.md send my code anywhere?

No. groma.md runs on your machine and needs no account. It reads your repository, writes Markdown into it, and serves the map on localhost. It calls no AI service. You can curate the map yourself; if you use a coding agent, check how that agent handles your code. groma.md's only network requests look up and download the scanner packages you install.

> ### Won't the next scan overwrite what my agent wrote?

No. Once a document exists, scans refresh only its code references: the symbols in the files it owns. Names, descriptions, groups, the files your agent combined, and the relationships it added stay as written. New files arrive as new components for your agent to place.

> ### Can I see architecture changes in pull requests?

Yes. The architecture is Markdown in the same repository, so its changes are part of the pull request. On public repositories, the groma.md GitHub Action adds change counts and a before and after map automatically for PRs from the same repository. For external fork PRs, a maintainer reviews the PR and starts the comparison with **Run workflow**. [Add it to your repository.](https://github.com/MrLesk/groma.md-action#add-pr-comparisons)

> ### What happens if I stop using groma.md?

Nothing breaks. The architecture stays in your repository as ordinary Markdown in the Open Knowledge Format: one document per element, linked to each other, readable on GitHub or in any editor. To remove groma.md, delete the `groma/` folder and the block between `<!-- groma:start -->` and `<!-- groma:end -->` in your AGENTS.md or CLAUDE.md.

> ### Which languages does it support?

TypeScript, JavaScript, Angular, React, Vue, C#/.NET, Go, Java, Scala 3, Kotlin, Python, Rust, PHP, Swift, COBOL, and NASM assembly, each through a scanner plugin; see [Languages](#languages). For another language, [write a scanner plugin](docs/scanners/creating-a-plugin.md) or [request one](https://github.com/MrLesk/Groma.md/issues).

## Experimental

groma.md is an early prototype. Review the first scan before treating it as your architecture, expect rough edges, and check exports before sharing them, since they include source code. Report problems in [Issues](https://github.com/MrLesk/Groma.md/issues).

## Documentation and contributing

- [Documentation index](docs/index.md)
- [Product model](docs/product-model.md)
- [Contributing guide](CONTRIBUTING.md)
- [groma.md manifesto](MANIFESTO.md)
- [What is a groma?](docs/what-is-a-groma.md)

## License

groma.md is free and open source under the [MIT license](LICENSE).
