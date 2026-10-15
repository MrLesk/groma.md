import type { ScanDiagnostic, ScanEntryPoint, ScanInvocation, ScanOperation } from '@groma/scanner'
import { id, topLevel, type Callable, type Declarations } from './declarations.ts'
import { children, conditionalKinds, field, typeKinds, touches, type Source, type Syntax } from './syntax.ts'

function opaqueStatement(node: Syntax, source: Source): boolean {
  const statement = node.type.endsWith('_statement') && node.type !== 'compound_statement'
  return (statement || node.type === 'declaration') && touches(source, node.startIndex, node.endIndex)
}

function opaqueMacro(file: string, line: number, name: string, role: string): ScanDiagnostic {
  return { severity: 'info', code: 'MQL5_OPAQUE_MACRO', file, line,
    message: `${name}: selected macro ${role} is opaque. Dependent declarations, visibility and calls are omitted; arguments are not evaluated.` }
}

/** A call built from an opaque macro result has no independent callee evidence. */
function macroCallee(node: Syntax, source: Source): Syntax | undefined {
  const target = node.type === 'call_expression' ? field(node, 'function') : undefined
  if (target && source.macros.has(target.text)) return target
  const parts = target ? [target] : children(node)
  return parts.map(child => macroCallee(child, source)).find(Boolean)
}

/** Nested function/type bodies and unevaluated preprocessing branches do not belong to an outer caller. */
function calls(node: Syntax, operation: string, result: ScanInvocation[], source: Source, diagnostics: ScanDiagnostic[]): void {
  if (opaqueStatement(node, source)) return
  const macro = node.type === 'call_expression' && macroCallee(node, source)
  if (macro) {
    diagnostics.push(opaqueMacro(source.file, macro.startPosition.row + 1, macro.text, 'invocation'))
    return
  }
  if (conditionalKinds.has(node.type) || typeKinds.has(node.type) || ['lambda_expression', 'function_definition'].includes(node.type)) return
  // The C++ base grammar represents primitive conversions as call expressions.
  const invocation = node.type === 'call_expression' && field(node, 'function')?.type !== 'primitive_type'
  if (invocation || node.type === 'new_expression') {
    const target = field(node, 'function')
    const member = target?.type === 'field_expression' ? field(target, 'field')?.text : undefined
    result.push({ source: operation, targets: [], unresolved: true, position: node.startIndex,
      line: node.startPosition.row + 1, ...(member ? { member } : {}) })
  }
  for (const child of children(node)) calls(child, operation, result, source, diagnostics)
}

function uncertainEntry(file: Declarations, nodes: Syntax[]): boolean {
  // A removed declaration can hide a competing handler; a global macro can generate one.
  if (file.diagnostics.length || file.source.uncertainCallers.length || nodes.some(node => conditionalKinds.has(node.type))) return true
  return file.source.tree.rootNode.children.some(node => node !== null
    && touches(file.source, node.startIndex, field(node, 'body')?.startIndex ?? node.endIndex))
}

function excludesEntry(node: Syntax, source: Source): boolean {
  if (node.type !== 'preproc_call' || field(node, 'directive')?.text !== '#property') return false
  const property = (field(node, 'argument')?.text ?? '').trim().split(/\s+/, 1)[0] ?? ''
  return /^(library|indicator_)/.test(property) || source.macros.has(property)
}

function executionEntry(file: Declarations): ScanEntryPoint[] {
  if (!file.source.file.endsWith('.mq5')) return []
  const nodes = topLevel(file.source)
  if (uncertainEntry(file, nodes) || nodes.some(node => excludesEntry(node, file.source))) return []
  const candidates = file.functions.filter(fn => ['OnStart', 'OnTick'].includes(fn.name.text))
  const definitions = candidates.filter(fn => fn.body)
  const entry = definitions.length === 1 && candidates.every(fn => handler(fn, file.source)) ? definitions[0] : undefined
  return entry ? [{ file: file.source.file, declaration: file.source.file,
    name: file.source.file.split('/').at(-1)!.replace(/\.mq5$/, ''), files: [file.source.file] }] : []
}

