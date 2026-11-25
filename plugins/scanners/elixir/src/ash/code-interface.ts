import type { Node } from 'web-tree-sitter'
import type { GeneratedFunction } from '../source.ts'
import { atomLiteral, callName, positional } from '../syntax.ts'
import { entityOption } from './dsl.ts'

/*
 * Ash code interfaces: `define :open_ticket, action: :open` generates the function `open_ticket`
 * on the module that hosts the definition, a resource or a domain. Plain Elixir parsing sees no
 * `def` for it, so the scanner reports the function as a declaration of the host module. Its
 * arities depend on the action and are not provable without expanding Ash, so it is named without one.
 */

/** Statements that move every definition of their block to another module, or switch generation off. */
const blockSwitches = new Set(['namespace', 'define?'])

/** Options that change which functions one `define` generates or where. */
const entitySwitches = ['namespace', 'functions']

function interfaceName(entity: Node): string | undefined {
  if (callName(entity) !== 'define' || entitySwitches.some(key => entityOption(entity, key))) return undefined
  const name = atomLiteral(positional(entity)[0])
  // A name ending in `?` generates differently named functions; `define_calculation` is not an action interface.
  return name === undefined || name.endsWith('?') ? undefined : name
}

/**
 * The interface functions that the `define` entities among `statements` generate on `host`.
 * A block that redirects its definitions is not interpreted.
 */
export function interfaceFunctions(statements: readonly Node[], host: string): GeneratedFunction[] {
  if (statements.some(statement => blockSwitches.has(callName(statement) ?? ''))) return []
  return statements.flatMap(entity => {
    const name = interfaceName(entity)
    return name === undefined ? [] : [{ module: host, name, node: entity }]
  })
}
