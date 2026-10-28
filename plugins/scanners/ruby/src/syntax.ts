import type { Node } from 'web-tree-sitter'

/** Decode only unambiguous source literals; Ruby interpolation is handled separately. */
export function literal(node: Node | null | undefined): string | undefined {
  if (!node) return undefined
  if (node.type === 'simple_symbol') return node.text.slice(1)
  if (node.type === 'bare_symbol') return node.namedChildren.every(child => child.type === 'string_content') ? node.text : undefined
  if (node.type !== 'string' || node.namedChildren.some(child => child.type === 'interpolation')) return undefined
  const raw = node.text.slice(1, -1)
  if (node.text.startsWith("'")) return raw.replace(/\\([\\'])/g, '$1')
  if (!raw.includes('\\')) return raw
  try { return JSON.parse(`"${raw}"`) as string } catch { return undefined }
}

export function literalList(node: Node | null | undefined): string[] | undefined {
  if (!node || !['array', 'symbol_array', 'string_array'].includes(node.type)) return undefined
  const values = node.namedChildren.map(child => child.type === 'bare_string' ? child.text : literal(child))
  return values.every((value): value is string => value !== undefined) ? values : undefined
}

export function argumentsOf(node: Node): Node[] {
  return node.childForFieldName('arguments')?.namedChildren ?? []
}

export function statements(node: Node): Node[] {
  return node.childForFieldName('body')?.namedChildren ?? []
}

/** Named local bindings; defaults and annotations are values rather than parameter names. */
export function parameterNames(node: Node | null): string[] {
  return (node?.namedChildren ?? []).flatMap(parameter => {
    if (parameter.type === 'identifier') return [parameter.text]
    const name = parameter.childForFieldName('name')
    return name?.type === 'identifier' ? [name.text] : []
  })
}

