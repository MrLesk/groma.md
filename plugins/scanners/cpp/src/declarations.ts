import type { CodeVisibility, ScanInvocation, ScanOperation } from '@groma/scanner'
import { declarationMacroEffect, declarationMacros, macroEscape, macroKeepsScope, macroCall, macroName, memberNameAlias, writtenReturnType, type CppMacros } from './macros.ts'
import { conditionalKinds, field, functionName, nameParts, typeKinds, type Syntax } from './syntax.ts'

interface Location {
  name: string
  line: number
  position: number
  qualified: string
  visibility?: CodeVisibility
  topLevel: boolean
}
export interface CppFunction extends Location {
  owner?: string
  qualifier: string[]
  namespace: string[]
  privateNamespace: boolean
  conditional: boolean
  parameters?: string
  parameterCount?: number
  operation?: ScanOperation
}
export interface CppType extends Location {
  members: CppFunction[]
}
export interface CppDeclarations {
  types: CppType[]
  functions: CppFunction[]
  namespaces: string[]
  invocations: ScanInvocation[]
  conditional: boolean
  macroUses: string[]
  uncertainties: { name: string; line: number; reason: string }[]
}
interface Scope {
  namespace: string[]
  owner?: CppType
  visibility?: CodeVisibility
  privateNamespace: boolean
  conditional?: boolean
  topLevel: boolean
  unknownOwner?: boolean
}
interface Collector extends CppDeclarations { file: string; macros: CppMacros }

function storagePrivate(node: Syntax): boolean {
  return node.namedChildren.some(child => child.type === 'storage_class_specifier' && child.text === 'static')
}

/** Namespace const objects have internal linkage, except inline/extern or variable templates. */
function constantBinding(node: Syntax): boolean {
  const modifiers = new Set(node.namedChildren.filter(child => ['storage_class_specifier', 'type_qualifier'].includes(child.type)).map(child => child.text))
  if (node.parent?.type === 'template_declaration' || modifiers.has('volatile')) return false
  if (modifiers.has('inline') || modifiers.has('extern')) return false
  return modifiers.has('const') || modifiers.has('constexpr')
}

function visibility(all: Collector, node: Syntax, scope: Scope): CodeVisibility | undefined {
  const effect = declarationMacroEffect(node, all.macros)
  if (effect === 'unknown') return undefined
  if (scope.owner) return scope.visibility
  const declaration = node.type === 'init_declarator' ? node.parent! : node
  const local = node.type === 'init_declarator' && constantBinding(declaration)
  return scope.privateNamespace || effect === 'private' || storagePrivate(declaration) || local ? 'private' : 'public'
}

/** Written parameter count separates declarations, not overload call dispatch. */
function parameterCount(parameters: Syntax | undefined, macros: CppMacros): number | undefined {
  if (!parameters) return undefined
  const values = parameters.namedChildren.filter(child => child.type !== 'comment')
  if (parameters.children.some(child => child.type === '...')) return undefined
  if (values.some(child => !['parameter_declaration', 'optional_parameter_declaration'].includes(child.type))) return undefined
  const names = parameters.descendantsOfType(['identifier', 'type_identifier'])
  if (names.some(name => macros.definitions.has(name.text))) return undefined
  if (values.length === 1 && field(values[0]!, 'type')?.text === 'void' && !field(values[0]!, 'declarator')) return 0
  return values.length
}

function addFunction(all: Collector, scope: Scope, node: Syntax, name: Syntax, body?: Syntax): void {
  if (scope.unknownOwner) return
  const parts = nameParts(name)
  const parameters = field(name.parent!, 'parameters')
  const prefix = scope.owner ? [scope.owner.qualified] : scope.namespace
  const qualified = [...prefix, ...parts.qualifier, parts.name].join('::')
  const knownScope = declarationMacros(node, all.macros).every(macro => macroKeepsScope(macro, all.macros))
  const operation = body && knownScope ? { id: `${all.file}:${node.startIndex}`, file: all.file,
    name: qualified, position: node.startIndex } : undefined
  const fn: CppFunction = { ...parts, position: node.startIndex, qualified,
    visibility: visibility(all, node, scope), topLevel: scope.topLevel,
    owner: scope.owner?.qualified, namespace: scope.namespace, operation,
    privateNamespace: scope.privateNamespace, conditional: Boolean(scope.conditional),
    parameters: parameters?.text, parameterCount: parameterCount(parameters, all.macros) }
  all.functions.push(fn)
  scope.owner?.members.push(fn)
  if (!body || !operation) return
  collectCalls(all, operation.id, body)
  const initializers = node.namedChildren.find(child => child.type === 'field_initializer_list')
  if (initializers) collectCalls(all, operation.id, initializers)
  // Local classes have their own named operations; their methods never belong to the outer caller.
  walk(all, { ...scope, owner: undefined, topLevel: false }, body)
}

