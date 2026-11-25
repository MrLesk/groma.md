import type { HttpEndpointSegment } from '@groma/scanner'
import type { MountLookup, ServedRoute } from '../phoenix/endpoints.ts'
import { uniquelyNamed } from '../source.ts'
import type { AshDomain } from './domain.ts'
import type { JsonApiRoute, JsonApiRouter } from './json-api.ts'
import type { AshResource } from './resource.ts'

/*
 * What an AshJsonApi router serves below the path a Phoenix router forwards to it: the routes of
 * its domains and of every resource those domains list. The Phoenix endpoint builder asks for this
 * through `MountLookup` and places the routes under its `forward` path.
 */

const literal = (value: string): HttpEndpointSegment => ({ kind: 'literal', value })

/** The routes of one domain and its resources; undefined when any of them cannot be read. */
function domainRoutes(domain: AshDomain | undefined, resources: ReadonlyMap<string, AshResource>): JsonApiRoute[] | undefined {
  if (!domain?.resources || !domain.routes) return undefined
  const routes = [...domain.routes]
  for (const name of domain.resources) {
    const own = resources.get(name)?.routes
    if (!own) return undefined
    routes.push(...own)
  }
  return routes
}

/**
 * Everything one router serves. A route becomes an endpoint when it names an action its resource
 * declares exactly once; any other route, and each document the router answers itself, is returned
 * without an operation, which the caller reports as a blocker.
 */
function routerRoutes(router: JsonApiRouter, domains: ReadonlyMap<string, AshDomain>,
  resources: ReadonlyMap<string, AshResource>): ServedRoute[] | undefined {
  if (!router.domains || !router.documents) return undefined
  const served: ServedRoute[] = router.documents.map(path => ({ method: '*', path }))
  for (const name of router.domains) {
    const domain = domains.get(name)
    const routes = domainRoutes(domain, resources)
    if (!routes) return undefined
    if (domain!.servesSchema) served.push({ method: '*', path: [literal('schema')] }, { method: '*', path: [literal('schema.json')] })
    served.push(...routes.map(route => ({
      method: route.method, path: route.path,
      operation: route.action === undefined ? undefined : resources.get(route.resource)?.actions.get(route.action),
    })))
  }
  return served
}

/**
 * The mount lookup over every Ash declaration of a scan: what the router module with a given name
 * serves, or undefined when no single router has that name or its routes cannot all be read.
 */
export function ashMounts(resources: readonly AshResource[], domains: readonly AshDomain[], routers: readonly JsonApiRouter[]): MountLookup {
  const moduleOf = (declared: { module: string }) => declared.module
  const routerNamed = uniquelyNamed(routers, moduleOf)
  const domainNamed = uniquelyNamed(domains, moduleOf)
  const resourceNamed = uniquelyNamed(resources, moduleOf)
  return module => {
    const router = routerNamed.get(module)
    return router && routerRoutes(router, domainNamed, resourceNamed)
  }
}
