# Bundled Mojo grammar

`tree-sitter-mojo.wasm` is built from the MIT-licensed
[lsh/tree-sitter-mojo](https://github.com/lsh/tree-sitter-mojo/tree/e5905c480b9ebbeb4195032805781a5e535547f7)
revision `e5905c480b9ebbeb4195032805781a5e535547f7`, with `grammar.patch`.
Its SHA-256 is `a3f4858737ed6759300df5b9fb45c301c8fa8ccad2f913f02cf984884f8f723e`.
The package build copies this asset; it never needs a grammar compiler or a download.

The patch accepts three forms found in current source: escaped imported names
in NuMojo, and `where ... else` diagnostics and `def from` methods in the official
Mojo standard library. It preserves the existing tree fields used by the scanner.
No query files are bundled. Copyright and MIT terms are in
[THIRD-PARTY-NOTICES.txt](../THIRD-PARTY-NOTICES.txt).

## Rebuild after an intentional parser update

Use Tree-sitter CLI **0.27.1**, WASI SDK **34.0**, and Binaryen **133**. Only parser
maintainers need these tools. In a checkout of the exact upstream revision:

```sh
export TREE_SITTER_WASI_SDK_PATH=/path/to/wasi-sdk-34
export TREE_SITTER_BINARYEN_PATH=/path/to/binaryen-version_133
git apply /absolute/path/to/groma/plugins/scanners/mojo/grammar/grammar.patch
tree-sitter generate
tree-sitter build --wasm
shasum -a 256 tree-sitter-mojo.wasm
```

Copy the result here, update the revision/checksum and third-party notice, then
run `bun test test-bun/mojo-scanner.test.ts` from Groma. Recheck the complete
current-source selections recorded in TASK-598. A parser update also requires
checking the node fields in `src/source.ts`; accepting syntax alone does not
prove correct declarations or call ownership.

Keep the patch limited to reproduced syntax. When updating upstream, check
whether each correction is already present and remove the matching patch hunk.
A source file with a parser error still fails the scan; there is no recovery
that silently drops declarations.
