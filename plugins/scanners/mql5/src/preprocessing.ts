interface Token { text: string; start: number; end: number; line: number; directive: boolean }
interface Macro { functionLike: boolean; value: string[]; parameters: string[] }
type Macros = ReadonlyMap<string, Macro[]>
type Role = 'statement-or-declaration' | 'control-header' | 'parameter-alias' | 'member-operator' | 'member-prefix' | 'callable-header'
export interface MacroUse { start: number; end: number; line: number; name: string }
export interface Span extends MacroUse { role: Role }
export interface ScopeChange extends MacroUse { escapeDepth: number }
interface Invocation { first: Token; last: Token; after?: Token; close: number; variants: Macro[]; functionLike: boolean }

/** Tokens supply source boundaries only. Macro values and arguments are never evaluated. */
function tokens(text: string): Token[] {
  const result: Token[] = []
  const pattern = /\s+|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|(?<=^[ \t]*)#(?:[^\r\n\\]|\\(?:[ \t]*\/\/[^\r\n]*\r?\n|\r?\n|.))*|[\p{ID_Start}_][\p{ID_Continue}_]*|::|->|##|\S/gmu
  let line = 1
  for (const match of text.matchAll(pattern)) {
    const word = match[0]
    if (!/^\s|^\/\//.test(word) && !word.startsWith('/*')) {
      result.push({ text: word, start: match.index, end: match.index + word.length, line, directive: word.startsWith('#') })
    }
    line += (word.match(/\n/g) ?? []).length
  }
  return result
}

/** All selected definitions participate, including alternatives. No include or flag is resolved. */
export function definitions(inputs: string[]): Map<string, Macro[]> {
  const result = new Map<string, Macro[]>()
  for (const input of inputs) {
    for (const token of tokens(input)) {
      if (!token.directive) continue
      const match = /^#[ \t]*define[ \t]+([A-Za-z_]\w*)(\([^)]*\))?([\s\S]*)$/.exec(token.text)
      if (!match) continue
      const value = tokens(match[3]!.replace(/\\(?:[ \t]*\/\/[^\r\n]*)?\r?\n/g, ' ')).map(item => item.text)
      const existing = result.get(match[1]!) ?? []
      existing.push({ functionLike: !!match[2], value,
        parameters: (match[2] ?? '').slice(1, -1).split(',').map(word => word.trim()) })
      result.set(match[1]!, existing)
    }
  }
  return result
}

/** Inspect fixed identifier tokens around one formal, without constructing an expanded name. */
function pasteBoundary(operands: string[], parameters: string[]): { prefix: string; suffix: string } | undefined {
  if (!operands.every(word => /^[A-Za-z_]\w*$/.test(word))) return undefined
  const formals = operands.flatMap((word, index) => parameters.includes(word) ? [index] : [])
  if (formals.length !== 1) return undefined
  const prefix = operands.slice(0, formals[0]!).join('')
  const suffix = operands.slice(formals[0]! + 1).join('')
  return prefix || suffix ? { prefix, suffix } : undefined
}

function pasteChains(value: string[]): string[][] {
  const chains: string[][] = []
  for (let index = 0; index < value.length; index++) {
    if (value[index] !== '##') continue
    const operands = [value[index - 1] ?? '']
    while (value[index] === '##') {
      operands.push(value[index + 1] ?? '')
      index += 2
    }
    chains.push(operands)
  }
  return chains
}

function pastedNamesContained(item: Macro, macros: Macros, seen: Set<string>): boolean {
  for (const operands of pasteChains(item.value)) {
    const boundary = pasteBoundary(operands, item.parameters)
    if (!boundary) return false
    const { prefix, suffix } = boundary
    for (const name of macros.keys()) {
      // Empty arguments can produce the fixed prefix/suffix alone.
      const matches = name.length >= prefix.length + suffix.length && name.startsWith(prefix) && name.endsWith(suffix)
      if (matches && macroEscapeDepth(name, macros, seen) > 0) return false
    }
  }
  return true
}

/** Infinity means that source tokens cannot bound how many enclosing scopes can be escaped. */
function replacementEscapeDepth(item: Macro, macros: Macros, seen: Set<string>): number {
  if (!pastedNamesContained(item, macros, seen)) return Infinity
  const { value } = item
  let depth = 0
  let escaped = 0
  for (const word of value) {
    if (word === '{') depth++
    if (word === '}') depth--
    escaped = Math.max(escaped, -depth)
    if (macros.has(word) && macroEscapeDepth(word, macros, seen) > 0) return Infinity
  }
  return depth === 0 ? escaped : Infinity
}

