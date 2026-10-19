import type { CodeVisibility, ScanDiagnostic, ScanInvocation, ScanOperation } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import type { MacroEvidence } from './macros.ts'

export interface CDeclaration {
  kind: 'function' | 'type'
  name: string
  line: number
  position: number
  visibility?: CodeVisibility
}

export interface CSource {
  file: string
  declarations: CDeclaration[]
  operations: ScanOperation[]
  calls: ScanInvocation[]
  diagnostics: ScanDiagnostic[]
}

// Conditional node ID → chosen branch node ID; the first branch uses the conditional node ID.
type Conditions = Map<number, number>
interface StaticDeclaration { name: string; conditions: Conditions; uncertain?: boolean }
const conditionTypes = new Set(['preproc_if', 'preproc_ifdef'])
const alternatives = new Set(['preproc_else', 'preproc_elif', 'preproc_elifdef'])
const macroSyntax = new Set(['macro_specifier', 'macro_annotation', 'macro_field', 'macro_statement'])

/** Alternative branches remain separate source possibilities, never a configured translation unit. */
function conditionsOf(node: Node): Conditions {
  const conditions: Conditions = new Map()
  let branch: number | undefined
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (alternatives.has(parent.type)) branch ??= parent.id
    if (conditionTypes.has(parent.type)) {
      conditions.set(parent.id, branch ?? parent.id)
      branch = undefined
    }
  }
  return conditions
}

function storageIsStatic(node: Node): boolean {
  return node.namedChildren.some(child => child.type === 'storage_class_specifier' && child.text === 'static')
}

function uncertainMacroType(node: Node, macros: MacroEvidence): boolean {
  if (node.type === 'type_identifier' && macros.names.has(node.text)) return true
  if (node.type === 'macro_type_specifier') {
    const name = node.childForFieldName('name')!.text
    if (!macros.neutralTypes.has(name)) return true
  }
  return node.namedChildren.some(child => uncertainMacroType(child, macros))
}

function uncertainModifier(node: Node, macros: MacroEvidence): boolean {
  if (node.type === 'macro_specifier') return !macros.neutralPrefixes.has(node.text)
  if (node.type === 'macro_annotation') return !macros.neutralAnnotations.has(node.childForFieldName('name')!.text)
  const declarator = node.childForFieldName('declarator')
  if (declarator && uncertainModifier(declarator, macros)) return true
  return node.type === 'function_declarator' && node.namedChildren.some(child =>
    child.type === 'macro_annotation' && uncertainModifier(child, macros))
}

function functionVisibility(name: string, node: Node, prior: StaticDeclaration[], macros: MacroEvidence): CodeVisibility | undefined {
  const conditions = conditionsOf(node)
  const type = node.childForFieldName('type')
  if ((type && uncertainMacroType(type, macros))
    || node.namedChildren.some(child => uncertainModifier(child, macros))) {
    prior.push({ name, conditions, uncertain: true })
    return
  }
  if (storageIsStatic(node)) {
    prior.push({ name, conditions })
    return 'private'
  }
  let uncertain = false
  for (const declaration of prior.filter(item => item.name === name)) {
    const choices = [...declaration.conditions]
    if (choices.some(([group, branch]) => conditions.has(group) && conditions.get(group) !== branch)) continue
    if (!declaration.uncertain && choices.every(([group, branch]) => conditions.get(group) === branch)) return 'private'
    uncertain = true
  }
  return uncertain ? undefined : 'public'
}

/** The operator nearest the identifier distinguishes a function from a function-pointer variable. */
function functionName(input: Node): Node | undefined {
  let node: Node | null = input
  let nearest = ''
  while (node) {
    if (node.type === 'identifier') return nearest === 'function_declarator' ? node : undefined
    if (['function_declarator', 'pointer_declarator', 'array_declarator'].includes(node.type)) {
      nearest = node.type
      node = node.childForFieldName('declarator')
    } else if (['parenthesized_declarator', 'attributed_declarator'].includes(node.type)) {
      node = node.childForFieldName('declarator') ?? node.namedChild(0)
    } else return undefined
  }
}

function declaration(kind: CDeclaration['kind'], node: Node, name: Node, visibility?: CodeVisibility): CDeclaration {
  return { kind, name: name.text, line: name.startPosition.row + 1, position: node.startIndex, visibility }
}

function addDiagnostic(result: CSource, node: Node, code: string, message: string): void {
  result.diagnostics.push({ severity: 'warning', code, file: result.file,
    line: node.startPosition.row + 1, message })
}

