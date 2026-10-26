import path from 'node:path'
import { pluralize, singularize } from 'inflection'
import type { HttpEndpointSegment, ScanHttpEndpoint, ScanOperation } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import type { RubySource } from './source.ts'
import { argumentsOf, literal, literalList, statements } from './syntax.ts'

interface Route {
  controller?: string
  action?: string
  method: string
  path: HttpEndpointSegment[]
  position: number
}

interface Resource { controller: string; collection: string; member: string }
interface RoutingScope { prefix: string; namespace: string; resource?: Resource; controller?: string }

const verbs = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options'])
const unreadableScopes = new Set(['scope', 'controller', 'defaults'])
// These standard wrappers restrict requests but do not prepend a path. Their children remain uncertain.
const guardedScopes = new Set(['constraints', 'authenticate', 'authenticated', 'devise_scope'])
const resourceActions = [
  ['GET', '', 'index'], ['GET', '/new', 'new'], ['POST', '', 'create'],
  ['GET', '/:id', 'show'], ['GET', '/:id/edit', 'edit'],
  ['PATCH', '/:id', 'update'], ['PUT', '/:id', 'update'], ['DELETE', '/:id', 'destroy'],
] as const

function options(args: Node[]): Map<string, Node> | undefined {
  const result = new Map<string, Node>()
  for (const arg of args) {
    if (arg.type !== 'pair') return undefined
    const key = arg.childForFieldName('key')
    if (key?.type !== 'hash_key_symbol' || result.has(key.text)) return undefined
    result.set(key.text, arg.childForFieldName('value')!)
  }
  return result
}

function pathSegments(value: string): HttpEndpointSegment[] | undefined {
  const result: HttpEndpointSegment[] = []
  for (const segment of value.split('/').filter(Boolean)) {
    if (/^:[A-Za-z_]\w*$/.test(segment)) result.push({ kind: 'parameter', name: segment.slice(1) })
    else if (/^[A-Za-z0-9_.~-]+$/.test(segment)) result.push({ kind: 'literal', value: segment })
    else return undefined
  }
  return result
}

function blockerPath(segments: HttpEndpointSegment[]): HttpEndpointSegment[] {
  const prefix: HttpEndpointSegment[] = []
  for (const segment of segments) {
    if (segment.kind !== 'literal') break
    prefix.push(segment)
  }
  return [...prefix, { kind: 'catch-all', name: 'unresolved', optional: true, constrained: true }]
}

function unreadableRoute(value: string | undefined, scope: RoutingScope, position: number): Route {
  const prefix: HttpEndpointSegment[] = []
  for (const segment of `${scope.prefix}/${value ?? ''}`.split('/').filter(Boolean)) {
    if (!/^[A-Za-z0-9_.~-]+$/.test(segment)) break
    prefix.push({ kind: 'literal', value: segment })
  }
  return { method: '*', path: blockerPath(prefix), position }
}

function actionList(node: Node | undefined): string[] | undefined {
  if (!node) return undefined
  if (['array', 'symbol_array'].includes(node.type)) return literalList(node)
  const value = literal(node)
  return value === undefined ? undefined : [value]
}

function resourceDefinition(args: Node[], scope: RoutingScope, singular: boolean) {
  const name = literal(args[0])
  const config = options(args.slice(1))
  if (!name || !config || [...config.keys()].some(key => !['only', 'except', 'controller', 'path'].includes(key))) return undefined
  const only = actionList(config.get('only'))
  const except = actionList(config.get('except'))
  if ((config.has('only') && !only) || (config.has('except') && !except)) return undefined
  const controller = config.has('controller') ? literal(config.get('controller')) : singular ? pluralize(name) : name
  const routePath = config.has('path') ? literal(config.get('path')) : name
  if (!controller || routePath === undefined) return undefined
  const collection = `${scope.prefix}/${routePath}`
  return { name, only, except, collection, member: singular ? collection : `${collection}/:id`,
    controller: `${scope.namespace}${controller}` }
}

