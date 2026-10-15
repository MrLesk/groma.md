import { cppTree, field, functionName, nameParts, typeKinds, type Syntax } from './syntax.ts'

export type MacroEffect = 'neutral' | 'private' | 'unknown'
export interface CppMacros {
  escapes: ReadonlyMap<string, number>
  functionNames: ReadonlySet<string>
  definitions: ReadonlyMap<string, readonly string[]>
  effects: ReadonlyMap<string, MacroEffect>
  boundaries: ReadonlyMap<string, MacroBoundary>
  balanced: ReadonlySet<string>
  sameBlockCaller: ReadonlySet<string>
}
const macroKinds = ['macro_specifier', 'macro_annotation', 'macro_invocation', 'macro_statement', 'macro_type_invocation']
const modifiers = new Set(['storage_class_specifier', 'type_qualifier', 'attribute_specifier',
  'attribute_declaration', 'ms_declspec_modifier', 'macro_specifier', 'macro_annotation'])

export function macroName(node: Syntax): string {
  const declarator = node.type === 'function_definition' && field(node, 'declarator')
  const name = declarator ? functionName(declarator) : field(node, 'name') ?? node.namedChildren[0]
  return name?.text.trim() ?? ''
}

/** Selected definitions are possible source meanings, not an evaluated include/configuration graph. */
function selectedDefinitions(roots: readonly Syntax[]) {
  const definitions = new Map<string, string[]>()
  const functions = new Set<string>()
  const parameters = new Map<string, Set<string>[]>()
  for (const root of roots) {
    for (const node of root.descendantsOfType(['preproc_def', 'preproc_function_def'])) {
      const name = field(node, 'name')!.text
      if (node.type === 'preproc_function_def') functions.add(name)
      const variants = parameters.get(name) ?? []
      variants.push(new Set((field(node, 'parameters')?.namedChildren ?? []).map(parameter => parameter.text)))
      parameters.set(name, variants)
      const values = definitions.get(name) ?? []
      values.push(field(node, 'value')?.text.replace(/\\\r?\n/g, '') ?? '')
      definitions.set(name, values)
    }
  }
  return { definitions, functions, parameters }
}

async function macroEffects(definitions: ReadonlyMap<string, readonly string[]>): Promise<Map<string, MacroEffect>> {
  const effects = new Map<string, MacroEffect>()
  const resolving = new Set<string>()
  async function effect(name: string): Promise<MacroEffect> {
    if (effects.has(name)) return effects.get(name)!
    if (resolving.has(name) || !definitions.has(name)) return 'unknown'
    resolving.add(name)
    const variants = new Set<MacroEffect>()
    for (const value of definitions.get(name)!) variants.add(await replacementEffect(value, effect))
    resolving.delete(name)
    const result = variants.size === 1 ? [...variants][0]! : 'unknown'
    effects.set(name, result)
    return result
  }
  for (const name of definitions.keys()) await effect(name)
  return effects
}

export async function cppMacros(roots: readonly Syntax[]): Promise<CppMacros> {
  const { definitions, functions, parameters } = selectedDefinitions(roots)
  const effects = await macroEffects(definitions)
  const boundaries = new Map<string, MacroBoundary>()
  const escapes = new Map<string, number>()
  const balancedNames = new Set<string>()
  const blockNames = new Set(roots.flatMap(root => root.descendantsOfType(['macro_block', 'function_definition']).map(node => macroName(node.type === 'macro_block' ? node.namedChildren[0]! : node))))
  const sameCallers = new Set<string>()
  const dependencies = new Map<string, string[]>()
  for (const [name, values] of definitions) {
    const references: string[] = []
    let knownPastes = true
    for (const [index, value] of values.entries()) {
      const formals = parameters.get(name)![index]!
      references.push(...(await replacementNames(value)).filter(reference => definitions.has(reference) && !formals.has(reference)))
      const pasted = pastedDependencies(value, formals, definitions)
      if (pasted) references.push(...pasted)
      else knownPastes = false
    }
    dependencies.set(name, references)
    const closingDepth = knownPastes ? braceEscape(values) : undefined
    if (closingDepth !== undefined) escapes.set(name, closingDepth)
    const scope = !functions.has(name) && boundary(values)
    if (scope) boundaries.set(name, scope)
    if (knownPastes && values.every(balanced)) balancedNames.add(name)
    if (blockNames.has(name) && (await Promise.all(values.map(sameBlockCaller))).every(Boolean)) sameCallers.add(name)
  }
  removeOpaqueDependencies(balancedNames, dependencies)
  const provenEscapes = new Map([...escapes].filter(([name]) => dependencies.get(name)!.every(dependency => balancedNames.has(dependency))))
  const provenCallers = new Set([...sameCallers].filter(name => balancedNames.has(name)))
  return { escapes: provenEscapes, functionNames: functions, definitions, effects, boundaries, balanced: balancedNames, sameBlockCaller: provenCallers }
}