function addType(result: CSource, node: Node): void {
  if (!['struct_specifier', 'union_specifier', 'enum_specifier'].includes(node.type)) return
  const name = node.childForFieldName('name')
  if (name && node.childForFieldName('body')) result.declarations.push(declaration('type', node, name, 'public'))
}

function callMember(node: Node): string | undefined {
  const functionNode = node.childForFieldName('function')!
  if (functionNode.type === 'identifier') return functionNode.text
  if (functionNode.type === 'field_expression') return functionNode.childForFieldName('field')?.text
}

/** A macro can discard/stringify its arguments; they are not proven runtime calls. */
function isMacroCall(node: Node, macros: MacroEvidence): boolean {
  return node.type === 'call_expression' && macros.names.has(callMember(node) ?? '')
}

/** A macro within a callee can turn the whole apparent call into an unevaluated expression. */
function hasMacroCallee(node: Node, macros: MacroEvidence): boolean {
  if (node.type !== 'call_expression') return false
  if (isMacroCall(node, macros)) return true
  const pending = [node.childForFieldName('function')!]
  while (pending.length) {
    const callee = pending.pop()!
    if (['comment', 'string_literal', 'char_literal'].includes(callee.type)) continue
    if (isMacroCall(callee, macros) || (callee.childCount === 0 && macros.objectNames.has(callee.text))) return true
    pending.push(...callee.namedChildren)
  }
  return false
}

/** Annotation calls require function-like definitions in every selected alternative. */
function hasSelectedMacroDefinition(node: Node, name: string, macros: MacroEvidence): boolean {
  return macros.names.has(name) && (node.type !== 'macro_annotation' || !macros.objectNames.has(name))
}

function validateMacros(result: CSource, declaration: Node, macros: MacroEvidence): boolean {
  let valid = true
  const pending = [declaration]
  while (pending.length) {
    const node = pending.pop()!
    if (macroSyntax.has(node.type)) {
      const name = node.type === 'macro_specifier' ? node.text : node.childForFieldName('name')!.text
      if (!hasSelectedMacroDefinition(node, name, macros)) {
        addDiagnostic(result, node, 'C_MACRO_UNRESOLVED',
          `No selected definition proves ${name} as macro syntax; this declaration contributes no evidence.`)
        valid = false
      } else if (node.type === 'macro_field') addDiagnostic(result, node, 'C_MACRO_FIELDS_OMITTED',
        `Fields generated by ${name} are not expanded; only the explicit surrounding type is reported.`)
      else if (node.type === 'macro_statement') addDiagnostic(result, node, 'C_MACRO_BODY_OMITTED',
        `The body generated by ${name} is not expanded and contributes no runtime evidence.`)
      continue
    }
    pending.push(...node.namedChildren)
  }
  return valid
}

function uncertainMacroArgument(node: Node, macros: MacroEvidence): boolean {
  if (['comment', 'string_literal', 'char_literal'].includes(node.type)) return false
  if (node.type === '{' || node.type === '}') return true
  if (node.childCount === 0 && macros.names.has(node.text) && !macros.scopeNeutral.has(node.text)) return true
  return node.children.some(child => uncertainMacroArgument(child, macros))
}

function changesCallerScope(node: Node, macros: MacroEvidence): boolean {
  if (node.type === 'macro_statement') return !macros.scopeNeutral.has(node.childForFieldName('name')!.text)
  if (isMacroCall(node, macros)) return !macros.scopeNeutral.has(callMember(node)!)
    || uncertainMacroArgument(node.childForFieldName('arguments')!, macros)
  return node.childCount === 0 && macros.objectNames.has(node.text) && !macros.scopeNeutral.has(node.text)
}

/** Selected macros preserve caller scope only when every replacement has a proven brace boundary. */
function uncertainCallerScope(body: Node, macros: MacroEvidence): Node | undefined {
  const pending = [body]
  while (pending.length) {
    const node = pending.pop()!
    if (['comment', 'string_literal', 'char_literal', 'preproc_def', 'preproc_function_def'].includes(node.type)) continue
    if (changesCallerScope(node, macros)) return node
    // Calls in directive conditions cannot insert a runtime function scope.
    const condition = node.type.startsWith('preproc_') ? node.childForFieldName('condition') : null
    pending.push(...node.namedChildren.filter(child => child.id !== condition?.id))
  }
}

function addNestedFunction(result: CSource, node: Node, macros: MacroEvidence): void {
  const declarator = node.childForFieldName('declarator')
  const name = declarator && functionName(declarator)
  if (name) addFunctionBody(result, node, name, macros)
}