function addType(all: Collector, scope: Scope, node: Syntax): void {
  if (scope.unknownOwner) return
  const name = field(node, 'name')
  if (!name) return
  const qualified = [...(scope.owner ? [scope.owner.qualified] : scope.namespace), name.text].join('::')
  const type: CppType = { name: name.text, qualified, line: name.startPosition.row + 1,
    position: node.startIndex, visibility: visibility(all, node, scope),
    topLevel: scope.topLevel && !scope.owner, members: [] }
  all.types.push(type)
  const body = field(node, 'body')
  if (body) walk(all, { ...scope, owner: type,
    visibility: node.type === 'class_specifier' ? 'private' : 'public' }, body)
}

function declaration(all: Collector, scope: Scope, node: Syntax): void {
  const type = field(node, 'type')
  if (type && typeKinds.has(type.type)) addType(all, scope, type)
  for (const declarator of node.childrenForFieldName('declarator')) {
    const name = functionName(declarator)
    if (name) addFunction(all, scope, node, name)
    else addLambda(all, scope, declarator)
  }
}

function addLambda(all: Collector, scope: Scope, declarator: Syntax): void {
  // Only a direct top-level name is an outline function. Other lambdas are deferred work.
  if (!scope.topLevel || scope.owner || declarator.type !== 'init_declarator') return
  const name = field(declarator, 'declarator')
  const value = field(declarator, 'value')
  if (name?.type === 'identifier' && value?.type === 'lambda_expression') {
    addFunction(all, scope, declarator, name, field(value, 'body'))
  }
}

function namespace(all: Collector, scope: Scope, node: Syntax): void {
  const name = field(node, 'name')
  const names = name ? [...scope.namespace, ...name.text.split('::')] : scope.namespace
  all.namespaces.push(names.join('::'))
  const body = field(node, 'body')
  if (body) walk(all, { ...scope, namespace: names, privateNamespace: scope.privateNamespace || !name }, body)
}

function conditionalFunctions(all: Collector, scope: Scope, node: Syntax): void {
  all.conditional = true
  for (const header of node.descendantsOfType('function_header')) {
    const name = functionName(field(header, 'declarator')!)
    if (name) addFunction(all, { ...scope, conditional: true }, header, name, field(node, 'body'))
  }
}

function visit(all: Collector, scope: Scope, node: Syntax): void {
  if (['template_parameter_list', 'parameter_list', 'module_declaration', 'import_declaration'].includes(node.type)) return
  if (node.type === 'macro_qualified_definition') {
    uncertain(all, node, macroName(node.namedChildren[0]!), 'A macro supplies the function owner; dependent declaration and caller facts are omitted.')
    return
  }
  if (node.type === 'conditional_function_definition') {
    conditionalFunctions(all, scope, node)
    return
  }
  if (macroCall(node, all.macros)) return
  if (node.type === 'friend_declaration') {
    walk(all, { ...scope, owner: undefined, topLevel: false }, node)
    return
  }
  if (node.type === 'namespace_definition') { namespace(all, scope, node); return }
  if (typeKinds.has(node.type)) { addType(all, scope, node); return }
  if (node.type === 'function_definition') {
    const declarator = field(node, 'declarator')
    const name = declarator && functionName(declarator)
    if (name) addFunction(all, scope, node, name, field(node, 'body'))
    return
  }
  if (['declaration', 'field_declaration', 'type_definition'].includes(node.type)) { declaration(all, scope, node); return }
  if (node.type === 'lambda_expression' || node.type.startsWith('preproc_') && !conditionalKinds.has(node.type)) return
  walk(all, scope, node)
}

/** Directive conditions describe configuration, not source declarations or runtime calls. */
function sourceChildren(node: Syntax): Syntax[] {
  if (!conditionalKinds.has(node.type)) return node.namedChildren
  const conditions = [field(node, 'condition')?.id, field(node, 'name')?.id]
  return node.namedChildren.filter(child => !conditions.includes(child.id))
}

function changesOwner(node: Syntax, macros: CppMacros): boolean {
  if (typeKinds.has(node.type) || ['function_definition', 'conditional_function_definition'].includes(node.type)) return false
  if (node.type.startsWith('preproc_') && !conditionalKinds.has(node.type)) return false
  const name = macroCall(node, macros)
  return Boolean(name && !macroKeepsScope(node, macros)) || sourceChildren(node).some(child => changesOwner(child, macros))
}

function writtenBody(node: Syntax): Syntax | undefined {
  let current = node
  while (current.type === 'template_declaration') current = current.namedChildren.at(-1)!
  return ['function_definition', 'conditional_function_definition'].includes(current.type) ? field(current, 'body') : undefined
}

