import { moduleName } from '../aliases.ts'
import { aliasesAt, type ModuleScope } from '../modules.ts'
import type { GeneratedFunction } from '../source.ts'
import { body, callName, positional } from '../syntax.ts'
import { interfaceFunctions } from './code-interface.ts'
import { section } from './dsl.ts'
import { jsonApiRoutes, servesSchema, type JsonApiRoute } from './json-api.ts'

/*
 * An Ash domain (`use Ash.Domain`): the resources it lists in `resources do ... end`, the code
 * interface functions it defines for them on itself, and its JSON:API routes.
 */

export interface AshDomain {
  module: string
  /** Full names of the listed resources; undefined when one is not written as a literal module. */
  resources?: string[]
  /** The domain's own JSON:API routes; undefined when they cannot all be read. */
  routes?: JsonApiRoute[]
  /** `serve_schema? true`: its router also answers `/schema` and `/schema.json`. */
  servesSchema: boolean
}

/** Read a module that states `use Ash.Domain`. `resource Ticket do define :open end` defines `open` on the domain. */
export function ashDomain(scope: ModuleScope): { domain: AshDomain; generated: GeneratedFunction[] } {
  const entries = section(scope.statements, 'resources').filter(statement => callName(statement) === 'resource')
  const names = entries.map(entry => moduleName(positional(entry)[0], aliasesAt(scope, entry)))
  return {
    domain: {
      module: scope.name,
      resources: names.every(name => name !== undefined) ? names as string[] : undefined,
      routes: jsonApiRoutes(scope),
      servesSchema: servesSchema(scope),
    },
    generated: entries.flatMap(entry => interfaceFunctions(body(entry) ?? [], scope.name)),
  }
}
