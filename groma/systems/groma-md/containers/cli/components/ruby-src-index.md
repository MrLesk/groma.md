---
type: C4 Component
title: Ruby source scanner
status: stable
groma:
  id: ruby-src-index
  parent: cli
  code:
    - scanner: typescript
      file: plugins/scanners/ruby/src/index.ts
    - scanner: typescript
      file: plugins/scanners/ruby/src/clients.ts
      symbol: rubyRequests
    - scanner: typescript
      file: plugins/scanners/ruby/src/entries.ts
    - scanner: typescript
      file: plugins/scanners/ruby/src/http-values.ts
    - scanner: typescript
      file: plugins/scanners/ruby/src/parser.ts
    - scanner: typescript
      file: plugins/scanners/ruby/src/projects.ts
    - scanner: typescript
      file: plugins/scanners/ruby/src/routes.ts
    - scanner: typescript
      file: plugins/scanners/ruby/src/source.ts
    - scanner: typescript
      file: plugins/scanners/ruby/src/syntax.ts
    - scanner: typescript
      file: plugins/scanners/ruby/src/tokens.ts
      symbol: comparedMethod
    - scanner: typescript
      file: plugins/scanners/ruby/src/runtime.ts
      symbol: railsRuntime
  group: Language scanners
  technology: TypeScript, tree-sitter-ruby, WebAssembly
description: Supplies Ruby declarations, Rails handlers and HTTP evidence without running project code.
---

The Ruby plugin translates the selected source files into the shared scanner observation. Its package manifest declares inputs and default exclusions. The index coordinates project membership, source parsing, execution entries, Rails handlers and outgoing HTTP facts; the bundled parser owns syntax trees and releases them after extraction. Code outlines reuse the same declaration analysis.

Project declarations and launch facts remain source evidence. Core owns architecture identity, component ownership, container placement, relationships and duplicate findings. Ruby dynamic dispatch stays unresolved; unsupported routes retain blockers. Scanning does not run Ruby, install application dependencies or fetch tools.
