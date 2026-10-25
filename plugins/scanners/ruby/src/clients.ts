import type { ScanHttpRequest, ScanOperation } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { hostBase, methodBindings, requestPath, resolveValue, urlValue, walk, type Bindings, type UrlPart } from './http-values.ts'
import { requiredLiteral } from './projects.ts'
import { argumentsOf, literal, parameterNames } from './syntax.ts'

interface Client {
  kind: 'net-class' | 'net-session' | 'faraday' | 'httparty'
  base: UrlPart[]
}

const verbs = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options'])
const requestClasses = new Map(['Get', 'Post', 'Put', 'Patch', 'Delete', 'Head', 'Options'].map(name => [`Net::HTTP::${name}`, name.toUpperCase()]))

function directClient(receiver: Node, imports: Set<string>, bindings: Bindings): Client | undefined {
  const resolved = resolveValue(receiver, bindings)
  if (!resolved) return undefined
  if (resolved.text === 'Net::HTTP' && imports.has('net/http')) return { kind: 'net-class', base: [] }
  if (resolved.text === 'Faraday' && imports.has('faraday')) return { kind: 'faraday', base: [] }
  if (resolved.text === 'HTTParty' && imports.has('httparty')) return { kind: 'httparty', base: [] }
  if (resolved.type !== 'call' || resolved.childForFieldName('method')?.text !== 'new') return undefined
  const producer = resolved.childForFieldName('receiver')
  const args = argumentsOf(resolved)
  if (producer?.text === 'Net::HTTP' && imports.has('net/http')) {
    return { kind: 'net-session', base: hostBase(urlValue(args[0], bindings)) }
  }
  if (producer?.text !== 'Faraday' || !imports.has('faraday')) return undefined
  const url = args.find(arg => arg.childForFieldName('key')?.text === 'url')
  return { kind: 'faraday', base: args.length ? urlValue(url?.childForFieldName('value') ?? args[0], bindings) : [] }
}

/** A block parameter belongs to its own producer; an unrelated block cannot inherit a client's identity. */
function blockClient(receiver: Node, call: Node, imports: Set<string>, bindings: Bindings): Client | undefined | null {
  let parent = call.parent
  while (parent && !['method', 'singleton_method'].includes(parent.type)) {
    if (['block', 'do_block'].includes(parent.type) && parameterNames(parent.childForFieldName('parameters')).includes(receiver.text)) {
      const producer = parent.parent
      if (producer?.type !== 'call' || producer.childForFieldName('method')?.text !== 'start') return null
      if (producer.childForFieldName('receiver')?.text !== 'Net::HTTP' || !imports.has('net/http')) return null
      return { kind: 'net-session', base: hostBase(urlValue(argumentsOf(producer)[0], bindings)) }
    }
    parent = parent.parent
  }
  return undefined
}

function requestConstructor(node: Node, operation: string, imports: Set<string>, bindings: Bindings): ScanHttpRequest | undefined {
  if (!imports.has('net/http') || node.childForFieldName('method')?.text !== 'new') return undefined
  const receiver = node.childForFieldName('receiver')
  const method = receiver && requestClasses.get(receiver.text)
  if (!method) return undefined
  return { operation, method, ...requestPath(urlValue(argumentsOf(node)[0], bindings)) }
}

function requestCall(node: Node, operation: string, imports: Set<string>, bindings: Bindings): ScanHttpRequest | undefined {
  const constructed = requestConstructor(node, operation, imports, bindings)
  if (constructed) return constructed
  const receiver = node.childForFieldName('receiver')
  if (!receiver) return undefined
  const scoped = blockClient(receiver, node, imports, bindings)
  const client = scoped === undefined ? directClient(receiver, imports, bindings) : scoped
  if (!client) return undefined
  const name = node.childForFieldName('method')?.text ?? ''
  const args = argumentsOf(node)
  if (client.kind === 'net-class') return netClassRequest(name, args, operation, bindings)
  const indirect = name === 'run_request' && client.kind === 'faraday'
  const method = indirect ? literal(args[0])?.toUpperCase() : name.toUpperCase()
  if (!verbs.has(method?.toLowerCase() ?? '')) return undefined
  const url = urlValue(args[indirect ? 1 : 0], bindings)
  return { operation, method, ...requestPath([...client.base, ...url]) }
}

function netClassRequest(name: string, args: Node[], operation: string, bindings: Bindings): ScanHttpRequest | undefined {
  const method = ['get', 'get_response', 'get_print'].includes(name) ? 'GET'
    : ['post', 'post_form'].includes(name) ? 'POST' : name === 'put' ? 'PUT' : undefined
  if (!method) return undefined
  const parts = method === 'GET' && args.length > 1
    ? [...hostBase(urlValue(args[0], bindings)), ...urlValue(args[1], bindings)] : urlValue(args[0], bindings)
  return { operation, method, ...requestPath(parts) }
}

/** Requests stay on the named operation supplying the URL; local helper arguments are not propagated. */
export function rubyRequests(root: Node, operations: ScanOperation[]): ScanHttpRequest[] {
  const imports = new Set<string>()
  walk(root, node => {
    const required = requiredLiteral(node)
    if (required && !required.relative) imports.add(required.target)
  }, true)
  const byPosition = new Map(operations.map(operation => [operation.position, operation.id]))
  const requests: ScanHttpRequest[] = []
  walk(root, node => {
    if (!['method', 'singleton_method'].includes(node.type)) return
    const operation = byPosition.get(node.startIndex)
    const body = node.childForFieldName('body')
    if (!operation || !body) return
    const bindings = methodBindings(root, node)
    walk(body, call => {
      if (call.type !== 'call') return
      const fact = requestCall(call, operation, imports, bindings)
      if (fact) requests.push(fact)
    })
  }, true)
  return requests
}