/** A selected alias cannot prove neutrality when any referenced selected replacement is opaque. */
function removeOpaqueDependencies(names: Set<string>, dependencies: ReadonlyMap<string, readonly string[]>): void {
  function contained(name: string, seen: Set<string>): boolean {
    if (seen.has(name) || !names.has(name)) return false
    const next = new Set([...seen, name])
    return dependencies.get(name)!.every(dependency => contained(dependency, next))
  }
  for (const name of names) if (!contained(name, new Set())) names.delete(name)
}

/** Fixed tokens around one formal bound possible selected macro names without expanding an argument. */
function pasteBoundary(operands: string[], formals: ReadonlySet<string>): { prefix: string; suffix: string } | undefined {
  if (!operands.every(word => /^[A-Za-z_]\w*$/.test(word))) return undefined
  const positions = operands.flatMap((word, index) => formals.has(word) ? [index] : [])
  if (positions.length !== 1) return undefined
  const prefix = operands.slice(0, positions[0]!).join('')
  const suffix = operands.slice(positions[0]! + 1).join('')
  return prefix || suffix ? { prefix, suffix } : undefined
}

function pasteChains(value: string[]): string[][] {
  const chains: string[][] = []
  for (let index = 0; index < value.length; index++) {
    if (value[index] !== '##') continue
    const operands = [value[index - 1] ?? '']
    while (value[index] === '##') { operands.push(value[index + 1] ?? ''); index += 2 }
    chains.push(operands)
  }
  return chains
}

function pastedDependencies(value: string, formals: ReadonlySet<string>, definitions: CppMacros['definitions']): string[] | undefined {
  const names: string[] = []
  for (const operands of pasteChains(replacementTokens(value))) {
    const shape = pasteBoundary(operands, formals)
    if (!shape) return undefined
    const { prefix, suffix } = shape
    for (const name of definitions.keys()) {
      if (name.length >= prefix.length + suffix.length && name.startsWith(prefix) && name.endsWith(suffix)) names.push(name)
    }
  }
  return names
}

/** A modifier probe classifies declared replacement syntax; it never expands source or emits facts. */
async function replacementEffect(value: string, effect: (name: string) => Promise<MacroEffect>): Promise<MacroEffect> {
  if (value.trim() === 'export') return 'neutral'
  for (const source of [`${value} void __groma_probe();`, `void __groma_probe() ${value};`]) {
    const tree = await cppTree(source)
    try {
      if (tree.rootNode.hasError) continue
      const declarations = tree.rootNode.namedChildren.filter(node => node.type !== 'comment')
      if (declarations.length !== 1 || declarations[0]!.type !== 'declaration') continue
      const declaration = declarations[0]!
      const declarator = field(declaration, 'declarator')
      if (!declarator || functionName(declarator)?.text !== '__groma_probe' || field(declaration, 'type')?.text !== 'void') continue
      const nodes = [...declaration.namedChildren.filter(node => node.id !== declarator.id && node.type !== 'primitive_type'),
        ...declarator.namedChildren.filter(node => !['identifier', 'parameter_list'].includes(node.type))]
      if (nodes.some(node => !modifiers.has(node.type) && node.type !== 'comment')) continue
      return await modifierNodesEffect(nodes, effect)
    } finally { tree.delete() }
  }
  return 'unknown'
}

async function modifierNodesEffect(nodes: Syntax[], effect: (name: string) => Promise<MacroEffect>): Promise<MacroEffect> {
  let result: MacroEffect = 'neutral'
  for (const node of nodes) {
    if (node.type === 'storage_class_specifier' && node.text === 'static') result = 'private'
    if (node.type === 'macro_specifier' || node.type === 'macro_annotation') {
      const nested = await effect(macroName(node))
      if (nested === 'unknown') return 'unknown'
      if (nested === 'private') result = 'private'
    }
  }
  return result
}

/** Only explicit macro syntax needs proof; ordinary C++ names keep their original parser roles. */
export function validateMacros(file: string, root: Syntax, macros: CppMacros): void {
  for (const node of root.descendantsOfType(macroKinds)) {
    const name = macroName(node)
    if (!macros.definitions.has(name) && node.type !== 'macro_type_invocation' && !unknownModifier(node)) throw new Error(`cpp: ${file}:${node.startPosition.row + 1}: declaration macro ${JSON.stringify(name)} has no definition in the selected source.`)
  }
}

