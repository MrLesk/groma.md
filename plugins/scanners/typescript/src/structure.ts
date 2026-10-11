import path from 'node:path'

import { API } from 'typescript/unstable/async'
import { SyntaxKind } from 'typescript/unstable/ast'

import type { CodeFile, SourceReference } from '@groma/scanner'
import { outlineSource } from '../../typescript-outline.ts'

/**
 * Outline each referenced file under the shared TypeScript-family rules. The program parses only those files: an outline
 * needs no tsconfig, library or import, so no project is chosen for a file outside every configured one.
 */
export async function readCodeStructure(
  repositoryRoot: string,
  references: readonly SourceReference[],
): Promise<CodeFile[]> {
  if (references.length === 0) return []
  const filenames = references.map(reference => path.join(repositoryRoot, reference.file))
  const api = new API({ cwd: repositoryRoot })
  try {
    const program = await api.createProgram(filenames, { noLib: true, types: [], noResolve: true })
    const files: CodeFile[] = []
    for (const [index, filename] of filenames.entries()) {
      const source = await program.getSourceFile(filename)
      if (source === undefined) throw new Error(`TypeScript source not found: ${references[index]?.file}`)
      const reference = references[index]!
      const declarations = outlineSource({ SyntaxKind }, source, { symbols: reference.symbols })
      if (declarations.length > 0) files.push({ file: reference.file, declarations })
    }
    return files
  } finally {
    await api.close()
  }
}
