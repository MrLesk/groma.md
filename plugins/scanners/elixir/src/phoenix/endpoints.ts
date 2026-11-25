import type { HttpEndpointSegment, ScanHttpEndpoint, ScanOperation } from '@groma/scanner'
import type { ModuleLookup } from '../source.ts'
import { blockerPath } from './paths.ts'
import type { RouteDeclaration, RouterDeclaration } from './router.ts'

/*
 * Turns the route declarations of every Phoenix router into HTTP endpoint facts. This step runs
 * after all files are read, because a route names its handler in another file. A route whose handler
 * is not exactly one function in the selected source becomes a blocker, never a guess.
 */

/** One route a router serves. Without an operation its handler is unknown, and it is reported as a blocker. */
export interface ServedRoute {
  method: string
  path: HttpEndpointSegment[]
  operation?: string
}

/**
 * The routes a `forward` target serves below its mount path, supplied by a framework that can read
 * that target's routes. Undefined when it cannot, or when the module is not one of its routers.
 */
export type MountLookup = (module: string) => ServedRoute[] | undefined

export interface PhoenixEndpoints {
  endpoints: ScanHttpEndpoint[]
  /** One `(module)` operation per router file that reports a blocker. */
  operations: ScanOperation[]
}

/** The operation a blocker names: the code of the router file itself, which is not a function. */
const routerCode = (file: string): ScanOperation => ({ id: `${file}:module`, file, name: '(module)' })

/** The first handler candidate the routed module declares as a public run-time function. */
function handlerOperation(route: Extract<RouteDeclaration, { kind: 'route' }>, moduleNamed: ModuleLookup): string | undefined {
  const functions = moduleNamed(route.module)?.functions ?? []
  for (const handler of route.handlers) {
    const declared = functions.find(candidate => candidate.name === handler.name && candidate.arity === handler.arity)
    if (declared?.public && declared.operation !== undefined) return declared.operation
  }
  return undefined
}

/**
 * What one declaration serves, as groups that are tried one after the other. A route or blocker is
 * one group. A readable mount is two: its own routes, whose order among themselves is the mounted
 * router's business, and then everything else under the mount path, which the mounted plug also
 * answers, so no later route of this router can.
 */
function servedGroups(route: RouteDeclaration, moduleNamed: ModuleLookup, mounted: MountLookup): ServedRoute[][] {
  if (route.kind === 'blocker') return [[{ method: '*', path: route.path }]]
  if (route.kind === 'route') return [[{ method: route.method, path: route.path, operation: handlerOperation(route, moduleNamed) }]]
  const everythingBelow: ServedRoute = { method: '*', path: route.path }
  const below = mounted(route.module)
  // A plug whose routes are not readable here may answer anything under its mount path.
  if (below === undefined) return [[everythingBelow]]
  return [below.map(served => ({ ...served, path: [...route.path, ...served.path] })), [everythingBelow]]
}

/**
 * The routers that report endpoints under their own paths. A router that another router forwards
 * to serves under that mount path instead, and the forward's blocker already covers it there, so
 * it reports nothing. Any other router is assumed to be plugged at the root by its endpoint.
 */
function rootRouters(routers: readonly RouterDeclaration[]): RouterDeclaration[] {
  const mounted = new Set(routers.flatMap(router => router.routes.flatMap(route => route.kind === 'forward' ? [route.module] : [])))
  return routers.filter(router => !mounted.has(router.module))
}

/**
 * The endpoints of the proven Phoenix routers. Phoenix tries routes in the order they are written,
 * so each endpoint carries its position in its router's sequence.
 */
export function phoenixEndpoints(routers: readonly RouterDeclaration[], moduleNamed: ModuleLookup, mounted: MountLookup): PhoenixEndpoints {
  const reporting = rootRouters(routers)
  const endpoints: ScanHttpEndpoint[] = []
  const blocked = new Set<string>()
  for (const router of reporting) {
    // Routers that share a file share its registration sequence, whose order across routers is unknown.
    const shared = reporting.filter(other => other.file === router.file).length > 1
    const groups = router.routes.flatMap(route => servedGroups(route, moduleNamed, mounted))
    groups.forEach((group, index) => {
      const order = { application: router.file, position: shared ? 0 : index }
      for (const served of group) {
        if (served.operation !== undefined) {
          endpoints.push({ operation: served.operation, method: served.method, path: served.path, order })
        } else {
          // Without a handler in the selected source the route is a blocker for everything under its literal prefix.
          blocked.add(router.file)
          endpoints.push({ operation: routerCode(router.file).id, method: '*', path: blockerPath(served.path), order })
        }
      }
    })
  }
  return { endpoints, operations: [...blocked].sort().map(routerCode) }
}
