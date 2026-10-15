import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// Maintainer command only. Package builds and consumers use the checked-in WASM.
const cli = process.argv[2] ?? 'tree-sitter'
const version = execFileSync(cli, ['--version'], { encoding: 'utf8' }).trim()
if (version !== 'tree-sitter 0.26.3') throw new Error(`Expected tree-sitter 0.26.3, received ${version}`)
const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-c-grammar-'))
try {
  await writeFile(path.join(temporary, 'tree-sitter.json'), JSON.stringify({
    grammars: [{ name: 'c', scope: 'source.c', path: '.', 'file-types': ['c', 'h'] }],
    metadata: { version: '0.24.1', license: 'MIT' },
  }))
  // Keep the CommonJS grammar separate from the package's ESM implementation.
  await writeFile(path.join(temporary, 'grammar.js'),
    `module.exports = require(${JSON.stringify(path.join(import.meta.dir, 'grammar/grammar.cjs'))})`)
  execFileSync(cli, ['generate', 'grammar.js', '--abi', '15', '--output', path.join(temporary, 'src')],
    { cwd: temporary, stdio: 'inherit' })
  execFileSync(cli, ['build', '--wasm', '--output', path.join(import.meta.dir, 'grammar/tree-sitter-c.wasm'),
    temporary], { cwd: temporary, stdio: 'inherit' })
} finally { await rm(temporary, { recursive: true, force: true }) }