function bodyEscapesOwner(node: Syntax, macros: CppMacros, depth = 0): boolean {
  if (node.type.startsWith('preproc_') && !conditionalKinds.has(node.type)) return false
  const macro = macroCall(node, macros)
  if (macro) {
    const closingDepth = macroEscape(node, macros)
    return closingDepth === undefined || closingDepth > depth
  }
  const nested = depth + (['compound_statement', 'field_declaration_list', 'enumerator_list'].includes(node.type) ? 1 : 0)
  return sourceChildren(node).some(child => bodyEscapesOwner(child, macros, nested))
}

function changesAccess(node: Syntax): boolean {
  return node.type === 'access_specifier' || opaqueMember(node) || node.namedChildren.some(changesAccess)
}

function opaqueMember(node: Syntax): boolean {
  return ['macro_invocation', 'macro_statement'].includes(node.type)
}

interface MacroFrame { scope: Scope; transparent: boolean; optional: boolean }

function uncertain(all: Collector, node: Syntax, name: string, reason: string): void {
  all.uncertainties.push({ name, line: node.startPosition.row + 1, reason })
}

function opaqueScope(all: Collector, scope: Scope, node: Syntax, name: string): Scope {
  if (macroKeepsScope(node, all.macros)) {
    if (scope.owner && memberNameAlias(node, name, all.macros)) {
      uncertain(all, node, name, 'A macro supplies this member name; only that member is omitted.')
      return scope
    }
    return { ...scope, visibility: undefined }
  }
  uncertain(all, node, name, 'The macro can change the enclosing scope; later member ownership is unproven.')
  if (scope.topLevel && !scope.owner) throw new Error(`cpp: ${all.file}:${node.startPosition.row + 1}: unknown scope boundary in macro ${name}.`)
  return { ...scope, visibility: undefined, unknownOwner: true }
}

function macroScope(all: Collector, scope: Scope, frames: MacroFrame[], node: Syntax, name: string): Scope {
  all.macroUses.push(name)
  const boundary = all.macros.boundaries.get(name)
  if (!boundary) return opaqueScope(all, scope, node, name)
  if (scope.owner) throw new Error(`cpp: ${all.file}:${node.startPosition.row + 1}: namespace/export macro inside a written type.`)
  if (boundary.kind === 'namespace') {
    for (const names of boundary.namespaces) {
      frames.push({ scope, transparent: false, optional: false })
      scope = { ...scope, namespace: [...scope.namespace, ...names] }
      all.namespaces.push(scope.namespace.join('::'))
    }
    return scope
  }
  if (boundary.kind === 'export') {
    frames.push({ scope, transparent: true, optional: boundary.optional })
    return scope
  }
  for (let index = 0; index < boundary.count; index++) {
    const frame = frames.pop()
    if (!frame || boundary.optional && (!frame.transparent || !frame.optional) || frame.optional !== boundary.optional) {
      throw new Error(`cpp: ${all.file}:${node.startPosition.row + 1}: ambiguous or unbalanced macro scope boundary ${name}.`)
    }
    scope = frame.scope
  }
  return scope
}

function conditionalScope(all: Collector, scope: Scope, child: Syntax): Scope {
  all.conditional = true
  visit(all, { ...scope, conditional: true }, child)
  // A conditional label can change later access. No active branch is selected.
  return { ...scope,
    visibility: scope.owner && changesAccess(child) ? undefined : scope.visibility,
    unknownOwner: scope.unknownOwner || changesOwner(child, all.macros) }
}

function walkChild(all: Collector, scope: Scope, frames: MacroFrame[], child: Syntax): Scope {
  const macro = macroCall(child, all.macros)
  if (macro) return macroScope(all, scope, frames, child, macro)
  if (child.type === 'access_specifier') return { ...scope, visibility: child.text as CodeVisibility }
  if (conditionalKinds.has(child.type)) return conditionalScope(all, scope, child)
  visit(all, scope, child)
  const body = writtenBody(child)
  if (scope.owner && body && bodyEscapesOwner(body, all.macros)) {
    uncertain(all, child, scope.owner.name, 'A body macro can cross this type boundary; later member ownership is unproven.')
    return { ...scope, unknownOwner: true }
  }
  return scope
}

function walk(all: Collector, initial: Scope, node: Syntax): void {
  let scope = initial
  const frames: MacroFrame[] = []
  for (const child of sourceChildren(node)) {
    if (conditionalKinds.has(node.type) && field(node, 'alternative')?.id === child.id) visit(all, initial, child)
    else scope = walkChild(all, scope, frames, child)
  }
  if (frames.length) throw new Error(`cpp: ${all.file}:${node.startPosition.row + 1}: unbalanced macro scope boundaries.`)
}

const unevaluated = new Set(['sizeof_expression', 'alignof_expression', 'decltype', 'noexcept_expression', 'requires_expression', 'reflection_expression'])