export function macroCall(node: Syntax, macros: CppMacros): string | undefined {
  if (node.type === 'function_definition' && field(node, 'type')) return undefined
  if (node.type === 'expression_statement' && node.namedChildCount === 1) return macroCall(node.namedChildren[0]!, macros)
  if (macroKinds.includes(node.type)) return macroName(node)
  if (['identifier', 'type_identifier', 'field_identifier'].includes(node.type) && macros.definitions.has(node.text) && !macros.functionNames.has(node.text)) return node.text
  if (['declaration', 'field_declaration', 'function_definition'].includes(node.type)) {
    const names = node.childrenForFieldName('declarator').map(functionName)
    const name = names.length === 1 && names[0]
    if (name && ['identifier', 'field_identifier'].includes(name.type) && macros.definitions.has(name.text)) return name.text
  }
  if (node.type !== 'call_expression') return undefined
  const callee = field(node, 'function')
  if (callee?.type !== 'identifier') return undefined
  return macros.definitions.has(callee.text) ? callee.text : undefined
}

/** A literal member-name alias cannot change access after an otherwise written declaration. */
export function memberNameAlias(node: Syntax, name: string, macros: CppMacros): boolean {
  if (!['declaration', 'field_declaration'].includes(node.type) || !field(node, 'type')) return false
  if (macros.functionNames.has(name) || declarationMacros(node, macros).length) return false
  return Boolean(macros.definitions.get(name)?.every(value => /^[A-Za-z_]\w*$/.test(value.trim()) && !macros.definitions.has(value.trim())))
}

/** Nested selected macro arguments can also alter scope, even when the outer replacement is balanced. */
export function macroKeepsScope(node: Syntax, macros: CppMacros): boolean {
  const name = macroCall(node, macros)
  if (!name || !macros.balanced.has(name)) return false
  return !node.descendantsOfType(['identifier', 'type_identifier', 'field_identifier', 'call_expression', ...macroKinds]).some(child => {
    const nested = macroCall(child, macros)
    return nested && !macros.balanced.has(nested)
  })
}

/** Bound only literal closing braces; opaque expansion or pasting cannot prove an outer owner. */
export function macroEscape(node: Syntax, macros: CppMacros): number | undefined {
  const name = macroCall(node, macros)
  if (!name) return 0
  const own = macros.escapes.get(name)
  if (own === undefined) return undefined
  const argumentsUnsafe = node.descendantsOfType(['identifier', 'type_identifier', 'field_identifier', 'call_expression', ...macroKinds]).some(child => {
    const nested = macroCall(child, macros)
    return nested && nested !== name && !macroKeepsScope(child, macros)
  })
  return argumentsUnsafe ? undefined : own
}

/** A macro modifier can establish access only when every observed definition agrees. */
export function declarationMacroEffect(node: Syntax, macros: CppMacros): MacroEffect {
  let result: MacroEffect = 'neutral'
  for (const child of declarationMacros(node, macros)) {
    const effect = macros.effects.get(macroName(child)) ?? 'unknown'
    if (effect === 'unknown') return 'unknown'
    if (effect === 'private') result = 'private'
  }
  return result
}

export function declarationMacros(node: Syntax, macros: CppMacros): Syntax[] {
  const body = field(node, 'body')
  const nodes = node.descendantsOfType(['macro_specifier', 'macro_annotation']).filter(child => (!body || child.endIndex <= body.startIndex) && child.id !== writtenReturnType(node, macros)?.id)
  if (node.parent?.type === 'template_declaration') nodes.push(...node.parent.namedChildren.filter(child => child.type === 'macro_specifier'))
  let parent = node.parent
  while (parent?.type.startsWith('preproc_')) parent = parent.parent
  if (parent?.type === 'conditional_function_definition') nodes.push(...parent.namedChildren.filter(child => child.type === 'macro_annotation'))
  return nodes
}

/** A typeless unqualified namespace function cannot be a constructor. Its last ordinary prefix is the written return type. */
export function writtenReturnType(node: Syntax, macros: CppMacros): Syntax | undefined {
  if (node.type !== 'function_definition' || field(node, 'type')) return undefined
  const declarator = field(node, 'declarator')
  const name = declarator && functionName(declarator)
  if (!name || nameParts(name).qualifier.length) return undefined
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (typeKinds.has(parent.type)) return undefined
    if (parent.type === 'namespace_definition' || parent.type === 'translation_unit') break
  }
  const last = node.namedChildren.filter(child => child.type === 'macro_specifier').at(-1)
  return last && !macros.definitions.has(macroName(last)) ? last : undefined
}