/** MQL5 names alone do not identify handlers: their complete parameter and result types must match. */
function handler(fn: Callable, source: Source): boolean {
  if (fn.node.parent?.type !== 'translation_unit') return false
  const result = field(fn.node, 'type')?.text
  if (source.macros.has(result ?? '')) return false
  if (result !== 'void' && !(result === 'int' && fn.name.text === 'OnStart')) return false
  const list = field(fn.declarator, 'parameters')!
  const parameters = children(list).filter(node => node.type !== 'comment')
  if (parameters.length === 0) return true
  const parameter = parameters[0]!
  const types = children(parameter).filter(node => node.type !== 'comment')
  return parameters.length === 1 && parameter.type === 'parameter_declaration'
    && types.length === 1 && types[0]!.type === 'primitive_type' && types[0]!.text === 'void' && !source.macros.has('void')
}

function directives(node: Syntax, file: string, result: ScanDiagnostic[]): void {
  if (['preproc_def', 'preproc_function_def'].includes(node.type) && /\\[ \t]*\/\/[^\r\n]*\r?\n/.test(node.text)) {
    result.push({ severity: 'info', code: 'MQL5_OBSERVED_MACRO_CONTINUATION', file, line: node.startPosition.row + 1,
      message: 'Backslash-before-comment continuation is retained as opaque macro source. Compiler acceptance is unverified; generated declarations and calls are not inferred.' })
  }
  if (node.type === 'event_map') {
    result.push({ severity: 'info', code: 'MQL5_OPAQUE_EVENT_MAP', file, line: node.startPosition.row + 1,
      message: 'The standard-library event map is opaque. Generated members and callback calls are not inferred.' })
    return
  }
  if (conditionalKinds.has(node.type)) {
    result.push({ severity: 'info', code: 'MQL5_CONDITIONAL_SOURCE', file, line: node.startPosition.row + 1,
      message: 'Conditional compilation is not evaluated. Declarations and calls in this branch are omitted.' })
    return
  }
  if (node.type === 'preproc_include') result.push({ severity: 'info', code: 'MQL5_INCLUDE_NOT_EXPANDED', file,
    line: node.startPosition.row + 1, message: 'Includes are not expanded. Only independently selected source files are analyzed; entry membership contains the entry file only.' })
  for (const child of children(node)) directives(child, file, result)
}

function uncertainCaller(body: Syntax, source: Source): ScanDiagnostic | undefined {
  const macro = source.uncertainCallers.find(use => body.startIndex <= use.start && use.start < body.endIndex)
  if (!macro) return undefined
  return { severity: 'info', code: 'MQL5_UNCERTAIN_CALLER', file: source.file, line: macro.line,
    message: `${macro.name}: selected macro tokens may change the enclosing scope. This literal operation is retained, but its body calls are omitted because their caller is unproven.` }
}

export function evidence(file: Declarations) {
  const operations: ScanOperation[] = []
  const invocations: ScanInvocation[] = []
  const diagnostics = [...file.diagnostics, ...file.source.opaque.map(span => opaqueMacro(file.source.file, span.line, span.name, span.role))]
  for (const fn of [...file.functions, ...file.methods]) {
    if (!fn.body) continue
    const operation = id(file.source.file, fn.node)
    operations.push({ id: operation, file: file.source.file, name: fn.owner ? `${fn.owner}::${fn.name.text}` : fn.name.text,
      position: fn.node.startIndex })
    const uncertainty = uncertainCaller(fn.body, file.source)
    if (uncertainty) diagnostics.push(uncertainty)
    else calls(fn.body, operation, invocations, file.source, diagnostics)
  }
  for (const node of topLevel(file.source)) directives(node, file.source.file, diagnostics)
  return { operations, invocations, diagnostics, entryPoints: executionEntry(file) }
}
