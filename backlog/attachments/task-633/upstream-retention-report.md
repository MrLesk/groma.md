# Bun native AOT package-manager retention

Prepared for review; no upstream issue or comment has been posted.

## Reproduction

Run the sibling standalone reproducer with the experimental compiler:

```sh
/path/to/verified/bun backlog/attachments/task-633/aot-package-manager.mjs
```

It builds a one-line application, then invokes each artifact with
`BUN_BE_BUN=1 <artifact> pm --help`. There is no Groma dependency or network
request in this reproduction.

| Compile settings | Exit | Package-manager help |
| --- | ---: | --- |
| AOT, no trim | 70 | absent |
| AOT, trim allowing install | 70 | absent |
| AOT, trim allowing cli | 0 | present |

Reproduced on Linux x64 with both official PR artifacts:

- d260d7d51ba4280c836a600df2123f42986c8669, Buildkite 133944,
  revision 1.4.4-canary.1+d260d7d51, binary SHA256
  0351f11e951302725230bc85c130a4c3dac9f1e52ca2d3515e3b23317758b9ab.
- 000968de8e5a99f0d171868c7d3e714c9700e4af, Buildkite 134059,
  revision 1.4.4-canary.1+000968de8, binary SHA256
  c2c17501f6fe3d93333e55275a755de178d2ac83948ca49bcd965d65dc975115.

PR45631 merged on 2026-10-27. The five-platform product qualification remains
on the first pin; testing the newer standalone reproduction does not qualify
whole products on that compiler.

## Product requirement and current workaround

Groma runs its own executable as Bun's package manager for scanner lookup and
installation. This preserves npm configuration, private registry credentials,
proxy and certificate behavior without requiring an external Bun installation.
Retaining cli fixes installation in AOT+trim. All 22 official scanner consumers
then pass on all five native release targets after also retaining node:vm for
Python/Pyodide. Untrimmed AOT remains blocked because it has no independent
retention setting exposed by the current build options.

This report does not assume that untrimmed AOT should keep the entire CLI by
default. The required capability is explicit package-manager retention without
having to preserve unrelated command-line tools or enable full trimming.

## Source lead, not a validated patch

At commit 000968de8e5a99f0d171868c7d3e714c9700e4af,
[src/runtime/cli/mod.rs](https://github.com/oven-sh/bun/blob/000968de8e5a99f0d171868c7d3e714c9700e4af/src/runtime/cli/mod.rs)
classifies commands through `call_removable!(Tools, Abort, which)`, while the
package-manager dispatch uses `call_removable!(Install, Abort, exec_pm, log)`.
This is a source-level lead for why keeping Install alone loses the CLI entry
path. A narrow fix needs to preserve parsing/dispatch when package-manager
capability is retained and expose retention independently of full trim.

No Bun source patch has been validated. Changing one removal gate without
building and testing Bun would not establish that all parser dependencies are
retained. Upstream support or a verified compiler build is required before the
untrimmed product gate can be green. The native workflow intentionally fails
this capability check rather than publishing a partially functional artifact.

## Separate Python performance concern

AOT interprets the installed Python scanner's disk-loaded Pyodide WebAssembly.
One clean paired lint run produced identical output: JIT 1855.36ms versus AOT
44578.91ms. Keeping jit explicitly still took43.21s and increased the binary.
This is separate from package-manager retention and is not presented as the
same compiler defect. See [native qualification](../../../docs/native-aot.md)
for the functional binary sizes and limits of these fixture measurements.
