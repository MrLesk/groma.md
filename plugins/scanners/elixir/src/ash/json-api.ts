import type { HttpEndpointSegment } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { pathText } from '../../../http-url.ts'
import { moduleName, type Aliases } from '../aliases.ts'
import { aliasesAt, moduleUses, type ModuleScope } from '../modules.ts'
import { atomLiteral, body, booleanLiteral, callName, listItems, options, positional, stringLiteral } from '../syntax.ts'
import { entityOption, section } from './dsl.ts'

/*
 * AshJsonApi declarations: the routes a resource or a domain states in
 * `json_api do routes do ... end end`, and the router module that serves them
 * (`use AshJsonApi.Router, domains: [...]`). `mount.ts` combines them into what one router serves.
 */

export interface JsonApiRoute {
  method: string
  /** The path inside the router: the base, then the route's own path. */
  path: HttpEndpointSegment[]
  /** Full name of the resource the route belongs to. */
  resource: string
  /** The action the route runs; a relationship route that names none has no action. */
  action?: string
}

export interface JsonApiRouter {
  module: string
  /** Full names of the domains it serves; undefined when they are not written as literal modules. */
  domains?: string[]
  /** Paths of the OpenAPI and JSON schema documents the router answers itself; undefined when not literal. */
  documents?: HttpEndpointSegment[][]
}

/** Where a route entity stands: the base path and default resource around it. */
interface RouteContext {
  base: HttpEndpointSegment[]
  resource?: string
  aliases: Aliases
}

/** AshJsonApi compares segments as text; only a segment starting with `:` is a parameter. */
function pathSegments(text: string | undefined): HttpEndpointSegment[] | undefined {
  const segments = text?.split('/').filter(part => part !== '').map((part): HttpEndpointSegment | undefined => {
    const value = part.startsWith(':') ? part.slice(1) : part
    if (!pathText.test(value)) return undefined
    return part.startsWith(':') ? { kind: 'parameter', name: value } : { kind: 'literal', value }
  })
  return segments?.every(found => found !== undefined) ? segments as HttpEndpointSegment[] : undefined
}

interface RouteKind {
  method: string
  /** The entity names a relationship before its action. */
  relationship: boolean
  /** The entity names the action that answers. */
  action: boolean
  /** The path the entity serves when it states no `route`. */
  path: (relationship: string) => string
}

const relationshipPath = (name: string) => `/:id/relationships/${name}`

/** The route entities of AshJsonApi whose kind fixes the HTTP method. */
const routeKinds = new Map<string, RouteKind>([
  ['get', { method: 'GET', relationship: false, action: true, path: () => '/:id' }],
  ['index', { method: 'GET', relationship: false, action: true, path: () => '/' }],
  ['post', { method: 'POST', relationship: false, action: true, path: () => '/' }],
  ['patch', { method: 'PATCH', relationship: false, action: true, path: () => '/:id' }],
  ['delete', { method: 'DELETE', relationship: false, action: true, path: () => '/:id' }],
  ['related', { method: 'GET', relationship: true, action: true, path: name => `/:id/${name}` }],
  ['relationship', { method: 'GET', relationship: true, action: true, path: relationshipPath }],
  ['post_to_relationship', { method: 'POST', relationship: true, action: false, path: relationshipPath }],
  ['patch_relationship', { method: 'PATCH', relationship: true, action: false, path: relationshipPath }],
  ['delete_from_relationship', { method: 'DELETE', relationship: true, action: false, path: relationshipPath }],
])

/** On a domain an entity may name its resource first: `get Ticket, :read`. */
function entityArguments(entity: Node, context: RouteContext): { resource?: string; rest: Node[] } {
  const [first, ...rest] = positional(entity)
  const named = moduleName(first, context.aliases)
  return named === undefined ? { resource: context.resource, rest: first ? [first, ...rest] : [] } : { resource: named, rest }
}

/** `get :read`, `related :comments, :read` and the other entities whose kind fixes the method. */
function kindRoute(entity: Node, kind: RouteKind, context: RouteContext): JsonApiRoute | undefined {
  const { resource, rest } = entityArguments(entity, context)
  const names = rest.map(atomLiteral)
  const expected = Number(kind.relationship) + Number(kind.action)
  if (!resource || names.length !== expected || names.some(name => name === undefined)) return undefined
  const stated = entityOption(entity, 'route')
  const own = pathSegments(stated ? stringLiteral(stated) : kind.path(names[0]!))
  return own && { method: kind.method, path: [...context.base, ...own], resource, ...(kind.action ? { action: names.at(-1)! } : {}) }
}

