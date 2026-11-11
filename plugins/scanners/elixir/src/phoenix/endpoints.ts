import type { HttpEndpointSegment, ScanHttpEndpoint, ScanOperation } from '@groma/scanner'
import type { ElixirModule } from '../source.ts'
import { blockerPath } from './paths.ts'
import type { RouteDeclaration, RouterDeclaration } from './router.ts'

/*
 * Turns the route declarations of every Phoenix router into HTTP endpoint facts. This step runs
 * after all files are read, because a route names its handler in another file. A route whose handler
 * is not exactly one function in the selected source becomes a blocker, never a guess.
 */

/** One route a mounted plug serves below its mount path; without an operation it is a blocker. */
export interface MountedRoute {
  method: string
  path: HttpEndpointSegment[]
  operation?: string
}

/**
 * What a `forward` target serves, supplied by a framework that knows the target's routes: its
 * routes, `'unreadable'` when it is such a router but its routes cannot all be read, or undefined
 * when the module is not one of that framework's routers.
 */
export type MountLookup = (module: string) => MountedRoute[] | 'unreadable' | undefined

export interface PhoenixEndpoints {
  endpoints: ScanHttpEndpoint[]
  /** One `(module)` operation per router file that reports a blocker. */
  operations: ScanOperation[]
}

type ModuleLookup = (name: string) => ElixirModule | undefined

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

/** What one declaration serves: bound routes, and routes without an operation that become blockers. */
function servedRoutes(route: RouteDeclaration, moduleNamed: ModuleLookup, mounted: MountLookup): MountedRoute[] {
  if (route.kind === 'blocker') return [{ method: '*', path: route.path }]
  if (route.kind === 'route') return [{ method: route.method, path: route.path, operation: handlerOperation(route, moduleNamed) }]
  const below = mounted(route.module)
  // A plug that is not a readable router may answer anything under its mount path.
  if (below === undefined || below === 'unreadable') return [{ method: '*', path: route.path }]
  return below.map(served => ({ ...served, path: [...route.path, ...served.path] }))
}

/**
 * The endpoints of every proven router. Phoenix tries routes in the order they are written, so each
 * endpoint carries its position in its router. `providesRouter` tells whether `use Module, :router`
 * is proven to make a Phoenix router.
 */
export function phoenixEndpoints(routers: readonly RouterDeclaration[], providesRouter: (module: string) => boolean,
  moduleNamed: ModuleLookup, mounted: MountLookup): PhoenixEndpoints {
  const proven = routers.filter(router => router.via === undefined || providesRouter(router.via))
  const endpoints: ScanHttpEndpoint[] = []
  const blocked = new Set<string>()
  for (const router of proven) {
    // Routers that share a file share its registration sequence, whose order across routers is unknown.
    const shared = proven.filter(other => other.file === router.file).length > 1
    router.routes.forEach((route, index) => {
      const order = { application: router.file, position: shared ? 0 : index }
      for (const served of servedRoutes(route, moduleNamed, mounted)) {
        if (served.operation !== undefined) {
          endpoints.push({ operation: served.operation, method: served.method, path: served.path, order })
        } else {
          blocked.add(router.file)
          endpoints.push({ operation: routerCode(router.file).id, method: '*', path: blockerPath(served.path), order })
        }
      }
    })
  }
  return { endpoints, operations: [...blocked].sort().map(routerCode) }
}
