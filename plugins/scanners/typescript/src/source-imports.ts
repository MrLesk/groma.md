import { isStringLiteral, type SourceFile, type Node } from 'typescript/ast'
import type { Checker } from 'typescript/async'

/**
 * The selected files `source` imports through the `specifiers` it uses. `selectedFiles` names each selected file of
 * the program by the compiler's path for it. Anything else an import reaches, a library or an unselected file, is
 * left out without loading it.
 */
export async function resolvedImports(
  source: SourceFile, specifiers: string[], checker: Checker, selectedFiles: ReadonlyMap<SourceFile['path'], string>,
): Promise<string[]> {
  const used = new Set(specifiers)
  const nodes: Node[] = []
  function visit(node: Node): void {
    if (isStringLiteral(node) && used.has(node.text)) nodes.push(node)
    node.forEachChild(visit)
  }
  visit(source)
  const symbols = await checker.getSymbolAtLocation(nodes)
  const imports = new Set<string>()
  // The handle already names its file. Resolving it would load the whole source from the compiler.
  for (const declaration of symbols.flatMap(symbol => symbol?.declarations ?? [])) {
    const file = selectedFiles.get(declaration.path)
    // A module augmentation can have a declaration in the importing file itself.
    if (file !== undefined && declaration.path !== source.path) imports.add(file)
  }
  return [...imports].sort()
}
