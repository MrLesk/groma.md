import type { CodeDeclaration, CodeVisibility } from '@groma/scanner'
import { identity, nameNode, specification, type Node } from './syntax.ts'

export interface Declaration {
  name: string
  line: number
  position: number
  kind: 'function' | 'type'
  scope: string
  /** Absent for a package-body subprogram whose selected specification must establish access. */
  visibility?: CodeVisibility
  profile?: string
}
export interface PackageDeclaration { name: string; body: boolean; library: boolean }
export interface SourceDeclarations { declarations: Declaration[]; packages: PackageDeclaration[] }
interface Scope { name: string; visibility: CodeVisibility; body: boolean; library: boolean }
const subprograms = new Set(['subprogram_declaration', 'generic_subprogram_declaration', 'subprogram_body', 'expression_function_declaration', 'null_procedure_declaration'])
const types = new Set(['full_type_declaration', 'private_type_declaration', 'private_extension_declaration', 'incomplete_type_declaration'])

/** A textual profile match is sufficient for identical declarations, never a substitute for type resolution. */
function profile(node: Node): string {
  const tokens: string[] = []
  function visit(current: Node): void {
    if (current.type === 'comment' || current.type === 'expression') return
    if (current.childCount === 0) {
      if (current.type !== ':=') tokens.push(current.text.toLowerCase())
    } else for (const child of current.children) visit(child)
  }
  visit(node)
  return tokens.join(' ')
}

function declaration(node: Node, scope: Scope): Declaration | undefined {
  const spec = specification(node)
  const name = nameNode(spec ?? node)
  if (!name) return
  const kind = subprograms.has(node.type) ? 'function' : 'type'
  // Task/protected types have their own execution/entry semantics, outside this scanner's first scope.
  if (kind === 'type' && node.namedChildren.some(child => /^(task|protected)_type_declaration$/.test(child.type))) return
  return { name: name.text, line: name.startPosition.row + 1, position: node.startIndex,
    kind, scope: scope.name, visibility: scope.body && kind === 'function' ? undefined : scope.visibility,
    profile: spec ? profile(spec) : undefined }
}

/** Packages act as source namespaces. Nested callable/type bodies never become top-level outlines. */
export function sourceDeclarations(root: Node): SourceDeclarations {
  const declarations: Declaration[] = []
  const packages: PackageDeclaration[] = []

  function visitPackage(node: Node, outer: Scope): void {
    const name = nameNode(node)
    if (!name) return
    const body = node.type === 'package_body'
    const qualified = outer.name ? `${outer.name}.${name.text}` : name.text
    packages.push({ name: identity(qualified), body, library: outer.library })
    let visibility: CodeVisibility = body ? 'private' : outer.visibility
    for (const child of node.children) {
      if (child.type === 'private') visibility = 'internal'
      visit(child, { name: qualified, visibility, body, library: false })
    }
  }

  function visit(node: Node, scope: Scope): void {
    if (node.type === 'package_declaration' || node.type === 'package_body') {
      visitPackage(node, scope)
      return
    }
    if (subprograms.has(node.type) || types.has(node.type)) {
      const item = declaration(node, scope)
      if (item) declarations.push(item)
      return
    }
    if (['compilation', 'compilation_unit', 'non_empty_declarative_part', 'generic_package_declaration'].includes(node.type)) {
      visitChildren(node, scope)
    }
  }

  function visitChildren(node: Node, scope: Scope): void {
    const visibility = node.children.some(child => child.type === 'private') ? 'internal' : scope.visibility
    for (const child of node.namedChildren) visit(child, { ...scope, visibility })
  }

  visit(root, { name: '', visibility: 'public', body: false, library: true })
  return { declarations, packages }
}

export interface DeclaredSource extends SourceDeclarations { file: string }

function visibility(item: Declaration, sources: readonly DeclaredSource[]): CodeVisibility | undefined {
  if (item.visibility) return item.visibility
  const packages = sources.filter(source => source.packages.some(pkg => !pkg.body && pkg.name === identity(item.scope)))
  if (packages.length !== 1) return
  const declarations = packages[0]!.declarations.filter(candidate => candidate.visibility &&
    identity(candidate.scope) === identity(item.scope) && identity(candidate.name) === identity(item.name))
  if (declarations.length === 0) return 'private'
  const matches = declarations.filter(candidate => candidate.profile === item.profile)
  if (matches.length === 1) return matches[0]!.visibility
}

export function outline(source: DeclaredSource, symbols: readonly string[], context: readonly DeclaredSource[]): CodeDeclaration[] {
  const entries = new Set(symbols.map(identity))
  return source.declarations.flatMap(item => {
    const access = visibility(item, context)
    if (!access) return []
    const symbol = { name: item.name, line: item.line, visibility: access, entry: entries.has(identity(item.name)) }
    return [item.kind === 'type' ? { ...symbol, kind: 'type', members: [] } : { ...symbol, kind: 'function' }]
  })
}

/** Associate exactly one library specification with exactly one body by declared Ada unit identity. */
export function packageSourceUnits(sources: readonly DeclaredSource[]) {
  const names = new Set(sources.flatMap(source => source.packages.filter(pkg => pkg.library).map(pkg => pkg.name)))
  return [...names].sort().flatMap(name => {
    const specs = sources.filter(source => source.packages.some(pkg => pkg.library && pkg.name === name && !pkg.body))
    const bodies = sources.filter(source => source.packages.some(pkg => pkg.library && pkg.name === name && pkg.body))
    if (specs.length !== 1 || bodies.length !== 1 || specs[0]!.file === bodies[0]!.file) return []
    return [{ primary: specs[0]!.file, files: [specs[0]!.file, bodies[0]!.file] }]
  })
}
