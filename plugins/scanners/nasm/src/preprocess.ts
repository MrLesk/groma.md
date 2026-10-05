import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ScannerSettings } from '@groma/scanner'

const binary = fileURLToPath(new URL(`../dist/${process.platform}-${process.arch}/nasm${process.platform === 'win32' ? '.exe' : ''}`, import.meta.url))

export interface AssemblySource { text: string; lines: string[]; offsets: number[] }
export interface Preprocessed { text: string; sources: Map<string, AssemblySource> }

export function sourceFiles(files: readonly string[]): string[] {
  return files.filter(file => /\.(asm|inc)$/i.test(file)).sort()
}

function relative(value: unknown): string {
  if (typeof value !== 'string' || !value || path.posix.isAbsolute(value) || /[:\\]/.test(value) ||
    value.split('/').includes('..')) throw new Error('nasm: source paths must stay relative to the repository.')
  return value
}

export function configuration(settings: ScannerSettings) {
  const entry = relative(settings.entry ?? 'main.asm')
  const includePaths = settings.includePaths ?? ['.']
  if (!Array.isArray(includePaths)) throw new Error('nasm: includePaths must be an array of relative directories.')
  return { entry, includePaths: includePaths.map(relative) }
}

export function checkTool(): void {
  if (!existsSync(binary)) throw new Error('NASM_WORKER_MISSING: Install the packaged scanner or run bun plugins/scanners/nasm/build.ts.')
}

function readSource(text: string, file: string): AssemblySource {
  const lines = text.split('\n')
  const offsets: number[] = []
  let offset = 0
  for (const line of lines) {
    offsets.push(offset)
    offset += line.length + 1
    // This source profile allows literal local includes, as used by the qualified game.
    if (!/^\s*%include\b/.test(line)) continue
    const include = /^\s*%include\s+["']([^"']+)["']\s*(?:;.*)?$/.exec(line.trimEnd())
    if (!include) throw new Error(`nasm: ${file}: only literal relative %include paths are supported.`)
    relative(include[1])
  }
  return { text, lines, offsets }
}

/** Only supplied sources enter the temporary tree. Missing/excluded includes fail in NASM. */
export async function preprocess(root: string, settings: ScannerSettings, selected: readonly string[]): Promise<Preprocessed> {
  checkTool()
  const { entry, includePaths } = configuration(settings)
  const files = sourceFiles(selected)
  if (!files.includes(entry)) throw new Error(`nasm: selected files do not contain entry ${entry}; configure settings.entry.`)
  const snapshot = await mkdtemp(path.join(os.tmpdir(), 'groma-nasm-source-'))
  const sources = new Map<string, AssemblySource>()
  try {
    for (const file of files) {
      relative(file)
      const source = readSource(await readFile(path.join(root, file), 'utf8'), file)
      sources.set(file, source)
      const target = path.join(snapshot, file)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, source.text)
    }
    const child = Bun.spawn([binary, '-E', '-f', 'elf64', ...includePaths.flatMap(directory => ['-I', `${directory}/`]), entry], {
      cwd: snapshot, stdout: 'pipe', stderr: 'pipe', timeout: 120000, killSignal: 'SIGKILL',
      env: { ...process.env, NASMENV: '' },
    })
    const [text, error, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
    if (code !== 0) throw new Error(`nasm: ${error.trim() || 'preprocessing failed'}`)
    return { text, sources }
  } finally { await rm(snapshot, { recursive: true, force: true }) }
}
