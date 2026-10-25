import type { HttpRequestSegment } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { argumentsOf, literal, parameterNames } from './syntax.ts'

export type Bindings = Map<string, Node[]>
export type UrlPart = string | { kind: 'configured' | 'dynamic' | 'unknown' }
const unknown = (): UrlPart[] => [{ kind: 'unknown' }]
const definitions = new Set(['method', 'singleton_method', 'class', 'module', 'singleton_class', 'lambda'])

export function walk(node: Node, inspect: (node: Node) => void, enterDefinitions = false): void {
  inspect(node)
  for (const child of node.namedChildren) {
    if (!enterDefinitions && definitions.has(child.type)) continue
    walk(child, inspect, enterDefinitions)
  }
}

export function enclosingType(node: Node): Node {
  let parent = node.parent
  while (parent) {
    if (parent.type === 'class' || parent.type === 'module') return parent
    parent = parent.parent
  }
  return node.tree.rootNode
}

function addBinding(bindings: Bindings, name: string, value: Node): void {
  bindings.set(name, [...bindings.get(name) ?? [], value])
}

function collectAssignments(root: Node, bindings: Bindings, kinds: Set<string>, enterDefinitions: boolean,
  accept: (node: Node) => boolean = () => true): void {
  walk(root, node => {
    if (!accept(node)) return
    if (node.type !== 'assignment' && node.type !== 'operator_assignment') return
    const left = node.childForFieldName('left')
    const right = node.childForFieldName('right')
    if (left && right && kinds.has(left.type)) addBinding(bindings, left.text, node.type === 'assignment' ? right : node)
    if (left) recordMutation(left, node, bindings, kinds)
  }, enterDefinitions)
}

function recordMutation(left: Node, assignment: Node, bindings: Bindings, kinds: Set<string>): void {
  if (left.type !== 'call') return
  const property = left.childForFieldName('method')?.text
  const receiver = left.childForFieldName('receiver')
  if (receiver && kinds.has(receiver.type) && ['path', 'host', 'scheme', 'port', 'url_prefix'].includes(property ?? '')) {
    addBinding(bindings, receiver.text, assignment)
  }
}

export function methodBindings(root: Node, method: Node): Bindings {
  const result: Bindings = new Map()
  const scopes: Node[] = []
  let parent = method.parent
  while (parent) {
    if (parent.type === 'class' || parent.type === 'module') scopes.unshift(parent)
    parent = parent.parent
  }
  for (const scope of [root, ...scopes]) {
    const constants: Bindings = new Map()
    collectAssignments(scope, constants, new Set(['constant', 'scope_resolution']), false)
    for (const [name, values] of constants) result.set(name, values)
  }
  const type = enclosingType(method)
  collectAssignments(type, result, new Set(['instance_variable']), true,
    node => enclosingType(node).id === type.id && singletonContext(node) === singletonContext(method))
  for (const name of parameterNames(method.childForFieldName('parameters'))) result.set(name, [method])
  const body = method.childForFieldName('body')
  if (body) collectAssignments(body, result, new Set(['identifier']), false)
  return result
}

function singletonContext(node: Node): boolean {
  let current: Node | null = node
  let method = false
  while (current) {
    if (current.type === 'singleton_method' || current.type === 'singleton_class') return true
    if (current.type === 'method') method = true
    if (current.type === 'class' || current.type === 'module') break
    current = current.parent
  }
  return !method
}

/** At most eight immutable aliases; ambiguity and exhausted paths remain unresolved. */
export function resolveValue(node: Node, bindings: Bindings, depth = 0): Node | undefined {
  if (depth >= 8) return undefined
  if (!bindings.has(node.text)) return node
  const values = bindings.get(node.text)!
  return values.length === 1 ? resolveValue(values[0]!, bindings, depth + 1) : undefined
}

export function urlValue(node: Node | undefined | null, bindings: Bindings, depth = 0): UrlPart[] {
  if (!node || depth >= 8) return unknown()
  if (bindings.has(node.text)) {
    const values = bindings.get(node.text)!
    return values.length === 1 ? urlValue(values[0], bindings, depth + 1) : unknown()
  }
  const text = literal(node)
  if (text !== undefined) return [text]
  if (node.type === 'integer') return [node.text]
  if (node.type === 'string') return interpolated(node, bindings, depth)
  if (node.type === 'binary' && node.childForFieldName('operator')?.text === '+') {
    return [...urlValue(node.childForFieldName('left'), bindings, depth + 1),
      ...urlValue(node.childForFieldName('right'), bindings, depth + 1)]
  }
  if (node.type === 'element_reference' && node.childForFieldName('object')?.text === 'ENV') return [{ kind: 'configured' }]
  if (node.type === 'call') return callValue(node, bindings, depth)
  return unknown()
}

