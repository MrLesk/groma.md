import type { ScanInvocation, ScanOperation } from '@groma/scanner'
import { nameNode, specification, type Node } from './syntax.ts'

const bodies = new Set(['subprogram_body', 'expression_function_declaration', 'null_procedure_declaration'])
const boundaries = new Set(['package_body', 'package_declaration', 'task_body', 'protected_body', 'entry_body'])

function operation(file: string, node: Node): ScanOperation | undefined {
  if (!bodies.has(node.type)) return
  const name = nameNode(specification(node) ?? node)
  if (name) return { id: `${file}:${node.startIndex}`, file, name: name.text, position: node.startIndex }
}

/** Calls remain unresolved: syntax cannot choose Ada overloads, dispatch targets or imported implementations. */
export function operationEvidence(file: string, root: Node) {
  const operations: ScanOperation[] = []
  const invocations: ScanInvocation[] = []

  function visit(node: Node, caller?: string): void {
    const declared = operation(file, node)
    if (declared) operations.push(declared)
    const owner = declared?.id ?? (boundaries.has(node.type) ? undefined : caller)
    if (node.type === 'procedure_call_statement' && owner) {
      invocations.push({ source: owner, targets: [], unresolved: true,
        member: node.childForFieldName('name')?.text,
        line: node.startPosition.row + 1, position: node.startIndex })
    }
    // Contracts/default arguments are declarations, not work performed by the declaring operation.
    if (node.type.endsWith('_specification') || node.type === 'aspect_specification') return
    for (const child of node.namedChildren) visit(child, owner)
  }

  visit(root)
  return { operations, invocations }
}