/** `route :post, "/count", :count`: a route to a generic action. */
function genericRoute(entity: Node, context: RouteContext): JsonApiRoute | undefined {
  const { resource, rest } = entityArguments(entity, context)
  const [method, pattern, action] = rest
  const own = pathSegments(stringLiteral(pattern))
  const verb = atomLiteral(method)
  const name = atomLiteral(action)
  if (!resource || !own || rest.length !== 3 || name === undefined || !/^[a-z]+$/.test(verb ?? '')) return undefined
  return { method: verb!.toUpperCase(), path: [...context.base, ...own], resource, action: name }
}

/** `base_route "/tickets", Ticket do ... end` on a domain: a path and default resource for the routes inside. */
function nestedRoutes(entity: Node, context: RouteContext): JsonApiRoute[] | undefined {
  const [pattern, resource, ...extra] = positional(entity)
  const own = pathSegments(stringLiteral(pattern))
  const named = resource ? moduleName(resource, context.aliases) : context.resource
  const inner = body(entity)
  if (!own || !inner || extra.length > 0 || (resource && named === undefined)) return undefined
  return routeEntities(inner, { base: [...context.base, ...own], resource: named, aliases: context.aliases })
}

function entityRoutes(entity: Node, context: RouteContext): JsonApiRoute[] | undefined {
  const name = callName(entity) ?? ''
  if (name === 'base') return []
  if (name === 'base_route') return nestedRoutes(entity, context)
  const kind = routeKinds.get(name)
  const route = name === 'route' ? genericRoute(entity, context) : kind && kindRoute(entity, kind, context)
  return route && [route]
}

/** Every route of a routes block; undefined when one entry is not a readable route entity. */
function routeEntities(statements: readonly Node[], context: RouteContext): JsonApiRoute[] | undefined {
  const routes = statements.map(entity => entityRoutes(entity, context))
  return routes.every(found => found !== undefined) ? routes.flat() as JsonApiRoute[] : undefined
}

/**
 * The routes a resource or domain module states. `resource` is the module itself for a resource,
 * whose routes all belong to it and share its `base`; a domain passes none. Undefined when the
 * routes cannot all be read.
 */
export function jsonApiRoutes(scope: ModuleScope, resource?: string): JsonApiRoute[] | undefined {
  const statements = section(section(scope.statements, 'json_api'), 'routes')
  const stated = statements.find(statement => callName(statement) === 'base')
  const base = stated ? pathSegments(stringLiteral(positional(stated)[0])) : []
  // Aliases are read where the section starts; Ash sections hold no alias directives of their own.
  return base && routeEntities(statements, { base, resource, aliases: aliasesAt(scope, statements[0] ?? scope.node) })
}

/** Whether a domain states `serve_schema? true`, which makes its router answer `/schema` and `/schema.json`. */
export function servesSchema(scope: ModuleScope): boolean {
  return section(scope.statements, 'json_api').some(statement =>
    callName(statement) === 'serve_schema?' && booleanLiteral(positional(statement)[0]) === true)
}

/** `domains: [A, B]` or `domain: A`, as literal modules. */
function servedDomains(config: Map<string, Node>, aliases: Aliases): string[] | undefined {
  const written = config.get('domains') ?? config.get('domain')
  const names = (listItems(written) ?? (written ? [written] : [])).map(item => moduleName(item, aliases))
  return names.every(name => name !== undefined) ? names as string[] : undefined
}

/** `open_api: "/open_api"`: a path, a list of paths, or `true` for the default path. */
function documentPaths(written: Node | undefined, standard: string): HttpEndpointSegment[][] | undefined {
  if (!written || booleanLiteral(written) === false) return []
  if (booleanLiteral(written) === true) return [[{ kind: 'literal', value: standard }]]
  const paths = (listItems(written) ?? [written]).map(item => pathSegments(stringLiteral(item)))
  return paths.every(found => found !== undefined) ? paths as HttpEndpointSegment[][] : undefined
}

/** The router a module declares with `use AshJsonApi.Router, ...`; undefined for any other module. */
export function jsonApiRouter(scope: ModuleScope): JsonApiRouter | undefined {
  const use = moduleUses(scope).find(candidate => candidate.module === 'AshJsonApi.Router')
  if (!use) return undefined
  const config = options(use.statement)
  const openApi = config && documentPaths(config.get('open_api'), 'open_api')
  const jsonSchema = config && documentPaths(config.get('json_schema'), 'json_schema')
  return {
    module: scope.name,
    domains: config && servedDomains(config, aliasesAt(scope, use.statement)),
    documents: openApi && jsonSchema && [...openApi, ...jsonSchema],
  }
}
