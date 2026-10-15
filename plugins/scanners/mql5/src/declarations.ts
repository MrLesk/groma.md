import type { CodeDeclaration, CodeSymbol, CodeVisibility, ScanDiagnostic, ScanSymbol } from '@groma/scanner'
import { children, field, typeKinds, touches, type Source, type Syntax } from './syntax.ts'
import type { ScopeChange } from './preprocessing.ts'

export interface Callable {
  node: Syntax
  declarator: Syntax
  name: Syntax
  owner?: string
  visibility?: CodeVisibility
  body?: Syntax
}
interface TypeDeclaration { name: Syntax; members: Callable[] }
export interface Declarations { source: Source; types: TypeDeclaration[]; functions: Callable[]; methods: Callable[]; symbols: ScanSymbol[]; diagnostics: ScanDiagnostic[] }

/** Declarator wrappers are syntax, not return types or nested parameter declarations. */
function functionDeclarator(node: Syntax | undefined): Syntax | undefined {
  if (!node) return undefined
  if (node.type === 'function_declarator') return node
  return functionDeclarator(field(node, 'declarator'))
}

function callable(node: Syntax, owner?: string, visibility?: CodeVisibility): Callable | undefined {
  if (!['function_definition', 'declaration', 'field_declaration'].includes(node.type)) return undefined
  const declarator = functionDeclarator(field(node, 'declarator'))
  const declaredName = declarator && field(declarator, 'declarator')
  if (!declarator || !declaredName) return undefined
  if (declaredName.type === 'qualified_identifier') {
    const name = field(declaredName, 'name')
    if (!name) return undefined
    return { node, declarator, name, owner: field(declaredName, 'scope')?.text, body: field(node, 'body') }
  }
  if (!['identifier', 'field_identifier', 'destructor_name', 'operator_name'].includes(declaredName.type)) return undefined
  return { node, declarator, name: declaredName, owner, visibility, body: field(node, 'body') }
}

function includeGuard(node: Syntax): boolean {
  if (node.type !== 'preproc_ifdef' || !node.text.startsWith('#ifndef') || field(node, 'alternative')) return false
  const define = children(node).find(child => child.type !== 'identifier' && child.type !== 'comment')
  return define?.type === 'preproc_def' && field(define, 'name')?.text === field(node, 'name')?.text
}

/** Forward type declarations may precede an include guard. Other conditions stay unevaluated. */
export function topLevel(source: Source): Syntax[] {
  const nodes = children(source.tree.rootNode).filter(node => node.type !== 'comment')
  const guard = nodes.at(-1)
  const preceding = nodes.slice(0, -1)
  const forwardOnly = preceding.every(node => typeKinds.has(node.type) && !field(node, 'body'))
  return guard && forwardOnly && includeGuard(guard) ? [...preceding, ...children(guard)] : nodes
}

function access(node: Syntax): CodeVisibility {
  return node.text === 'protected' ? 'protected' : node.text === 'private' ? 'private' : 'public'
}

function containsAccess(node: Syntax, source: Source): boolean {
  if (node.type === 'function_definition' || typeKinds.has(node.type)) return false
  if (node.type === 'access_specifier') return true
  if (node.type === ';' && touches(source, node.startIndex, node.endIndex)) return true
  return node.children.some(child => child !== null && containsAccess(child, source))
}

/** A macro in a declaration header cannot supply its name, type or signature. */
function opaqueHeader(node: Syntax, source: Source): boolean {
  return touches(source, node.startIndex, field(node, 'body')?.startIndex ?? node.endIndex)
}

/** Selected macros can replace a name even when its unexpanded spelling parses normally. */
function literalName(name: Syntax, file: Declarations): boolean {
  if (!file.source.macros.has(name.text)) return true
  file.diagnostics.push({ severity: 'info', code: 'MQL5_OPAQUE_MACRO', file: file.source.file,
    line: name.startPosition.row + 1, message: `${name.text}: a selected macro can replace this declaration name. Its declaration and body evidence are omitted.` })
  return false
}

/** A method-local escape must cross every written body scope before it can change the type owner. */
function memberBoundary(node: Syntax, source: Source, depth: number): ScopeChange | undefined {
  const enclosing = depth + (['compound_statement', 'field_declaration_list'].includes(node.type) ? 1 : 0)
  if (node.childCount === 0) {
    return source.uncertainCallers.find(use => node.startIndex <= use.start && use.start < node.endIndex && use.escapeDepth > enclosing)
  }
  return node.children.filter((child): child is Syntax => child !== null)
    .map(child => memberBoundary(child, source, enclosing)).find(Boolean)
}