function interpolated(node: Node, bindings: Bindings, depth: number): UrlPart[] {
  return node.namedChildren.flatMap(child => {
    if (child.type === 'string_content') return [child.text]
    if (child.type !== 'interpolation' || child.namedChildCount !== 1) return unknown()
    const parts = urlValue(child.namedChildren[0], bindings, depth + 1)
    return parts.every(part => typeof part === 'string') ? parts : [{ kind: 'dynamic' }]
  })
}

function callValue(node: Node, bindings: Bindings, depth: number): UrlPart[] {
  const receiver = node.childForFieldName('receiver')
  const name = node.childForFieldName('method')?.text
  const args = argumentsOf(node)
  if (receiver?.text === 'ENV' && ['fetch', '[]'].includes(name ?? '')) return [{ kind: 'configured' }]
  if (receiver?.text.startsWith('Rails.configuration') || receiver?.text === 'Rails.application.credentials') return [{ kind: 'configured' }]
  if ((!receiver && name === 'URI') || (receiver?.text === 'URI' && name === 'parse')) return urlValue(args[0], bindings, depth + 1)
  if (receiver?.text === 'URI' && name === 'join') return joined(args, bindings, depth)
  if (receiver && ['request_uri', 'path'].includes(name ?? '')) return urlValue(receiver, bindings, depth + 1)
  return unknown()
}

function joined(args: Node[], bindings: Bindings, depth: number): UrlPart[] {
  if (args.length !== 2) return unknown()
  const base = urlValue(args[0], bindings, depth + 1)
  const suffix = urlValue(args[1], bindings, depth + 1)
  if (base[0] && typeof base[0] !== 'string' && base[0].kind === 'configured') return [...base, ...suffix]
  if (base.length === 1 && suffix.length === 1 && typeof base[0] === 'string' && typeof suffix[0] === 'string') {
    try { return [new URL(suffix[0], base[0]).href] } catch { return unknown() }
  }
  return [...base, ...suffix]
}

export function hostBase(parts: UrlPart[]): UrlPart[] {
  return typeof parts[0] !== 'string' && parts[0]?.kind === 'configured' ? [{ kind: 'configured' }] : unknown()
}

function merged(parts: UrlPart[]): UrlPart[] {
  const result: UrlPart[] = []
  for (const part of parts) {
    const last = result[result.length - 1]
    if (typeof last === 'string' && typeof part === 'string') result[result.length - 1] = last + part
    else result.push(part)
  }
  return result
}

function segment(parts: UrlPart[]): HttpRequestSegment {
  if (parts.every(part => typeof part === 'string')) {
    return { kind: 'literal', value: parts.join('').replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@%]/gu, char => encodeURIComponent(char)) }
  }
  return parts.length === 1 ? { kind: 'dynamic' } : { kind: 'unknown' }
}

export function requestPath(input: UrlPart[]): { configured?: boolean; path: HttpRequestSegment[] } {
  const parts = merged(input)
  const configured = typeof parts[0] !== 'string' && parts[0]?.kind === 'configured'
  if (configured) parts.shift()
  const first = parts[0]
  let prefix: HttpRequestSegment[] = []
  if (typeof first !== 'string' && first?.kind === 'unknown' && parts.length > 1) {
    return { path: [{ kind: 'unknown' }, ...pathParts(parts.slice(1))] }
  }
  if (typeof first === 'string' && /^(?:[a-z]+:)?\/\//i.test(first)) {
    parts[0] = first.replace(/^(?:[a-z]+:)?\/\/[^/]*(.*)$/i, '$1')
    prefix = [{ kind: 'unknown' }]
  } else if (typeof first !== 'string' || !first.startsWith('/')) {
    return { path: [{ kind: 'unknown' }] }
  }
  const path = pathParts(parts)
  return { ...(configured && !prefix.length ? { configured: true } : {}), path: [...prefix, ...path] }
}

function pathParts(parts: UrlPart[]): HttpRequestSegment[] {
  const path: HttpRequestSegment[] = []
  let current: UrlPart[] = []
  function flush() {
    if (current.length) path.push(segment(current))
    current = []
  }
  for (const part of parts) {
    if (typeof part !== 'string') { current.push(part); continue }
    const end = part.search(/[?#]/)
    const text = end < 0 ? part : part.slice(0, end)
    const pieces = text.split('/')
    pieces.forEach((piece, index) => {
      if (index) flush()
      if (piece) current.push(piece)
    })
    if (end >= 0) break
  }
  flush()
  return path
}