function ignoredCallContext(node: Syntax): boolean {
  if (node.type.startsWith('preproc_')) return !conditionalKinds.has(node.type)
  return typeKinds.has(node.type) || ['function_definition', 'ms_asm_statement', 'macro_qualified_definition'].includes(node.type) || unevaluated.has(node.type)
}

const namedCasts = new Set(['static_cast', 'dynamic_cast', 'reinterpret_cast', 'const_cast'])

function namedCast(node: Syntax): boolean {
  const callee = field(node, 'function')
  if (callee && ['primitive_type', 'sized_type_specifier'].includes(callee.type)) return true
  return callee?.type === 'template_function' && namedCasts.has(field(callee, 'name')!.text)
}

function macroBlockCalls(all: Collector, source: string, node: Syntax, state: { certain: boolean }): void {
  const macroNode = node.type === 'macro_block' ? node.namedChildren[0]! : node
  const name = macroName(macroNode)
  all.macroUses.push(name)
  if (!macroKeepsScope(macroNode, all.macros)) {
    state.certain = false
    uncertain(all, macroNode, name, 'The macro arguments can change the enclosing caller; later calls are unproven.')
    return
  }
  if (!all.macros.sameBlockCaller.has(name)) {
    uncertain(all, macroNode, name, 'The macro does not prove the caller of its following written block.')
    return
  }
  const bodies = node.type === 'macro_block' ? node.namedChildren.slice(1) : [field(node, 'body')!]
  for (const child of bodies) collectCalls(all, source, child, state)
}

function opaqueCallable(all: Collector, node: Syntax, state: { certain: boolean }): boolean {
  const callable = field(node, 'function')!
  const nodes = [callable, ...callable.descendantsOfType('call_expression')].filter(child => macroCall(child, all.macros))
  if (!nodes.length) return false
  const names = [...new Set(nodes.map(child => macroCall(child, all.macros)!))]
  all.macroUses.push(...names)
  if (nodes.some(child => !macroKeepsScope(child, all.macros))) state.certain = false
  uncertain(all, node, names.join(', '), 'An opaque macro forms the callable; its invocation and argument execution are unproven.')
  return true
}

function opaqueCall(all: Collector, node: Syntax, state: { certain: boolean }): boolean {
  const macro = macroCall(node, all.macros)
  if (macro) {
    all.macroUses.push(macro)
    if (!macroKeepsScope(node, all.macros)) { state.certain = false; uncertain(all, node, macro, 'The macro can change the enclosing caller; later calls are unproven.') }
    return true
  }
  return false
}

function recordCall(all: Collector, source: string, node: Syntax): void {
    const callee = field(node, 'function') ?? field(node, 'type')
    all.invocations.push({ source, targets: [], unresolved: true, line: node.startPosition.row + 1,
      position: node.startIndex, ...(callee ? { member: callee.text } : {}) })
}

function collectCalls(all: Collector, source: string, node: Syntax, state = { certain: true }): void {
  if (!state.certain) return
  if (node.type === 'macro_block' || node.type === 'function_definition' && macroCall(node, all.macros)) {
    macroBlockCalls(all, source, node, state)
    return
  }
  if (opaqueCall(all, node, state)) return
  if (ignoredCallContext(node)) return
  if (node.type === 'lambda_expression') {
    const captures = field(node, 'captures')
    if (captures) collectCalls(all, source, captures, state)
    return
  }
  if (node.type === 'call_expression' && opaqueCallable(all, node, state)) return
  if (node.type === 'new_expression' || node.type === 'call_expression' && !namedCast(node)) {
    recordCall(all, source, node)
  }
  for (const child of sourceChildren(node)) collectCalls(all, source, child, state)
}

/** Collect declarations and their body calls with explicit lexical scope; no compiler symbols are guessed. */
export function cppDeclarations(file: string, root: Syntax, macros: CppMacros): CppDeclarations {
  const macroUses = root.descendantsOfType(['macro_specifier', 'macro_annotation', 'macro_invocation', 'macro_statement', 'macro_type_invocation']).filter(node => !node.parent || node.id !== writtenReturnType(node.parent, macros)?.id).map(macroName)
  const all: Collector = { file, macros, types: [], functions: [], namespaces: [], invocations: [], conditional: false, macroUses, uncertainties: [] }
  for (const node of root.descendantsOfType(['macro_specifier', 'macro_type_invocation'])) {
    const name = macroName(node)
    if (!macros.definitions.has(name) && (!node.parent || node.id !== writtenReturnType(node.parent, macros)?.id)) uncertain(all, node, name, 'No selected macro definition proves this modifier or invocation; dependent outline or caller facts are omitted.')
  }
  walk(all, { namespace: [], privateNamespace: false, topLevel: true }, root)
  all.macroUses = [...new Set(all.macroUses)].sort()
  return all
}
