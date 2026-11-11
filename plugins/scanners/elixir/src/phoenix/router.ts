import type { HttpEndpointSegment } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { aliasesAfter, moduleName, type Aliases } from '../aliases.ts'
import { isDefinition, moduleFunctions, moduleUses, type ModuleScope } from '../modules.ts'
import { atomList, atomLiteral, body, booleanLiteral, callName, options, positional, stringLiteral } from '../syntax.ts'
import { readablePrefix, routeSegments } from './paths.ts'

/*
 * Reads a Phoenix router module into its route declarations, in registration order. Only the
 * documented Phoenix.Router and Phoenix.LiveView.Router forms are read. Every other call in a
 * routing scope may register any route there, so it becomes a blocker at that scope's path.
 * `endpoints.ts` later binds each declaration to the function that handles it.
 */

/** A function that may handle a route, tried in order: the first one the module declares handles it. */
export interface Handler {
  name: string
  arity: number
}

export type RouteDeclaration =
  /** One method and path, handled by a function of `module`. */
  | { kind: 'route'; method: string; path: HttpEndpointSegment[]; module: string; handlers: Handler[] }
  /** Everything under `path` goes to the plug `module`, which may be a router with its own routes. */
  | { kind: 'forward'; path: HttpEndpointSegment[]; module: string }
  /** Something the scanner cannot read may answer under `path`. */
  | { kind: 'blocker'; path: HttpEndpointSegment[] }

export interface RouterDeclaration {
  file: string
  module: string
  /**
   * Set when the module is a router only through `use Web, :router`: the full name of `Web`, which
   * must be proven to provide `use Phoenix.Router` (see `providesRouter`).
   */
  via?: string
  /** Route declarations in the order Phoenix registers them. */
  routes: RouteDeclaration[]
}

/** Where a routing statement stands: the path and module prefixes of its scopes, and the lexical aliases. */
interface RoutingScope {
  prefix: HttpEndpointSegment[]
  /** Module prefix from the enclosing scopes' aliases, such as `ShopWeb.Admin`; empty when none. */
  module: string
  aliases: Aliases
}

type Reader = (statement: Node, scope: RoutingScope, wrappers: ReadonlySet<string>) => RouteDeclaration[]

const blocker = (path: HttpEndpointSegment[]): RouteDeclaration => ({ kind: 'blocker', path })
const hasGlob = (path: readonly HttpEndpointSegment[]) => path.some(found => found.kind === 'catch-all')

/** The complete path of a route: the scope prefix, then the segments its own pattern states. */
function fullPath(scope: RoutingScope, pattern: Node | undefined): HttpEndpointSegment[] | undefined {
  const own = routeSegments(stringLiteral(pattern))
  return own && [...scope.prefix, ...own]
}

/** The blocker for a route whose pattern is unreadable: the scope path and the pattern's literal start. */
const unreadable = (scope: RoutingScope, pattern: Node | undefined) => blocker([...scope.prefix, ...readablePrefix(pattern)])

/** The module a route names: its lexical aliases expanded, then placed under the scope's module prefix. */
function scopedModule(written: Node | undefined, scope: RoutingScope, scoped = true): string | undefined {
  const name = moduleName(written, scope.aliases)
  if (name === undefined) return undefined
  return scoped && scope.module ? `${scope.module}.${name}` : name
}

/** A route to a controller action: `verb path, Controller, :action`, with only `key: value` options after it. */
function actionRoute(statement: Node, method: string | undefined, args: Node[], scope: RoutingScope): RouteDeclaration {
  const [pattern, plug, action, ...extra] = args
  const path = fullPath(scope, pattern)
  if (!path) return unreadable(scope, pattern)
  const config = options(statement)
  // `alias: false` keeps the scope's module prefix off this route.
  const scoped = config?.has('alias') ? booleanLiteral(config.get('alias')) : true
  const module = scoped === undefined ? undefined : scopedModule(plug, scope, scoped)
  const handler = atomLiteral(action)
  if (!config || !module || handler === undefined || method === undefined || extra.length > 0) return blocker(path)
  return { kind: 'route', method, path, module, handlers: [{ name: handler, arity: 2 }] }
}

const verbRoute: Reader = (statement, scope) =>
  [actionRoute(statement, callName(statement)!.toUpperCase(), positional(statement), scope)]

/** `match :verb, path, Controller, :action`; `:*` accepts every method. */
const matchRoute: Reader = (statement, scope) => {
  const [verb, ...args] = positional(statement)
  const name = atomLiteral(verb)
  const method = name === '*' ? '*' : /^[a-z]+$/.test(name ?? '') ? name!.toUpperCase() : undefined
  return [actionRoute(statement, method, args, scope)]
}

/** The LiveView callbacks Phoenix LiveView runs, in this order, to answer the page's HTTP request. */
const liveHandlers: Handler[] = [{ name: 'mount', arity: 3 }, { name: 'handle_params', arity: 3 }, { name: 'render', arity: 1 }]

