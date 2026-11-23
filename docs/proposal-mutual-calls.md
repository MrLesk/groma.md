# Proposal for reporting files that call each other

A developer runs `groma lint` on a source checkout and sees two files that call into each other, with a source line for each direction. They can review that dependency before anyone has curated the architecture. This proposal would add mutual calls to the existing duplicate-logic findings. The measurements below come from a separate experiment on real Groma scanner output. [Current findings](architecture-findings.md)

## What came out

| Public checkout | Distinct files reported by scanners | Directed file pairs with qualifying calls | File pairs with calls both ways | Existing duplicate groups |
| --- | ---: | ---: | ---: | ---: |
| [Backlog.md at 416cdffe](https://github.com/MrLesk/Backlog.md/tree/416cdffe595f5bcd2ddf076ca4159ac483c63aaa) | 219 | 537 | **2** | 84 |
| [codex-hackathons at be27cb85](https://github.com/globodex/codex-events/tree/be27cb8531f6a02f79f7c66eac2566bb0ffcac79) | 682 | 202 | **0** | 127 |

### Backlog.md

| Files | Core calls the helper | Helper calls the core |
| --- | --- | --- |
| `src/core/backlog.ts` ↔ `src/utils/status.ts` | `requireCanonicalStatus` calls `getCanonicalStatus` when validating a status. [Call](https://github.com/MrLesk/Backlog.md/blob/416cdffe595f5bcd2ddf076ca4159ac483c63aaa/src/core/backlog.ts#L1174) | `getValidStatuses` calls `createRuntimeCore` when the caller omits the configuration reader. [Call](https://github.com/MrLesk/Backlog.md/blob/416cdffe595f5bcd2ddf076ca4159ac483c63aaa/src/utils/status.ts#L11) |
| `src/core/backlog.ts` ↔ `src/utils/task-path.ts` | `promoteDraft` calls `extractDraftIdFromFilename` to read the ID from a draft filename. [Call](https://github.com/MrLesk/Backlog.md/blob/416cdffe595f5bcd2ddf076ca4159ac483c63aaa/src/core/backlog.ts#L4252) | `getTaskPath` calls `createRuntimeCore` when the caller omits the filesystem context. [Call](https://github.com/MrLesk/Backlog.md/blob/416cdffe595f5bcd2ddf076ca4159ac483c63aaa/src/utils/task-path.ts#L91) |

Both findings raise the same ownership question. Should these utility files also be responsible for constructing the application core? The calls in opposite directions can belong to different functions and execute under different conditions. The source establishes a dependency in both directions at the file level. Runtime recursion would be a separate claim.

The trial used the project's configured TypeScript 0.2.4 and React 0.2.3 scanners and its exclusions for `/scripts/` and `/src/test/`. The React scanner reported 18 unsupported bindings. The stock lint command stopped before scanning the existing architecture because a saved component has an obsolete `groma.group` field. The 84 duplicate groups came from stock lint on a disposable, freshly initialized architecture with the same scanner configuration. The proposed rule read the source evidence directly in the original snapshot. [Project configuration](https://github.com/MrLesk/Backlog.md/blob/416cdffe595f5bcd2ddf076ca4159ac483c63aaa/groma/config.json)

### codex-hackathons

The JavaScript scanner reported three files and the TypeScript scanner reported 679. They found 202 directed file pairs with a qualifying call. None had a qualifying call in the opposite direction. The checkout contained 251 Vue files. Its manifest declares Nuxt without a direct Vue dependency, so the Vue scanner contributed no observation. TypeScript used default options because the four generated Nuxt configuration files were absent from the checkout. Those limits matter when reading the zero. [Application manifest](https://github.com/globodex/codex-events/blob/be27cb8531f6a02f79f7c66eac2566bb0ffcac79/package.json) · [TypeScript configuration](https://github.com/globodex/codex-events/blob/be27cb8531f6a02f79f7c66eac2566bb0ffcac79/tsconfig.json) · [Vue project detection](../plugins/scanners/vue/src/project.ts)

For comparison, stock lint found an exact duplicate of the function that builds the team data returned to callers. Both copies select the same team and membership fields. That is one of the 127 duplicate groups in the table. [Account event entry page](https://github.com/globodex/codex-events/blob/be27cb8531f6a02f79f7c66eac2566bb0ffcac79/server/domains/events/account-event-entry-page.ts#L103-L118) · [Participation](https://github.com/globodex/codex-events/blob/be27cb8531f6a02f79f7c66eac2566bb0ffcac79/server/domains/events/participation.ts#L113-L128)

## What the rule means

1. Core combines observations using its existing rules for overlapping scanners. A call qualifies when its caller and single target are known, the target is resolved, the call has no supplied-callback binding, and the files differ. Calls and constructor invocations share this scanner contract.
2. Core reports a file pair once when it has a qualifying call in each direction. It shows the first qualifying call by source position in each file, the operation names, and the source links. A chain through a third file is outside this first rule.
3. The finding belongs in `groma lint` and **Project review**. It can link to existing component owners when available. Groma owns the rule and its presentation. It needs no new scanner fields, language names, or AI interpretation. The same inputs produce the same findings. Each scanner's ability to resolve calls determines what the rule can see. [Shared evidence](scanners/evidence.md#vocabulary-and-introduction-order) · [Combining observations](../src/scan-evidence.ts)

The finding is supporting information about source code. In C4, two files can belong to one component. In OKF, the existing architecture Markdown and its links already describe the components. A scan can present the evidence without creating a component, adding a relationship row, or requiring a saved architecture to find the pair. [Architecture Markdown contract](component-markdown.md#code-references) · [Findings model](architecture-findings.md#okf-and-c4)

## Reproduce the experiment

Use Bun 1.4.4 and the Groma checkout on this branch with its workspace dependencies installed. The trial used Groma core at `287740c6`. Start with disposable Git checkouts at the two commits in the table. Set `groma_root`, `backlog_root`, and `events_root` to their absolute paths. The target applications need no dependency installation or build.

```sh
(cd "$backlog_root" && bun "$groma_root/src/cli.ts" plugin install)

bundles=$(mktemp -d)
(cd "$events_root" && bun "$groma_root/src/cli.ts" init codex-hackathons --directory .groma)
for scanner in javascript typescript vue; do
  bun -e 'const build = await import(process.argv[1]); await build.buildPackage(process.argv[2])' \
    "$groma_root/plugins/scanners/$scanner/build.ts" "$bundles/$scanner"
  (cd "$events_root" && bun "$groma_root/src/cli.ts" plugin add "$bundles/$scanner")
done
```

These are JavaScript 0.2.5, TypeScript 0.2.6 and Vue 0.2.8 for the events checkout. Backlog.md pins its own scanner versions. From the Groma root, run the block once per checkout with `target` set to its absolute path. It prints one witness in each direction for every pair.

```sh
bun - "$target" <<'TS'
import { loadScannerRegistry } from './src/scanner/registry.ts'
import { composeInvocations } from './src/scan-evidence.ts'

const target = process.argv[2]
const registry = await loadScannerRegistry(target)
const { observations, failures } = await registry.collectObservations(target)
if (failures.length) throw new Error(failures.map(f => f.message).join('\n'))
if (!observations.some(o => o.invocations !== undefined)) throw new Error('No call evidence')
const { claims, conflicts } = composeInvocations(observations)
const edges = new Map()
function earlier(a, b) {
  if (a.line !== b.line) return a.line < b.line
  if (a.offset !== b.offset) return a.offset < b.offset
  return a.text < b.text
}

for (const { invocation, operations } of claims) {
  if (invocation.unresolved || invocation.binding || invocation.targets.length !== 1) continue
  const caller = operations.get(invocation.source)
  const callee = operations.get(invocation.targets[0])
  if (!caller || !callee || caller.file === callee.file) continue
  const key = JSON.stringify([caller.file, callee.file])
  const site = {
    line: invocation.line, offset: invocation.position ?? 0,
    text: `${caller.file}:${invocation.line}  ${caller.name} → ${callee.name}`
  }
  const first = edges.get(key)
  if (!first || earlier(site, first)) edges.set(key, site)
}
let pairs = 0
for (const key of [...edges.keys()].sort()) {
  const [a, b] = JSON.parse(key)
  const reverse = edges.get(JSON.stringify([b, a]))
  if (a < b && reverse) {
    console.log([edges.get(key).text, reverse.text, ''].join('\n'))
    pairs++
  }
}
const files = new Set(observations.flatMap(o => o.files.map(f => f.file)))
console.log({ scanners: observations.map(o => o.scanner.id), files: files.size,
  directedPairs: edges.size, mutualPairs: pairs, conflictingClaims: conflicts.length })
TS
```