/** A nested GNU function owns its body. Unevaluated operands do not become calls of the enclosing function. */
function addFunctionBody(result: CSource, node: Node, name: Node, macros: MacroEvidence, body = node.childForFieldName('body')): void {
  if (!body) return
  const id = `${result.file}:${node.startIndex}`
  if (result.operations.some(operation => operation.id === id)) return
  result.operations.push({ id, file: result.file, name: name.text, position: node.startIndex })
  const uncertainScope = uncertainCallerScope(body, macros)
  if (uncertainScope) addDiagnostic(result, name, 'C_CALLER_SCOPE_UNCERTAIN',
    'An unexpanded macro may open or close a generated function scope; this body contributes no invocations.')
  const pending = [body]
  while (pending.length) {
    const current = pending.pop()!
    if (current.type === 'function_definition') {
      addNestedFunction(result, current, macros)
      continue
    }
    if (['sizeof_expression', 'alignof_expression', 'generic_expression', 'typeof_specifier', 'macro_field', 'macro_statement'].includes(current.type)
      || hasMacroCallee(current, macros)) continue
    if (current.type === 'call_expression' && !uncertainScope) result.calls.push({
      source: id, targets: [], unresolved: true, member: callMember(current),
      line: current.startPosition.row + 1, position: current.startIndex,
    })
    // Directive conditions run in the preprocessor; their branch bodies still contain runtime source.
    const condition = current.type.startsWith('preproc_') ? current.childForFieldName('condition') : null
    pending.push(...current.namedChildren.filter(child => child.id !== condition?.id).reverse())
  }
}

function addFunctions(result: CSource, node: Node, prior: StaticDeclaration[], macros: MacroEvidence, body?: Node): void {
  for (const declarator of node.childrenForFieldName('declarator')) {
    const name = functionName(declarator)
    if (!name) continue
    const visibility = functionVisibility(name.text, node, prior, macros)
    result.declarations.push(declaration('function', name, name, visibility))
    if (!visibility) addDiagnostic(result, name, 'C_LINKAGE_UNCERTAIN',
      'A conditional declaration or unexpanded macro may change this function linkage; its outline entry is omitted.')
    addFunctionBody(result, node, name, macros, body)
  }
}

/** Containers may have guard/brace errors while their individual declarations remain valid. */
function declarationChildren(result: CSource, node: Node): Node[] | undefined {
  if (conditionTypes.has(node.type) || alternatives.has(node.type)) return node.namedChildren
  if (node.type !== 'linkage_specification' || node.childForFieldName('value')?.text !== '"C"') return
  if (node.hasError) addDiagnostic(result, node, 'C_PARSE_ERROR',
    'The C linkage wrapper has unsupported syntax; valid child declarations are analyzed independently.')
  const body = node.childForFieldName('body')
  if (!body) return []
  return body.type === 'declaration_list' ? body.namedChildren : [body]
}

/** The pinned parser inserts only a semicolon when a conditional branch holds a function header. */
function isConditionalSignature(node: Node): boolean {
  if (node.type !== 'declaration' || node.lastChild?.type !== ';' || !node.lastChild.isMissing) return false
  if (node.children.some(child => child.hasError && child.id !== node.lastChild!.id)) return false
  const declarators = node.childrenForFieldName('declarator')
  return declarators.length === 1 && !!functionName(declarators[0]!)
}

/** A branch has one signature group, or only directives; other content is not this source form. */
function signatureBranch(node: Node): Node[] | undefined {
  const excluded = ['name', 'condition', 'alternative'].map(field => node.childForFieldName(field)?.id)
  let signatures: Node[] = []
  for (const child of node.namedChildren.filter(child => !excluded.includes(child.id))) {
    if (['comment', 'preproc_call'].includes(child.type) && !child.hasError) continue
    const group = conditionTypes.has(child.type) ? conditionalSignatures(child) : isConditionalSignature(child) ? [child] : undefined
    if (!group || (group.length > 0 && signatures.length > 0)) return
    if (group.length) signatures = group
  }
  return signatures
}

function conditionalSignatures(node: Node): Node[] | undefined {
  if (node.children.some(child => child.isMissing)) return
  if (node.childForFieldName('condition')?.hasError || node.childForFieldName('name')?.hasError) return
  const first = signatureBranch(node)
  if (!first) return
  const alternative = node.childForFieldName('alternative')
  if (!alternative) return first.length ? undefined : []
  const other = alternative.type === 'preproc_else' ? signatureBranch(alternative) : conditionalSignatures(alternative)
  if (!other || Boolean(first.length) !== Boolean(other.length)) return
  return [...first, ...other]
}