/** `live path, LiveView`: a `GET` route. LiveView always places the module under the scope's module prefix. */
const liveRoute: Reader = (statement, scope) => {
  const [pattern, view] = positional(statement)
  const path = fullPath(scope, pattern)
  if (!path) return [unreadable(scope, pattern)]
  const module = scopedModule(view, scope)
  return [module ? { kind: 'route', method: 'GET', path, module, handlers: liveHandlers } : blocker(path)]
}

/** `forward path, Plug`: the path must be static, and trailing options belong to the plug. */
const forwardRoute: Reader = (statement, scope) => {
  const [pattern, plug, , routerOptions] = positional(statement)
  const path = fullPath(scope, pattern)
  if (!path?.every(found => found.kind === 'literal')) return [unreadable(scope, pattern)]
  // A fourth argument holds router options such as `alias:`, which this reader does not interpret.
  const module = routerOptions ? undefined : scopedModule(plug, scope)
  return [module ? { kind: 'forward', path, module } : blocker(path)]
}

/** The routes `resources` generates, in the order Phoenix registers them. `member` routes address one record. */
const resourceActions: { action: string; methods: string[]; member: boolean; tail?: string }[] = [
  { action: 'index', methods: ['GET'], member: false },
  { action: 'edit', methods: ['GET'], member: true, tail: 'edit' },
  { action: 'new', methods: ['GET'], member: false, tail: 'new' },
  { action: 'show', methods: ['GET'], member: true },
  { action: 'create', methods: ['POST'], member: false },
  { action: 'update', methods: ['PATCH', 'PUT'], member: true },
  { action: 'delete', methods: ['DELETE'], member: true },
]

const resourceOptions = new Set(['only', 'except', 'param', 'name', 'as', 'singleton', 'do'])
const identifier = /^[a-z_][A-Za-z0-9_]*$/

/** `Admin.UserProfileController` gives `user_profile`, as Phoenix.Naming.resource_name with Macro.underscore does. */
function resourceName(controller: string): string {
  const last = controller.slice(controller.lastIndexOf('.') + 1).replace(/Controller$/, '')
  return last.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/([a-z\d])([A-Z])/g, '$1_$2').toLowerCase()
}

/** The actions a `resources` call keeps: `only` wins over `except`, and neither changes the order. */
function keptActions(config: Map<string, Node>, singleton: boolean): string[] | undefined {
  const supported = resourceActions.map(route => route.action).filter(action => !(singleton && action === 'index'))
  const only = config.has('only') ? atomList(config.get('only')) : undefined
  const except = config.has('except') ? atomList(config.get('except')) : undefined
  if ((config.has('only') && !only) || (config.has('except') && !except)) return undefined
  if ([...only ?? [], ...except ?? []].some(action => !supported.includes(action))) return undefined
  return only ? supported.filter(action => only.includes(action)) : supported.filter(action => !except?.includes(action))
}

/** A string option that must be an identifier, or its default when the option is absent. */
function identifierOption(config: Map<string, Node>, key: string, otherwise: string): string | undefined {
  const value = config.has(key) ? stringLiteral(config.get(key)) : otherwise
  return value !== undefined && identifier.test(value) ? value : undefined
}

/** `resources path, Controller, options do ... end`: its own routes first, then the nested block under one record. */
const resourceRoutes: Reader = (statement, scope, wrappers) => {
  const [pattern, controller, ...extra] = positional(statement)
  const config = options(statement)
  const collection = fullPath(scope, pattern)
  const lexical = moduleName(controller, scope.aliases)
  const singleton = config?.has('singleton') ? booleanLiteral(config.get('singleton')) : false
  const kept = config && singleton !== undefined ? keptActions(config, singleton) : undefined
  const param = config && identifierOption(config, 'param', 'id')
  const name = config && lexical !== undefined ? identifierOption(config, 'name', resourceName(lexical)) : undefined
  const supported = [...config?.keys() ?? []].every(key => resourceOptions.has(key))
  if (!collection || hasGlob(collection) || !kept || !param || !name || !supported || extra.length > 0) return [unreadable(scope, pattern)]
  const module = scopedModule(controller, scope)!
  const record: HttpEndpointSegment[] = singleton ? collection : [...collection, { kind: 'parameter', name: param }]
  const own = resourceActions.filter(route => kept.includes(route.action)).flatMap(route => route.methods.map(method => ({
    kind: 'route' as const, method, module, handlers: [{ name: route.action, arity: 2 }],
    path: [...(route.member ? record : collection), ...(route.tail ? [{ kind: 'literal' as const, value: route.tail }] : [])],
  })))
  const inner = body(statement)
  // Nested routes address the parent record by `:name_param`, such as `/users/:user_id/posts`.
  const nested: HttpEndpointSegment[] = singleton ? collection : [...collection, { kind: 'parameter', name: `${name}_${param}` }]
  return [...own, ...(inner ? routes(inner, { ...scope, prefix: nested }, wrappers) : [])]
}