function macroEscapeDepth(name: string, macros: Macros, seen = new Set<string>()): number {
  if (seen.has(name)) return Infinity
  const next = new Set([...seen, name])
  return Math.max(0, ...(macros.get(name) ?? []).map(item => replacementEscapeDepth(item, macros, next)))
}

/** Literal braces and contained selected names bound scope; no replacement is expanded. */
export function scopeChangingMacros(macros: Macros): ReadonlyMap<string, number> {
  const depths = [...macros.keys()].map(name => [name, macroEscapeDepth(name, macros)] as const)
  return new Map(depths.filter(([, depth]) => depth > 0))
}

function uncertainArguments(list: Token[], start: number, end: number, names: ReadonlyMap<string, number>): boolean {
  return list.slice(start, end).some(token => token.text === '{' || token.text === '}' || names.has(token.text))
}

/** Caller uncertainty does not require agreement about the invocation or placeholder shape. */
function recordUncertainCaller(item: Invocation | undefined, list: Token[], index: number, macros: Macros, names: ReadonlyMap<string, number>, result: ScopeChange[]): void {
  const first = list[index]!
  const potentiallyUsed = list[index + 1]?.text === '(' || macros.get(first.text)?.some(macro => !macro.functionLike)
  const escapeDepth = item && uncertainArguments(list, index + 1, item.close, names)
    ? Infinity : names.get(first.text) ?? 0
  if (potentiallyUsed && escapeDepth > 0) {
    result.push({ start: first.start, end: item?.last.end ?? first.end, line: first.line, name: first.text, escapeDepth })
  }
}

function closingParenthesis(list: Token[], index: number): number | undefined {
  let depth = 0
  for (let i = index; i < list.length; i++) {
    if (list[i]!.text === '(') depth++
    if (list[i]!.text === ')' && --depth === 0) return i
  }
}

function invocation(list: Token[], index: number, macros: Macros): Invocation | undefined {
  const first = list[index]!
  const variants = macros.get(first.text)
  if (!variants) return undefined
  const functionLike = variants.every(item => item.functionLike)
  const objectLike = variants.every(item => !item.functionLike)
  const close = functionLike && list[index + 1]?.text === '(' ? closingParenthesis(list, index + 1) : objectLike ? index : undefined
  return close === undefined ? undefined : { first, last: list[close]!, after: list[close + 1], close, variants, functionLike }
}

function tailCall(value: string[]): string | undefined {
  if (value.at(-1) !== ')') return undefined
  let depth = 0
  for (let i = value.length - 1; i >= 0; i--) {
    if (value[i] === ')') depth++
    if (value[i] === '(' && --depth === 0) return value[i - 1]
  }
}

/** Some source macros end in another selected macro that supplies the final semicolon. */
function completeMacro(name: string, macros: Macros, seen = new Set<string>()): boolean {
  if (seen.has(name)) return false
  const next = new Set([...seen, name])
  return macros.get(name)?.every(item => {
    if ([';', '}'].includes(item.value.at(-1) ?? '')) return true
    const tail = tailCall(item.value)
    return !!tail && completeMacro(tail, macros, next)
  }) ?? false
}

function wholeStatement(item: Invocation, macros: Macros, boundary: boolean, bracket?: string): boolean {
  if (!boundary || bracket === '(' || bracket === '[') return false
  if (item.after?.text === ';') return true
  const ends = !item.after || item.after.line > item.last.line || item.after.text === '}'
  return ends && completeMacro(item.first.text, macros)
}

/** Shared MQL/native headers wrap one written parameter; its resulting signature stays opaque. */
function sharedParameter(item: Macro): boolean {
  if (item.parameters.length !== 1) return false
  const parameter = item.parameters[0]!
  return [
    `& ${parameter}`, `* ${parameter}`, `& ${parameter} [ ]`,
    `extern __declspec ( dllexport ) ${parameter} __stdcall`,
    `extern "C" __declspec ( dllexport ) ${parameter} __stdcall`,
  ].includes(item.value.join(' '))
}