function typeMembers(node: Syntax, name: string, file: Declarations): Callable[] {
  const result: Callable[] = []
  let visibility: CodeVisibility | undefined = node.type === 'class_specifier' ? 'private' : 'public'
  const body = field(node, 'body')
  const source = file.source
  const boundary = body && memberBoundary(body, source, -1)
  // An opaque member becomes an unnamed semicolon; namedChildren would lose its access uncertainty.
  const end = boundary?.start ?? Infinity
  const members = body?.children.filter((child): child is Syntax => child !== null && child.startIndex < end) ?? []
  for (const child of members) {
    if (child.type === 'access_specifier') { visibility = access(child); continue }
    if (containsAccess(child, source)) visibility = undefined
    if (opaqueHeader(child, source)) continue
    const member = callable(child, name, visibility)
    if (member && literalName(member.name, file)) result.push(member)
  }
  if (boundary) file.diagnostics.push({ severity: 'info', code: 'MQL5_UNCERTAIN_OWNER', file: source.file, line: boundary.line,
    message: `${boundary.name}: selected macro tokens may change the enclosing type. Later member declarations, operations and calls are omitted; a written access label cannot prove their owner.` })
  return result
}

export function id(file: string, node: Syntax): string { return `${file}:${node.startIndex}` }

function sourceSymbol(file: string, node: Syntax, name: string, kind: string): ScanSymbol {
  return { id: id(file, node), name, kind }
}

function recordType(node: Syntax, file: Declarations): void {
  const name = field(node, 'name')
  if (!name || !literalName(name, file)) return
  const members = typeMembers(node, name.text, file)
  file.types.push({ name, members })
  file.methods.push(...members)
  file.symbols.push(sourceSymbol(file.source.file, node, name.text, node.type))
}

/** Source declarations only. Macros and configuration branches are not evaluated. */
export function declarations(source: Source): Declarations {
  const result: Declarations = { source, types: [], functions: [], methods: [], symbols: [], diagnostics: [] }
  function visit(node: Syntax): void {
    if (node.type === 'template_declaration') { children(node).forEach(visit); return }
    if (opaqueHeader(node, source)) return
    if (typeKinds.has(node.type)) { recordType(node, result); return }
    const fn = callable(node, undefined, 'public')
    if (!fn || !literalName(fn.name, result)) return
    const destination = fn.owner ? result.methods : result.functions
    destination.push(fn)
  }
  for (const node of topLevel(source)) visit(node)
  for (const fn of [...result.functions, ...result.methods]) {
    result.symbols.push(sourceSymbol(source.file, fn.node, fn.owner ? `${fn.owner}::${fn.name.text}` : fn.name.text, fn.owner ? 'method' : 'function'))
  }
  return result
}

/** An out-of-class definition inherits access only when every selected declaration with that name agrees. */
function methodVisibility(method: Callable, context: Declarations[]): CodeVisibility | undefined {
  if (method.visibility) return method.visibility
  const candidates = context.flatMap(file => file.types).filter(type => type.name.text === method.owner)
    .flatMap(type => type.members).filter(member => member.name.text === method.name.text)
  const access = new Set(candidates.map(candidate => candidate.visibility))
  return access.size === 1 ? [...access][0] : undefined
}

function symbol(fn: Callable, visibility: CodeVisibility, selected: readonly string[]): CodeSymbol {
  return { name: fn.name.text, line: fn.name.startPosition.row + 1, visibility, entry: selected.includes(fn.owner ? `${fn.owner}::${fn.name.text}` : fn.name.text) }
}

/** Every row points to its physical declaration, including separate method definitions. */
export function outline(file: Declarations, context: Declarations[], selected: readonly string[]): CodeDeclaration[] {
  const result: CodeDeclaration[] = file.functions.map(fn => ({ kind: 'function', ...symbol(fn, 'public', selected) }))
  const owners = new Set([...file.types.map(type => type.name.text), ...file.methods.map(method => method.owner!)])
  for (const owner of owners) {
    const declarations = file.types.filter(type => type.name.text === owner)
    const declared = declarations.find(type => type.name.parent && field(type.name.parent, 'body')) ?? declarations[0]
    const methods = file.methods.filter(method => method.owner === owner)
    const members = methods.flatMap(method => {
      const visibility = methodVisibility(method, context)
      return visibility ? [symbol(method, visibility, selected)] : []
    }).sort((a, b) => a.line - b.line)
    if (!declared && !members.length) continue
    result.push({ kind: 'type', name: owner, line: declared ? declared.name.startPosition.row + 1 : members[0]!.line,
      visibility: 'public', entry: selected.includes(owner), members })
  }
  return result.sort((a, b) => a.line - b.line)
}