/** Scope options that change neither the path nor the handler module. `host` is absent: it restricts requests by host. */
const scopeOptions = new Set(['path', 'alias', 'as', 'log', 'private', 'assigns', 'do'])

/** The module prefix inside a scope: `alias: false` clears it, an alias extends it, no alias keeps it. */
function scopeModule(written: Node | undefined, scope: RoutingScope): string | undefined {
  if (!written) return scope.module
  if (booleanLiteral(written) === false) return ''
  return scopedModule(written, scope)
}

/** `scope path, Alias, options do ... end`, also written `scope path: ..., alias: ... do`. */
const scopeRoutes: Reader = (statement, scope, wrappers) => {
  const [pattern, alias, ...extra] = positional(statement)
  const config = options(statement)
  const written = pattern ?? config?.get('path')
  const inner = body(statement)
  const own = written ? routeSegments(stringLiteral(written)) : []
  const module = config ? scopeModule(alias ?? config.get('alias'), scope) : undefined
  const supported = [...config?.keys() ?? []].every(key => scopeOptions.has(key))
  // One blocker stands in for every route of a scope whose path, alias or options the scanner cannot read.
  if (!inner || !own || hasGlob(own) || module === undefined || !supported || extra.length > 0) return [unreadable(scope, written)]
  return routes(inner, { prefix: [...scope.prefix, ...own], module, aliases: scope.aliases }, wrappers)
}

const verbs = ['get', 'post', 'put', 'patch', 'delete', 'options', 'connect', 'trace', 'head']

const documentedForms = new Map<string, Reader>([
  ['scope', scopeRoutes], ['resources', resourceRoutes], ['forward', forwardRoute], ['live', liveRoute], ['match', matchRoute],
  ...verbs.map((verb): [string, Reader] => [verb, verbRoute]),
])

/** Statements that register no route: pipelines and their plugs run after a route is chosen. */
const nonRouting = new Set(['pipeline', 'pipe_through', 'plug', 'import', 'alias', 'require', 'use'])

function statementRoutes(statement: Node, scope: RoutingScope, wrappers: ReadonlySet<string>): RouteDeclaration[] {
  // A bare word such as `admin_routes` is a macro call without arguments.
  if (statement.type === 'identifier') return [blocker(scope.prefix)]
  // Attributes and other expressions register nothing.
  if (statement.type !== 'call') return []
  const name = callName(statement)
  if (name !== undefined && (nonRouting.has(name) || isDefinition(statement))) return []
  const reader = name === undefined ? undefined : documentedForms.get(name)
  if (reader) return reader(statement, scope, wrappers)
  const inner = name !== undefined && wrappers.has(name) ? body(statement) : undefined
  // A path-preserving wrapper such as `live_session` only groups its routes. Any other call, and a
  // conditional block, may register any route under this scope.
  return inner ? routes(inner, scope, wrappers) : [blocker(scope.prefix)]
}

function routes(statements: readonly Node[], scope: RoutingScope, wrappers: ReadonlySet<string>): RouteDeclaration[] {
  const found: RouteDeclaration[] = []
  let aliases = scope.aliases
  for (const statement of statements) {
    found.push(...statementRoutes(statement, { ...scope, aliases }, wrappers))
    aliases = aliasesAfter(aliases, statement)
  }
  return found
}

/** How a module declares itself a router: `use Phoenix.Router`, or `use Web, :router` naming `Web`. */
function routerUse(scope: ModuleScope): { via?: string } | undefined {
  for (const { module, statement } of moduleUses(scope)) {
    if (module === 'Phoenix.Router') return {}
    if (atomLiteral(positional(statement)[1]) === 'router') return { via: module }
  }
  return undefined
}

/** Phoenix LiveView's own grouping form; it changes no path. Other libraries' wrappers are passed in. */
const liveSession = 'live_session'

/**
 * The routes of a module that declares itself a Phoenix router; undefined for any other module.
 * `wrappers` names further block forms that are known to keep their child routes' paths.
 */
export function routerDeclaration(scope: ModuleScope, file: string, wrappers: readonly string[]): RouterDeclaration | undefined {
  const declared = routerUse(scope)
  if (!declared) return undefined
  const start: RoutingScope = { prefix: [], module: '', aliases: scope.aliases }
  return { file, module: scope.name, ...declared, routes: routes(scope.statements, start, new Set([liveSession, ...wrappers])) }
}

function containsRouterUse(node: Node): boolean {
  if (callName(node) === 'use' && positional(node)[0]?.text === 'Phoenix.Router') return true
  return node.namedChildren.some(containsRouterUse)
}

/**
 * Whether `use ThisModule, :router` provides `use Phoenix.Router`: the module declares `router/0`
 * and writes `use Phoenix.Router` inside it, as the web module of a generated Phoenix application does.
 */
export function providesRouter(scope: ModuleScope): boolean {
  const router = moduleFunctions(scope).find(candidate => candidate.name === 'router' && candidate.arity === 0)
  return router?.clauses.some(containsRouterUse) ?? false
}
