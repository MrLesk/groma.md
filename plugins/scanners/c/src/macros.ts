import type { Node, Parser } from 'web-tree-sitter'

export interface MacroEvidence {
  names: ReadonlySet<string>
  neutralPrefixes: ReadonlySet<string>
  neutralTypes: ReadonlySet<string>
  neutralAnnotations: ReadonlySet<string>
  objectNames: ReadonlySet<string>
  scopeNeutral: ReadonlySet<string>
}

const neutralStorage = new Set(['extern', 'inline', '__inline', '__inline__', '__forceinline'])
const probeName = 'groma_macro_probe'

function neutralModifier(node: Node): boolean {
  return ['comment', 'attribute_specifier', 'ms_declspec_modifier', 'ms_call_modifier'].includes(node.type)
    || (node.type === 'storage_class_specifier' && neutralStorage.has(node.text))
}

function probeTypeMatches(type: Node, insertedType: boolean, aliases: ReadonlySet<string>): boolean {
  return insertedType ? type.text === 'int' : type.type === 'type_identifier' && aliases.has(type.text)
}

/** A modifier may occur before a type or in the calling-convention position after it. */
function neutralReplacement(parser: Parser, replacement: string, aliases: ReadonlySet<string>): boolean {
  const probes = [
    { source: `${replacement}\nint ${probeName}(void);`, insertedType: true },
    { source: `int\n${replacement}\n${probeName}(void);`, insertedType: true },
    { source: `${replacement}\n${probeName}(void);`, insertedType: false },
  ]
  return probes.some(probe => {
    const tree = parser.parse(probe.source)
    try {
      if (!tree || tree.rootNode.hasError) return false
      const declarations = tree.rootNode.namedChildren.filter(node => node.type !== 'comment')
      if (declarations.length !== 1 || declarations[0]!.type !== 'declaration') return false
      const declaration = declarations[0]!
      const type = declaration.childForFieldName('type')
      const declarator = declaration.childrenForFieldName('declarator').find(node => node.type === 'function_declarator')
      if (!type || declarator?.text !== `${probeName}(void)`) return false
      if (!probeTypeMatches(type, probe.insertedType, aliases)) return false
      return declaration.namedChildren.filter(node => node.id !== type.id && node.id !== declarator.id).every(node =>
        neutralModifier(node) || (node.type === 'macro_specifier' && aliases.has(node.text)))
    } finally { tree?.delete() }
  })
}

/** The single formal stays a type; only independently proven modifiers may surround it. */
function neutralTypeReplacement(parser: Parser, definition: Node, modifiers: ReadonlySet<string>): boolean {
  const parameters = definition.childForFieldName('parameters')
  if (parameters?.namedChildCount !== 1 || parameters.children.some(node => node.type === '...')) return false
  const formal = parameters.namedChild(0)!.text
  const replacement = definition.childForFieldName('value')?.text ?? ''
  const tree = parser.parse(`void ${probeName}(${replacement});`)
  try {
    if (!tree || tree.rootNode.hasError) return false
    const declarations = tree.rootNode.namedChildren.filter(node => node.type !== 'comment')
    if (declarations.length !== 1 || declarations[0]!.type !== 'declaration') return false
    const declarator = declarations[0]!.childForFieldName('declarator')
    if (declarator?.childForFieldName('declarator')?.text !== probeName) return false
    const probeParameters = declarator.childForFieldName('parameters')?.namedChildren
    if (probeParameters?.length !== 1 || probeParameters[0]!.type !== 'parameter_declaration') return false
    const parameter = probeParameters[0]!
    const type = parameter.childForFieldName('type')
    if (type?.text !== formal) return false
    return parameter.namedChildren.filter(node => node.id !== type.id).every(node => neutralModifier(node)
      || (node.type === 'identifier' && node.text !== formal && modifiers.has(node.text)))
  } finally { tree?.delete() }
}

/** Add only proven aliases. Cycles and any unproven alternative can never enter the set. */
function neutralObjectMacros(definitions: ReadonlyMap<string, readonly Node[]>, parser: Parser): Set<string> {
  const proven = new Set<string>()
  let changed = true
  while (changed) {
    changed = false
    for (const [name, nodes] of definitions) {
      if (proven.has(name)) continue
      if (!nodes.every(node => node.type === 'preproc_def' && !node.hasError
        && neutralReplacement(parser, node.childForFieldName('value')?.text ?? '', proven))) continue
      proven.add(name)
      changed = true
    }
  }
  return proven
}

const identifierToken = /^[A-Za-z_][A-Za-z_0-9]*$/

// Read replacement tokens independently of parser recovery, which may omit tokens in invalid fragments.
const scopeLexeme = /\s+|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|(?:u8|[uUL])?"(?:\\[^\r\n]|[^"\\\r\n])*"|(?:u8|[uUL])?'(?:\\[^\r\n]|[^'\\\r\n])*'|(?:[0-9]|\.[0-9])(?:[eEpP][+-]|[A-Za-z_0-9.])*|[A-Za-z_][A-Za-z_0-9]*|./gy

