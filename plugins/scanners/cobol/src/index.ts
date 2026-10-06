import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createScanObservation, type CodeFile, type ScanDiagnostic, type ScannerPlugin, type ScannerSettings } from '@groma/scanner'

const distribution = fileURLToPath(new URL('../dist/', import.meta.url))
const runtime = path.join(distribution, `${process.platform}-${process.arch}`, 'runtime/bin', process.platform === 'win32' ? 'java.exe' : 'java')
const classpath = ['worker.jar', 'engine.jar'].map(file => path.join(distribution, file)).join(path.delimiter)

interface Program {
  id: string; file: string; name: string; line: number; position: number; topLevel: boolean
}
interface Parsed {
  programs: Program[]
  calls: { source: string; literal?: string; line: number; position: number }[]
  diagnostics: ScanDiagnostic[]
}

function sources(files: readonly string[]): string[] {
  return files.filter(file => /\.(cbl|cob|cpy)$/i.test(file)).sort()
}

function copybookPaths(settings: ScannerSettings = {}): string[] {
  const paths = settings.copybookPaths ?? ['.']
  if (!Array.isArray(paths) || paths.some(item => typeof item !== 'string' || item.length === 0)) {
    throw new Error('cobol: copybookPaths must be an ordered list of repository-relative directories.')
  }
  return paths
}

async function execute(root: string, args: string[], input = ''): Promise<string> {
  if (!existsSync(runtime) || !existsSync(path.join(distribution, 'engine.jar')) || !existsSync(path.join(distribution, 'worker.jar'))) {
    throw new Error('COBOL_WORKER_MISSING: Install the packaged COBOL scanner, or run bun plugins/scanners/cobol/build.ts.')
  }
  const child = Bun.spawn([runtime, ...args], {
    cwd: root, stdin: new TextEncoder().encode(input), stdout: 'pipe', stderr: 'pipe',
    timeout: 120000, killSignal: 'SIGKILL',
  })
  const [output, error, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
  if (code !== 0) throw new Error(error.trim() || `cobol: worker exited ${code}; no observation was produced.`)
  return output
}

async function parse(root: string, settings: ScannerSettings, files: readonly string[], outline = false): Promise<Parsed> {
  const content = Object.fromEntries(await Promise.all(files.map(async file => [file, await readFile(path.join(root, file), 'utf8')])))
  return JSON.parse(await execute(root, ['-Xmx1024m', '-cp', classpath, 'md.groma.cobol.Main'], JSON.stringify({
    root: path.resolve(root), files: content, copybookPaths: copybookPaths(settings), outline,
  })))
}

export default {
  id: 'cobol',
  listSourceFiles: async (_root, _settings, candidates) => sources(candidates),
  async checkReadiness(root, settings) {
    copybookPaths(settings)
    await execute(root, ['-version'])
  },
  async readCodeStructure(root, references, settings = {}): Promise<CodeFile[]> {
    const present = references.filter(reference => existsSync(path.join(root, reference.file)))
    if (!present.length) return []
    const result = await parse(root, settings, sources(present.map(reference => reference.file)), true)
    return present.flatMap(reference => {
      const declarations = result.programs.filter(program => program.file === reference.file && program.topLevel).map(program => ({
        kind: 'program' as const, name: program.name, line: program.line, visibility: 'public' as const,
        entry: reference.symbols.includes(program.name),
      }))
      return declarations.length ? [{ file: reference.file, declarations }] : []
    })
  },
  async scan(root, settings, selected) {
    const files = sources(selected)
    if (!files.length) return undefined
    const result = await parse(root, settings, files)
    const topLevel = result.programs.filter(program => program.topLevel)
    return createScanObservation({
      scanner: { id: 'cobol', technology: 'cobol', engine: 'eclipse-cobol', engineVersion: '2.5.1' },
      roots: [{ id: 'cobol-source', kind: 'source-group', name: path.basename(root) }],
      files: files.map(file => ({ file, roots: ['cobol-source'], symbols: topLevel.filter(program => program.file === file)
        .map(program => ({ id: program.id, name: program.name, kind: 'program' })) })),
      operations: result.programs.map(program => ({ id: program.id, file: program.file, name: program.name,
        position: program.position })),
      invocations: result.calls.map(call => ({ source: call.source,
        targets: call.literal === undefined ? [] : topLevel.filter(program => program.name === call.literal).map(program => program.id),
        // A source declaration is a candidate, not proof of the runtime load module or link configuration.
        unresolved: true, line: call.line, position: call.position, ...(call.literal === undefined ? {} : { member: call.literal }),
      })),
      diagnostics: [...result.diagnostics, { severity: 'info', code: 'COBOL_SOURCE_SCOPE',
        message: 'IBM fixed-format source and local data COPY. Runtime loading, dynamic CALL, JCL, CICS and SQL relationships remain unresolved.' }],
    })
  },
} satisfies ScannerPlugin
