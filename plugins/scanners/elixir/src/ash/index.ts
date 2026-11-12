import type { ScanOperation } from '@groma/scanner'
import { moduleUses, type ModuleScope } from '../modules.ts'
import type { GeneratedFunction } from '../source.ts'
import { ashDomain, type AshDomain } from './domain.ts'
import { jsonApiRouter, type JsonApiRouter } from './json-api.ts'
import { ashResource, type AshResource } from './resource.ts'

export { ashMounts } from './mount.ts'

/*
 * Everything the scanner knows about Ash lives in this directory:
 *
 * - `resource.ts`: actions of `use Ash.Resource` modules, as operations.
 * - `domain.ts`: the resources a `use Ash.Domain` module lists.
 * - `code-interface.ts`: `define` entries, as functions of the resource or domain that hosts them.
 * - `json-api.ts`: AshJsonApi routes and routers.
 * - `mount.ts`: what a router serves where a Phoenix router forwards to it.
 *
 * Only these literal declaration forms are read. Ash extensions, fragments and macros are not expanded.
 */

/**
 * AshAuthentication's `ash_authentication_live_session name do ... end` wraps Phoenix LiveView's
 * `live_session` and leaves the paths of the routes inside it unchanged, so the Phoenix router
 * reader reads through it.
 */
export const ashRoutingWrappers = ['ash_authentication_live_session']

/** The Ash declarations of one file. */
export interface AshFacts {
  resources: AshResource[]
  domains: AshDomain[]
  routers: JsonApiRouter[]
  /** One operation per resource action. */
  operations: ScanOperation[]
  /** The functions code interfaces generate on the file's modules. */
  generated: GeneratedFunction[]
}

/** Read the Ash resources, domains and JSON:API routers among the modules of one file. */
export function readAsh(scopes: readonly ModuleScope[], file: string): AshFacts {
  const facts: AshFacts = { resources: [], domains: [], routers: [], operations: [], generated: [] }
  for (const scope of scopes) {
    const used = new Set(moduleUses(scope).map(use => use.module))
    if (used.has('Ash.Resource')) {
      const { resource, operations, generated } = ashResource(scope, file)
      facts.resources.push(resource)
      facts.operations.push(...operations)
      facts.generated.push(...generated)
    }
    if (used.has('Ash.Domain')) {
      const { domain, generated } = ashDomain(scope)
      facts.domains.push(domain)
      facts.generated.push(...generated)
    }
    const router = jsonApiRouter(scope)
    if (router) facts.routers.push(router)
  }
  return facts
}
