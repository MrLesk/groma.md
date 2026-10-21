import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

// Maintainer command only. Normal package builds use the checked-in WASM file.
const cli = process.argv[2] ?? 'tree-sitter'
const version = execFileSync(cli, ['--version'], { encoding: 'utf8' }).trim()
if (version !== 'tree-sitter 0.27.1') throw new Error(`Expected tree-sitter 0.27.1, received ${version}`)
const require = createRequire(import.meta.url)
const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-cpp-grammar-'))
try {
  await mkdir(path.join(temporary, 'src'))
  await copyFile(require.resolve('tree-sitter-cpp/src/scanner.c'), path.join(temporary, 'src/scanner.c'))
  await writeFile(path.join(temporary, 'tree-sitter.json'), JSON.stringify({
    grammars: [{ name: 'cpp', scope: 'source.cpp', path: '.', 'file-types': ['cpp'] }],
    metadata: { version: '0.23.4', license: 'MIT' },
  }))
  // Tree-sitter accepts .js inputs; the wrapper keeps CommonJS grammar code outside the ESM package.
  await writeFile(path.join(temporary, 'grammar.js'),
    `module.exports = require(${JSON.stringify(path.join(import.meta.dir, 'grammar/grammar.cjs'))})`)
  execFileSync(cli, ['generate', 'grammar.js', '--abi', '15', '--output', path.join(temporary, 'src')],
    { cwd: temporary, stdio: 'inherit' })
  execFileSync(cli, ['build', '--wasm', '--output', path.join(import.meta.dir, 'grammar/tree-sitter-cpp.wasm'),
    temporary], { cwd: temporary, stdio: 'inherit' })
} finally { await rm(temporary, { recursive: true, force: true }) }