function parameterAlias(item: Macro): boolean {
  const parameter = (word: string | undefined) => word !== undefined && item.parameters.includes(word)
  return item.value.length === 1 && parameter(item.value[0])
    || item.value.length === 3 && parameter(item.value[0]) && item.value[1] === '::' && parameter(item.value[2])
}

function memberPrefix(item: Macro): boolean {
  return !item.value.length || item.value.length === 2 && item.value[0] === 'this' && ['.', '->'].includes(item.value[1]!)
}

function callableHeader(item: Macro): boolean {
  const shape = /^virtual bool [A-Za-z_]\w* ## ([A-Za-z_]\w*) \( string & [A-Za-z_]\w* \)$/.exec(item.value.join(' '))
  return item.parameters.length === 1 && shape?.[1] === item.parameters[0]
}

function role(item: Invocation, macros: Macros, boundary: boolean, bracket?: string): Role | undefined {
  if (wholeStatement(item, macros, boundary, bracket)) return 'statement-or-declaration'
  if (item.functionLike) {
    if (boundary && item.after?.text === '{' && item.variants.every(callableHeader)) return 'callable-header'
    if (item.variants.every(macro => ['if', 'for', 'while', 'switch'].includes(tailCall(macro.value) ?? ''))) return 'control-header'
    if (item.variants.every(macro => parameterAlias(macro) || sharedParameter(macro))) return 'parameter-alias'
  } else {
    if (item.variants.every(macro => macro.value.length === 1 && ['.', '->'].includes(macro.value[0]!))) return 'member-operator'
    if (item.variants.every(memberPrefix)) return 'member-prefix'
  }
}

const placeholders: Record<Role, string> = {
  'statement-or-declaration': ';', 'control-header': 'if(0)', 'parameter-alias': '_', 'member-operator': '.', 'member-prefix': '',
  'callable-header': 'void _()',
}

/** Replace only non-newline UTF-16 units. Every later source position remains identical. */
function replace(chars: string[], span: Span, file: string): void {
  const placeholder = placeholders[span.role]
  const width = chars.slice(span.start, span.end).filter(char => char !== '\n' && char !== '\r').length
  if (width < placeholder.length) throw new Error(`MQL5_MACRO_SPAN_TOO_SHORT: ${file}:${span.line}: ${span.name}: cannot preserve this macro span`)
  let next = 0
  for (let i = span.start; i < span.end; i++) {
    if (chars[i] !== '\n' && chars[i] !== '\r') chars[i] = placeholder[next++] ?? ' '
  }
}

function advanceBrackets(brackets: string[], word: string): void {
  if (['(', '[', '{'].includes(word)) brackets.push(word)
  if ([')', ']', '}'].includes(word)) brackets.pop()
}

function statementBoundary(word: string, previous?: string): boolean {
  return [';', '{', '}'].includes(word) || word === ':' && ['public', 'private', 'protected'].includes(previous ?? '')
}

/** Placeholders are parser punctuation, never evidence. Every replaced span stays explicitly opaque. */
export function normalize(source: string, macros: Macros, uncertainMacros: ReadonlyMap<string, number>, file: string): { text: string; spans: Span[]; uncertainCallers: ScopeChange[] } {
  const list = tokens(source)
  const chars = source.split('')
  const spans: Span[] = []
  const uncertainCallers: ScopeChange[] = []
  const brackets: string[] = []
  let boundary = true
  for (let i = 0; i < list.length; i++) {
    const token = list[i]!
    if (token.directive) { boundary = true; continue }
    const item = invocation(list, i, macros)
    recordUncertainCaller(item, list, i, macros, uncertainMacros, uncertainCallers)
    const kind: Role | undefined = item && role(item, macros, boundary, brackets.at(-1))
    if (item && kind) {
      const semicolon = kind === 'statement-or-declaration' && item.after?.text === ';'
      const span: Span = { start: token.start, end: semicolon ? item.after!.end : item.last.end,
        line: token.line, name: token.text, role: kind }
      replace(chars, span, file)
      spans.push(span)
      i = item.close + (semicolon ? 1 : 0)
      boundary = kind === 'statement-or-declaration'
      continue
    }
    advanceBrackets(brackets, token.text)
    boundary = statementBoundary(token.text, list[i - 1]?.text)
  }
  return { text: chars.join(''), spans, uncertainCallers }
}