function resourceRoutes(node: Node, scope: RoutingScope): Route[] {
  const singular = node.childForFieldName('method')!.text === 'resource'
  const resource = resourceDefinition(argumentsOf(node), scope, singular)
  if (!resource) return [unreadableRoute(undefined, scope, node.startIndex)]
  const block = node.childForFieldName('block')
  const nestedPrefix = singular ? resource.collection : `${resource.collection}/:${singularize(resource.name)}_id`
  const children = block ? routeCalls(statements(block), { prefix: nestedPrefix, namespace: scope.namespace, resource }) : []
  const routes = resourceActions.flatMap(([method, suffix, action]) => {
    if (singular && action === 'index') return []
    if ((resource.only && !resource.only.includes(action)) || resource.except?.includes(action)) return []
    const tail = singular ? suffix.replace(/^\/:id/, '') : suffix
    const segments = pathSegments(`${resource.collection}${tail}`)
    return segments ? [{ controller: resource.controller, action, method, path: segments,
      position: block ? node.endIndex : node.startIndex }] : [unreadableRoute(undefined, scope, node.startIndex)]
  })
  return [...children, ...routes]
}

function routeTarget(config: Map<string, Node>, first: Node | undefined, isRoot: boolean, scope: RoutingScope): string | undefined {
  const pairTarget = first?.type === 'pair' && literal(first.childForFieldName('key')) !== undefined
    ? literal(first.childForFieldName('value')) : undefined
  const target = literal(config.get('to')) ?? pairTarget ?? (isRoot ? literal(first) : undefined)
  if (target) return `${scope.namespace}${target}`
  const action = config.has('action') ? literal(config.get('action')) : literal(first)
  return scope.controller && action ? `${scope.controller}#${action}` : undefined
}

