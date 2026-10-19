import path from 'node:path'
import ts from 'typescript'
import { classicChecker } from '../../http-checker.ts'
import { sourceBuildEntries, type EntrySources } from '../../entry-points/source.ts'
import { fileChecker } from './http.ts'
import type { JavaScriptSource } from './sources.ts'

/** Literal local module paths in authored JavaScript; external packages remain separate units. */
export async function javaScriptEntries(root: string, sources: JavaScriptSource[]): Promise<EntrySources> {
  const files = new Set(sources.map(source => source.file))
  const imports = new Map(sources.map(({ file, syntax }) => {
    const targets = ts.preProcessFile(syntax.text, true, true).importedFiles.flatMap(imported => {
      if (!imported.fileName.startsWith('.')) return []
      const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), imported.fileName))
      const candidates = [base, ...['.js', '.mjs', '.cjs', '.jsx'].flatMap(extension => [base + extension, `${base}/index${extension}`])]
      return candidates.find(candidate => files.has(candidate)) ?? []
    })
    return [file, targets] as const
  }))
  // The reader is handed one file at a time, so that file declares every entry it finds.
  const entries = (await Promise.all(sources.map(async ({ file, syntax }) =>
    (await sourceBuildEntries(root, ts, classicChecker(ts, fileChecker(syntax)), [syntax]))
      .map(entry => ({ ...entry, declaration: file }))))).flat()
  return { imports, entries }
}
