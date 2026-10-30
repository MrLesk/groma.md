import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createScanObservation, type CodeFile, type ScannerPlugin } from '@groma/scanner'
import { launchEvidence, rubyEntries } from './entries.ts'
import { rubyRequests } from './clients.ts'
import { embeddedRuby } from './erb.ts'
import { parseRuby, rubyLanguage } from './parser.ts'
import { projectDeclaration, rubyProjects, type ProjectDeclaration } from './projects.ts'
import { railsRoutes, resolveRailsRoutes, routeModule } from './routes.ts'
import { analyzeRuby } from './source.ts'

const isRubyExtension = (file: string) => file.endsWith('.rb') || file.endsWith('.ru') || file.endsWith('.erb')
const isCommandPath = (file: string) => /(^|\/)(bin|exe)\/[^/]+$/.test(file)

async function sourceFiles(root: string, candidates: readonly string[]): Promise<string[]> {
  const files = []
  for (const file of candidates) {
    if (isRubyExtension(file)) files.push(file)
    else if (isCommandPath(file) && /^#![^\n]*\bruby\b/.test(await readFile(path.join(root, file), 'utf8'))) files.push(file)
  }
  return [...new Set(files)].sort()
}

async function readSource(root: string, file: string, entries: readonly string[] = []) {
  const template = file.endsWith('.erb')
  const text = await readFile(path.join(root, file), 'utf8')
  return parseRuby(file, template ? embeddedRuby(file, text) : text, node => {
    const source = analyzeRuby(node, file, entries)
    if (template) source.operations = source.operations.map(({ tokens: _tokens, startLine: _start, endLine: _end, ...operation }) => operation)
    return { ...source, launch: launchEvidence(template ? undefined : node), requests: rubyRequests(node, source.operations),
      routes: /(^|\/)config\/routes\.rb$/.test(file) ? railsRoutes(node) : [] }
  })
}

export default {
  id: 'ruby',
  listSourceFiles: async (root, _settings, candidates) => sourceFiles(root, candidates),
  async checkReadiness(root, _settings, files) {
    if (!(await sourceFiles(root, files)).length) throw new Error('ruby: No selected Ruby source files were found.')
    await rubyLanguage()
  },
  async scan(root, _settings, selected) {
    const sources = await sourceFiles(root, selected)
    if (!sources.length) return undefined
    const declarations: ProjectDeclaration[] = []
    for (const file of [...selected].sort()) {
      if (path.posix.basename(file) !== 'Gemfile' && !file.endsWith('.gemspec')) continue
      declarations.push(await parseRuby(file, await readFile(path.join(root, file), 'utf8'), node => projectDeclaration(node, file)))
    }
    const parsed: Awaited<ReturnType<typeof readSource>>[] = []
    for (const file of sources) parsed.push(await readSource(root, file))
    const projects = rubyProjects(root, declarations, sources)
    const endpoints = parsed.flatMap(source => resolveRailsRoutes(source.file, source.routes, parsed))
    const modules = parsed.filter(source => endpoints.some(endpoint => endpoint.operation === routeModule(source.file).id))
      .map(source => routeModule(source.file))
    return createScanObservation({
      scanner: { id: 'ruby', technology: 'ruby/rails', engine: 'tree-sitter-ruby', engineVersion: '0.23.1' },
      roots: projects.roots,
      files: parsed.map(({ file, symbols }) => ({ file, roots: [projects.memberships.get(file)!], symbols })),
      entryPoints: rubyEntries(parsed, declarations, projects.memberships),
      operations: [...parsed.flatMap(source => source.operations), ...modules],
      invocations: parsed.flatMap(source => source.invocations),
      httpEndpoints: endpoints,
      httpRequests: parsed.flatMap(source => source.requests),
      diagnostics: [{ severity: 'info', code: 'RUBY_SOURCE_SCOPE',
        message: 'Ruby syntax evidence only; dynamic dispatch and local helper arguments remain unresolved. Project and launch declarations, compared method bodies and supported HTTP APIs are read without executing the application. Unreadable Rails routes remain blockers; custom inflections, arbitrary metaprogramming, custom loading configuration and external implementations are not evaluated.' }],
    })
  },
  async readCodeStructure(root, references): Promise<CodeFile[]> {
    const files = []
    const selected = new Set(await sourceFiles(root, references.map(reference => reference.file)))
    for (const reference of references) {
      if (!selected.has(reference.file)) continue
      const { declarations } = await readSource(root, reference.file, reference.symbols)
      if (declarations.length) files.push({ file: reference.file, declarations })
    }
    return files
  },
} satisfies ScannerPlugin