function directRoute(name: string, args: Node[], scope: RoutingScope, position: number): Route[] {
  const isRoot = name === 'root'
  const config = options(args.slice(isRoot && args[0]?.type === 'pair' ? 0 : 1))
  const first = args[0]?.type === 'pair' ? args[0].childForFieldName('key') : args[0]
  const value = isRoot ? '' : literal(first)
  const unreadable = () => [unreadableRoute(value, scope, position)]
  if (!config || [...config.keys()].some(key => !['to', 'as', 'action'].includes(key))) return unreadable()
  const resolved = routeTarget(config, args[0], isRoot, scope)
  if (value === undefined || !resolved || !/^[a-zA-Z_][\w/]*#[a-zA-Z_]\w*[!?]?$/.test(resolved)) return unreadable()
  const [controller, handler] = resolved.split('#')
  const segments = pathSegments(`${scope.prefix}/${value}`)
  return segments ? [{ controller: controller!, action: handler!,
    method: isRoot ? 'GET' : name.toUpperCase(), path: segments, position }] : unreadable()
}

function mountedRoute(node: Node, scope: RoutingScope): Route {
  const args = argumentsOf(node)
  const at = args.find(arg => arg.childForFieldName('key')?.text === 'at')
  const target = at?.childForFieldName('value') ?? args[0]?.childForFieldName('value')
  return unreadableRoute(literal(target), scope, node.startIndex)
}

function scopedRoutes(node: Node, scope: RoutingScope): Route[] {
  const name = node.childForFieldName('method')?.text ?? ''
  const args = argumentsOf(node)
  const block = node.childForFieldName('block')
  if (name === 'resources' || name === 'resource') return resourceRoutes(node, scope)
  if (name === 'namespace') return namespaceRoutes(args, block, scope, node.startIndex)
  if (name === 'mount') return [mountedRoute(node, scope)]
  if (name === 'member' || name === 'collection') return resourceScope(node, scope, name)
  if (guardedScopes.has(name)) return guardedRoutes(node, scope)
  const unreadablePrefix = name === 'scope' ? literal(args[0]) : undefined
  if (unreadableScopes.has(name)) return [unreadableRoute(unreadablePrefix, scope, node.startIndex)]
  if (name === 'draw' || name === 'concerns' || name === 'match') return [unreadableRoute(undefined, scope, node.startIndex)]
  if (block) return []
  return verbs.has(name) || name === 'root' ? directRoute(name, args, scope, node.startIndex) : []
}

function guardedRoutes(node: Node, scope: RoutingScope): Route[] {
  const block = node.childForFieldName('block')
  if (!block) return [unreadableRoute(undefined, scope, node.startIndex)]
  return routeCalls(statements(block), scope).map(route => ({ method: '*', path: route.path, position: route.position }))
}

function resourceScope(node: Node, scope: RoutingScope, name: 'member' | 'collection'): Route[] {
  const block = node.childForFieldName('block')
  if (!block || argumentsOf(node).length || !scope.resource) return [unreadableRoute(undefined, scope, node.startIndex)]
  return routeCalls(statements(block), { ...scope, prefix: scope.resource[name], controller: scope.resource.controller })
}

function conditionalRoutes(node: Node, scope: RoutingScope): Route[] {
  if (['method', 'class', 'module', 'lambda'].includes(node.type)) return []
  if (node.type === 'call') {
    return node.childForFieldName('receiver') ? [] : scopedRoutes(node, scope)
      .map(route => ({ method: '*', path: route.path, position: route.position }))
  }
  return node.namedChildren.flatMap(child => conditionalRoutes(child, scope))
}

function routeCalls(nodes: Node[], scope: RoutingScope): Route[] {
  return nodes.flatMap(node => {
    if (['if', 'unless', 'case'].includes(node.type)) return conditionalRoutes(node, scope)
    return node.type === 'call' && !node.childForFieldName('receiver') ? scopedRoutes(node, scope) : []
  })
}

export function railsRoutes(root: Node): Route[] {
  return root.namedChildren.flatMap(node => {
    if (node.type !== 'call' || node.childForFieldName('method')?.text !== 'draw') return []
    if (node.childForFieldName('receiver')?.text !== 'Rails.application.routes') return []
    const block = node.childForFieldName('block')
    return block ? routeCalls(statements(block), { prefix: '', namespace: '' }) : []
  })
}

function namespaceRoutes(args: Node[], block: Node | null, scope: RoutingScope, position: number): Route[] {
  const value = literal(args[0])
  const config = options(args.slice(1))
  if (!block || !value || !/^[a-z_]\w*$/.test(value) || !config) return [unreadableRoute(undefined, scope, position)]
  if ([...config.keys()].some(key => key !== 'defaults') || !formatDefault(config.get('defaults'))) {
    const prefix = config.has('path') ? literal(config.get('path')) : value
    return [unreadableRoute(prefix, scope, position)]
  }
  return routeCalls(statements(block), { ...scope, prefix: `${scope.prefix}/${value}`, namespace: `${scope.namespace}${value}/` })
}

/** A format default changes the response format, not the path without its optional suffix. */
function formatDefault(node: Node | undefined): boolean {
  if (!node) return true
  if (node.type !== 'hash') return false
  const defaults = options(node.namedChildren)
  return defaults?.size === 1 && literal(defaults.get('format')) !== undefined
}

function controllerName(controller: string): string {
  const name = controller.split('/').map(part => part.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)).join('')).join('::')
  return `${name}Controller`
}

export function routeModule(file: string): ScanOperation {
  return { id: `${file}:module`, file, name: '(module)' }
}

export function resolveRailsRoutes(file: string, routes: Route[], sources: RubySource[]): ScanHttpEndpoint[] {
  const project = path.posix.dirname(path.posix.dirname(file))
  return routes.map(route => {
    const targets = route.controller && route.action ? publicTargets(route, project, sources) : []
    const order = { application: file, position: route.position }
    if (targets.length !== 1) return { operation: routeModule(file).id, method: '*', path: blockerPath(route.path), order }
    return { operation: targets[0]!.id, method: route.method, path: route.path, order }
  })
}

function publicTargets(route: Route, project: string, sources: RubySource[]) {
  const file = path.posix.join(project, 'app/controllers', `${route.controller}_controller.rb`)
  const name = `${controllerName(route.controller!)}#${route.action}`
  return sources.filter(source => source.file === file).flatMap(source => {
    const targets = source.operations.filter(operation => operation.name === name)
    return targets.length === 1 && source.publicInstanceMethods.includes(targets[0]!.id) ? targets : []
  })
}