/** This reader proves only brace boundaries; it does not expand or evaluate a macro. */
function scopeTokens(definition: Node): string[] | undefined {
  if (definition.hasError) return
  const replacement = (definition.childForFieldName('value')?.text ?? '').replaceAll(/\\\r?\n/g, '')
  const tokens: string[] = []
  // Each invocation owns its cursor. Scans can run concurrently.
  const reader = new RegExp(scopeLexeme)
  for (const match of replacement.matchAll(reader)) {
    const token = match[0]
    // An unclosed comment or literal cannot establish scope.
    if (token === '"' || token === "'" || (token === '/' && replacement[match.index + 1] === '*')) return
    if (/^\s/.test(token) || token.startsWith('//') || token.startsWith('/*') || /^(?:u8|[uUL])?["']/.test(token)) continue
    tokens.push(token)
  }
  return tokens
}

function balancedBraces(tokens: readonly string[]): boolean {
  let depth = 0
  for (const token of tokens) {
    if (token === '{') depth++
    if (token === '}') depth--
    if (depth < 0) return false
  }
  return depth === 0
}

/** A fixed prefix/suffix bounds possible selected names without substituting an actual argument. */
function scopeNeutralPasteEnd(tokens: readonly string[], start: number, formals: ReadonlySet<string>,
  pasteIsSafe: (prefix: string, suffix: string) => boolean): number | undefined {
  const parts = [tokens[start]!]
  let last = start
  while (tokens[last + 1] === '#' && tokens[last + 2] === '#') {
    const part = tokens[last + 3]
    if (!part || !identifierToken.test(part)) return
    parts.push(part)
    last += 3
  }
  if (!parts.every(part => identifierToken.test(part))) return
  const formal = parts.findIndex(part => formals.has(part))
  if (formal < 0 || parts.filter(part => formals.has(part)).length !== 1) return
  const prefix = parts.slice(0, formal).join('')
  const suffix = parts.slice(formal + 1).join('')
  if ((!prefix && !suffix) || !pasteIsSafe(prefix, suffix)) return
  return last
}

function scopeReferences(tokens: readonly string[], formals: ReadonlySet<string>, referenceIsSafe: (name: string, index: number) => boolean,
  pasteIsSafe: (prefix: string, suffix: string) => boolean): boolean {
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]!
    if (tokens[index + 1] === '#' && tokens[index + 2] === '#') {
      const last = scopeNeutralPasteEnd(tokens, index, formals, pasteIsSafe)
      if (last === undefined) return false
      index = last
      continue
    }
    if (token === '#') {
      // Stringifying one formal cannot change scope.
      if (!formals.has(tokens[++index] ?? '')) return false
      continue
    }
    if (!referenceIsSafe(token, index)) return false
  }
  return true
}

function macroArgumentBraces(tokens: readonly string[], start: number): boolean {
  let depth = 1
  for (let index = start + 2; index < tokens.length; index++) {
    const token = tokens[index]!
    if (token === '{' || token === '}') return true
    if (token === '(') depth++
    if (token === ')' && --depth === 0) return false
  }
  return true
}

/** Every selected variant must preserve its surrounding brace boundary; aliases cannot hide a scope change. */
function scopeNeutralMacros(definitions: ReadonlyMap<string, readonly Node[]>): Set<string> {
  const replacements = new Map([...definitions].map(([name, nodes]) => [name, nodes.map(node => ({
    tokens: scopeTokens(node),
    formals: new Set(node.childForFieldName('parameters')?.namedChildren.map(parameter => parameter.text)),
  }))]))
  const results = new Map<string, boolean>()
  const visiting = new Set<string>()
  function prove(name: string): boolean {
    if (results.has(name)) return results.get(name)!
    if (visiting.has(name)) return false
    visiting.add(name)
    const safe = replacements.get(name)!.every(replacement => replacement.tokens && balancedBraces(replacement.tokens) && scopeReferences(replacement.tokens,
      replacement.formals, (reference, index) => {
        if (replacement.formals.has(reference) || !definitions.has(reference)) return true
        const called = replacement.tokens![index + 1] === '('
        return (!called || !macroArgumentBraces(replacement.tokens!, index)) && prove(reference)
      }, (prefix, suffix) => [...definitions.keys()].filter(candidate => candidate.startsWith(prefix)
        && candidate.endsWith(suffix) && candidate.length >= prefix.length + suffix.length).every(prove)))
    visiting.delete(name)
    results.set(name, safe)
    return safe
  }
  return new Set([...definitions.keys()].filter(prove))
}

/** All selected alternatives must agree; there is no active configuration or recursive expansion. */
export function collectMacros(roots: readonly Node[], parser: Parser): MacroEvidence {
  const definitions = new Map<string, Node[]>()
  const pending = [...roots]
  while (pending.length) {
    const node = pending.pop()!
    if (node.type === 'preproc_def' || node.type === 'preproc_function_def') {
      const name = node.childForFieldName('name')?.text
      if (name) definitions.set(name, [...definitions.get(name) ?? [], node])
      continue
    }
    pending.push(...node.namedChildren)
  }
  const neutralPrefixes = neutralObjectMacros(definitions, parser)
  const neutralTypes = new Set([...definitions].filter(([, nodes]) => nodes.every(node =>
    node.type === 'preproc_function_def' && !node.hasError && neutralTypeReplacement(parser, node, neutralPrefixes)))
    .map(([name]) => name))
  const neutralAnnotations = new Set([...definitions].filter(([, nodes]) => nodes.every(node =>
    node.type === 'preproc_function_def' && !node.hasError
    && neutralReplacement(parser, node.childForFieldName('value')?.text ?? '', neutralPrefixes))).map(([name]) => name))
  const objectNames = new Set([...definitions].filter(([, nodes]) => nodes.some(node => node.type === 'preproc_def')).map(([name]) => name))
  return { names: new Set(definitions.keys()), neutralPrefixes, neutralTypes, neutralAnnotations, objectNames,
    scopeNeutral: scopeNeutralMacros(definitions) }
}
