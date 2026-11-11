import type { ScanOperation } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import type { ModuleScope } from '../modules.ts'
import type { DeclaredFunction } from '../source.ts'
import { atomLiteral, callName, declarationId, keywordPairs, listItems, positional } from '../syntax.ts'
import { interfaceFunctions } from './code-interface.ts'
import { section } from './dsl.ts'
import { jsonApiRoutes, type JsonApiRoute } from './json-api.ts'

/*
 * An Ash resource (`use Ash.Resource`): the actions it declares in `actions do ... end`, the
 * functions its `code_interface` generates, and its own JSON:API routes. An action is named work
 * that callers and API routes run by name, so each one is an operation in the resource file.
 */

export interface AshResource {
  module: string
  /** The operation of each action name the resource declares exactly once. */
  actions: Map<string, string>
  /** The resource's own JSON:API routes; undefined when they cannot all be read. */
  routes?: JsonApiRoute[]
}

/** The entities that declare one named action each. */
const actionForms = new Set(['create', 'read', 'update', 'destroy', 'action'])

interface DeclaredAction {
  name: string
  node: Node
}

/** `defaults [:read, :destroy, create: :*]` declares the actions `read`, `destroy` and `create`. */
function defaultActions(statement: Node): DeclaredAction[] {
  return (listItems(positional(statement)[0]) ?? []).flatMap((item): DeclaredAction[] => {
    const name = atomLiteral(item)
    if (name !== undefined) return [{ name, node: item }]
    if (item.type !== 'keywords') return []
    return [...keywordPairs(item) ?? []].map(([key, value]) => ({ name: key, node: value.parent ?? value }))
  })
}

function declaredActions(scope: ModuleScope): DeclaredAction[] {
  return section(scope.statements, 'actions').flatMap((statement): DeclaredAction[] => {
    const form = callName(statement)
    if (form === 'defaults') return defaultActions(statement)
    const name = form !== undefined && actionForms.has(form) ? atomLiteral(positional(statement)[0]) : undefined
    return name === undefined ? [] : [{ name, node: statement }]
  })
}

/** Read a module that states `use Ash.Resource`. A name declared by two actions identifies no single action. */
export function ashResource(scope: ModuleScope, file: string): { resource: AshResource; operations: ScanOperation[]; declared: DeclaredFunction[] } {
  const actions = declaredActions(scope)
  const operations = actions.map(action => ({
    id: declarationId(file, action.node), file, name: `${scope.name}.${action.name} (action)`, position: action.node.startIndex,
  }))
  const count = (name: string) => actions.filter(action => action.name === name).length
  const once = actions.flatMap((action, index) => count(action.name) === 1 ? [[action.name, operations[index]!.id] as const] : [])
  return {
    resource: { module: scope.name, actions: new Map(once), routes: jsonApiRoutes(scope, scope.name) },
    operations,
    declared: interfaceFunctions(section(scope.statements, 'code_interface'), scope.name),
  }
}