function unknownModifier(node: Syntax): boolean {
  const type = node.parent && field(node.parent, 'type')
  if (type && ['class_specifier', 'struct_specifier', 'union_specifier', 'enum_specifier'].includes(type.type)) return false
  return node.type === 'macro_specifier' && ['declaration', 'field_declaration', 'function_definition',
    'type_definition', 'ms_call_modifier', 'parenthesized_declarator', 'parenthesized_type_declarator', 'parameter_declaration',
    'optional_parameter_declaration'].includes(node.parent?.type ?? '')
}

export type MacroBoundary = { kind: 'namespace'; namespaces: string[][] } | { kind: 'export'; optional: boolean } | { kind: 'close'; count: number; optional: boolean }

/** Only complete literal delimiter shapes can inform lexical scope. */
function literalBoundary(value: string): MacroBoundary | undefined {
  let rest = value.trim()
  if (rest === 'export {') return { kind: 'export', optional: false }
  if (/^(?:}\s*)+$/.test(rest)) return { kind: 'close', count: [...rest].filter(char => char === '}').length, optional: false }
  const namespaces: string[][] = []
  while (rest) {
    const match = /^(?:inline\s+)?namespace\s+([A-Za-z_]\w*(?:\s*::\s*[A-Za-z_]\w*)*)\s*\{\s*/.exec(rest)
    if (!match) return undefined
    namespaces.push(match[1]!.split(/\s*::\s*/))
    rest = rest.slice(match[0].length)
  }
  return namespaces.length ? { kind: 'namespace', namespaces } : undefined
}
function boundary(values: readonly string[]): MacroBoundary | undefined {
  const nonempty = values.filter(value => value.trim())
  const shapes = nonempty.map(literalBoundary)
  if (!shapes.length || shapes.some(shape => !shape)) return undefined
  const first = shapes[0]!
  if (!shapes.every(shape => JSON.stringify(shape) === JSON.stringify(first))) return undefined
  if (nonempty.length === values.length) return first
  if (first.kind === 'export' || first.kind === 'close' && first.count === 1) return { ...first, optional: true }
  return undefined
}

/** Lex replacement delimiters, ignoring strings/comments but never token pasting. No source is rewritten. */
function replacementTokens(value: string): string[] {
  return [...value.matchAll(/R"([^ ()\\\t\r\n]{0,16})\([\s\S]*?\)\1"|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|##|[A-Za-z_]\w*|[^\s]/g)].map(match => match[0])
}
function balanced(value: string): boolean {
  const tokens = replacementTokens(value)
  const stack: string[] = []
  const closes = new Map([[')', '('], [']', '['], ['}', '{']])
  for (const token of tokens) {
    if (token === '"' || token === "'") return false
    if ('([{'.includes(token) && token.length === 1) stack.push(token)
    else if (closes.has(token) && stack.pop() !== closes.get(token)) return false
  }
  return stack.length === 0
}

/** A zero net change can still close a written enclosing body before opening another one. */
function braceEscape(values: readonly string[]): number | undefined {
  let maximum = 0
  for (const value of values) {
    let depth = 0
    for (const token of replacementTokens(value)) {
      if (token === '"' || token === "'") return undefined
      if (token === '{') depth++
      if (token === '}') depth--
      maximum = Math.max(maximum, -depth)
    }
    if (depth !== 0) return undefined
  }
  return maximum
}

/** Probe a following written block without producing declarations or invocation facts. */
async function sameBlockCaller(value: string): Promise<boolean> {
  for (const body of [`${value} { __groma_marker(); }`, `${value} { __groma_marker(); } catch (...) {}`, `try {} ${value} { __groma_marker(); }`]) {
    const tree = await cppTree(`void __groma_probe() { ${body} }`)
    try {
      if (tree.rootNode.hasError) continue
      const marker = tree.rootNode.descendantsOfType('call_expression').find(node => field(node, 'function')?.text === '__groma_marker')
      let owner = marker?.parent
      while (owner && !['function_definition', 'lambda_expression', 'macro_block', 'class_specifier', 'struct_specifier'].includes(owner.type)) owner = owner.parent
      if (owner?.type === 'function_definition') return true
    } finally { tree.delete() }
  }
  return false
}

async function replacementNames(value: string): Promise<string[]> {
  const tree = await cppTree(value)
  try { return tree.rootNode.descendantsOfType(['identifier', 'type_identifier', 'field_identifier']).map(node => node.text) }
  finally { tree.delete() }
}
