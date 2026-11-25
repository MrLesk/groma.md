import path from 'node:path'
import { createScanObservation, type ScanDiagnostic, type ScannerPlugin } from '@groma/scanner'
import ts from 'typescript'
import { javaScriptEvidence, type FileEvidence } from './evidence.ts'
import { javaScriptHttpFacts, type HttpFacts } from './http.ts'
import { readJavaScriptOutline } from './outline.ts'
import { javaScriptFiles, javaScriptSources, type JavaScriptSource } from './sources.ts'
import { withJavaScriptEntries } from '../../entry-points/javascript.ts'
import { javaScriptEntries } from './entries.ts'

/** Strict-mode errors on octal literals and escapes, such as `0755` or `'\033'`, which scripts outside strict mode accept. */
const SLOPPY_MODE_ONLY = new Set([1121, 1487, 1488, 1489])

/**
 * A warning at the first parse error of a file; undefined when the file parses. The public API reports parse errors
 * only through a program, together with checks that reject TypeScript-only syntax the parser still reads, such as a
 * Flow type annotation, so the parse errors are read from the pinned compiler's source file.
 */
function parseWarning({ file, syntax }: JavaScriptSource): ScanDiagnostic | undefined {
  const { parseDiagnostics } = syntax as ts.SourceFile & { parseDiagnostics: readonly ts.DiagnosticWithLocation[] }
  const first = parseDiagnostics.find(diagnostic => !SLOPPY_MODE_ONLY.has(diagnostic.code))
  if (first === undefined) return undefined
  return {
    severity: 'warning',
    code: 'JAVASCRIPT_SOURCE_INVALID',
    file,
    line: syntax.getLineAndCharacterOfPosition(first.start).line + 1,
    message: `The file does not parse, so it contributes no evidence: ${ts.flattenDiagnosticMessageText(first.messageText, ' ')}`,
  }
}

/** A warning for a file that parses but whose names the compiler cannot resolve within the call stack. */
function tooDeepWarning({ file }: JavaScriptSource): ScanDiagnostic {
  return {
    severity: 'warning',
    code: 'JAVASCRIPT_SOURCE_TOO_DEEP',
    file,
    message: "The compiler exhausted the call stack resolving the file's names, as it can on a large generated bundle, so the file contributes no evidence.",
  }
}

/** What one file contributes to the observation. */
interface ScannedSource {
  source: JavaScriptSource
  evidence: FileEvidence
  facts: HttpFacts
}

/** What one file contributes, or the warning that says why it contributes nothing. */
async function scanSource(source: JavaScriptSource): Promise<ScannedSource | ScanDiagnostic> {
  const invalid = parseWarning(source)
  if (invalid !== undefined) return invalid
  const evidence = javaScriptEvidence(source.file, source.syntax)
  // The HTTP facts name operations, so they are read after the evidence that records them.
  const facts = await javaScriptHttpFacts(source, evidence)
  // With its operations but without its HTTP facts a file would look read, so a file too deep to read contributes nothing.
  return facts === 'too-deep' ? tooDeepWarning(source) : { source, evidence, facts }
}

export default {
  id: 'javascript',
  listSourceFiles: async (_root, _settings, candidates) => javaScriptFiles(candidates),
  async checkReadiness(_root, _settings, files) {
    if (!javaScriptFiles(files).length) {
      throw new Error('javascript: No JavaScript source files were found in the Git repository.')
    }
  },
  async scan(root, _settings, files) {
    const sources = await javaScriptSources(root, files)
    if (!sources.length) return undefined
    const scanned: ScannedSource[] = []
    const warnings: ScanDiagnostic[] = []
    // A file with a warning keeps its place in the inventory but contributes no evidence.
    for (const result of await Promise.all(sources.map(scanSource))) {
      if ('severity' in result) warnings.push(result)
      else scanned.push(result)
    }
    const symbols = new Map(scanned.map(({ source, evidence }) => [source.file, evidence.symbols]))
    return withJavaScriptEntries(root, createScanObservation({
      scanner: { id: 'javascript', technology: 'javascript', engine: 'typescript-sdk', engineVersion: ts.version },
      roots: [{ id: 'javascript-source', kind: 'source-group', name: path.basename(root) }],
      files: sources.map(({ file }) => ({ file, symbols: symbols.get(file) ?? [], roots: ['javascript-source'] })),
      operations: scanned.flatMap(({ evidence }) => evidence.operations),
      invocations: scanned.flatMap(({ evidence }) => evidence.invocations),
      httpEndpoints: scanned.flatMap(({ facts }) => facts.httpEndpoints),
      httpRequests: scanned.flatMap(({ facts }) => facts.httpRequests),
      diagnostics: [{ severity: 'info', code: 'JAVASCRIPT_SOURCE_SCOPE',
        message: 'Source syntax only. Module loading, dynamic dispatch, framework wiring and external symbols remain unresolved.' },
      ...warnings],
    }), await javaScriptEntries(root, scanned.map(({ source }) => source)), files)
  },
  // Every file this scanner owns is a JavaScript source, so no reference is filtered out here.
  readCodeStructure: readJavaScriptOutline,
} satisfies ScannerPlugin
