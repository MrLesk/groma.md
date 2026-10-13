import { readFile } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

const SOURCE = /\.(?:js|mjs|cjs|jsx)$/

/** One listed file with its syntax tree. */
export interface JavaScriptSource {
  /** The path Groma listed. A fact names the file by this path. */
  file: string
  /**
   * The file's syntax tree. Its `fileName` is the parser's own spelling of the path, in which a backslash is a
   * slash: that name may not exist on disk, or may be another listed file, so a fact does not name the file by it.
   */
  syntax: ts.SourceFile
}

/** The JavaScript sources among a scanner's files. */
export function javaScriptFiles(files: readonly string[]): string[] {
  return files.filter(file => SOURCE.test(file))
}

/** Each JavaScript source among the files, parsed alone, so no project configuration, dependency or build tool is needed. */
export async function javaScriptSources(root: string, files: readonly string[]): Promise<JavaScriptSource[]> {
  const sources: JavaScriptSource[] = []
  for (const file of javaScriptFiles(files)) {
    const text = await readFile(path.join(root, file), 'utf8')
    sources.push({ file, syntax: ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true) })
  }
  return sources
}