/** The pinned parser inserts an empty consequence when #ifdef surrounds only an if header. */
function conditionalIfMarker(node: Node): boolean {
  if (node.type !== ';' || !node.isMissing) return false
  const empty = node.parent
  const header = empty?.parent
  const guard = header?.parent
  if (empty?.type !== 'expression_statement' || empty.childCount !== 1 || header?.type !== 'if_statement') return false
  if (header.childForFieldName('consequence')?.id !== empty.id
    || header.namedChildren.some(child => child.id !== empty.id && child.hasError)) return false
  if (guard?.type !== 'preproc_ifdef' || guard.childForFieldName('alternative') || guard.lastNamedChild?.id !== header.id) return false
  if (guard.children.some(child => child.isMissing) || guard.childForFieldName('name')?.hasError) return false
  const statement = guard.nextNamedSibling
  return statement?.type === 'expression_statement' && !statement.hasError
}

/** A guarded if/else may leave only its else keyword before the following physical statement. */
function conditionalElseMarker(node: Node): boolean {
  if (!node.isError || node.text !== 'else') return false
  const guard = node.parent
  const header = node.previousNamedSibling
  if (guard?.type !== 'preproc_ifdef' || guard.childForFieldName('alternative') || guard.lastNamedChild?.id !== node.id) return false
  if (guard.children.some(child => child.isMissing) || guard.childForFieldName('name')?.hasError) return false
  if (header?.type !== 'if_statement' || header.hasError || header.childForFieldName('alternative')) return false
  const statement = guard.nextNamedSibling
  return statement?.type === 'expression_statement' && !statement.hasError
}

function validFunctionBody(body: Node): boolean {
  const pending = [body]
  while (pending.length) {
    const node = pending.pop()!
    if (!node.hasError) continue
    if (node.isError || node.isMissing) {
      if (!conditionalIfMarker(node) && !conditionalElseMarker(node)) return false
    } else pending.push(...node.children)
  }
  return true
}

/** Each written signature remains a possible owner of the immediately following physical body. */
function addConditionalFunction(result: CSource, node: Node, body: Node | undefined, prior: StaticDeclaration[], macros: MacroEvidence): boolean {
  if (!conditionTypes.has(node.type) || body?.type !== 'compound_statement' || !validFunctionBody(body)) return false
  const signatures = conditionalSignatures(node)
  if (!signatures?.length) return false
  if (!validateMacros(result, body, macros)) return true
  for (const signature of signatures) {
    if (validateMacros(result, signature, macros)) addFunctions(result, signature, prior, macros, body)
  }
  return true
}

function validConditionalDefinition(node: Node): boolean {
  if (node.type !== 'function_definition') return false
  const body = node.childForFieldName('body')
  return !!body && node.children.every(child => child.id === body.id || !child.hasError) && validFunctionBody(body)
}

export function analyzeTree(file: string, root: Node, macros: MacroEvidence): CSource {
  const result: CSource = { file, declarations: [], operations: [], calls: [], diagnostics: [] }
  const prior: StaticDeclaration[] = []
  const pending = root.namedChildren.reverse()
  while (pending.length) {
    const node = pending.pop()!
    if (addConditionalFunction(result, node, pending.at(-1), prior, macros)) {
      pending.pop() // The shared body has been consumed by its possible function owners.
      continue
    }
    const children = declarationChildren(result, node)
    if (children) {
      pending.push(...children.reverse())
      continue
    }
    if (node.hasError && !validConditionalDefinition(node)) {
      addDiagnostic(result, node, 'C_PARSE_ERROR', 'Unsupported or invalid C syntax; this declaration contributes no evidence.')
      continue
    }
    if (validateMacros(result, node, macros)) addTopLevelDeclaration(result, node, prior, macros)
  }
  result.declarations.sort((left, right) => left.position - right.position)
  return result
}

function addTopLevelDeclaration(result: CSource, node: Node, prior: StaticDeclaration[], macros: MacroEvidence): void {
  if (node.type === 'function_definition' || node.type === 'declaration') addFunctions(result, node, prior, macros)
  if (node.type === 'declaration' || node.type === 'type_definition') {
    const type = node.childForFieldName('type')
    if (type) addType(result, type)
  } else addType(result, node)
}
