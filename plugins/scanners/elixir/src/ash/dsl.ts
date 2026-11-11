import type { Node } from 'web-tree-sitter'
import { body, callName, options, positional } from '../syntax.ts'

/*
 * Ash declares resources and domains with the Spark DSL: sections such as `actions do ... end`
 * holding entities such as `create :open, accept: [...]`. An entity's options are written either
 * after its arguments (`key: value`) or as statements in its own block (`key value`).
 */

/** The statements of every `name do ... end` section written directly among `statements`. */
export function section(statements: readonly Node[], name: string): Node[] {
  return statements.flatMap(statement => callName(statement) === name ? body(statement) ?? [] : [])
}

/** One option of an entity, in either spelling; undefined when the entity does not state it. */
export function entityOption(entity: Node, key: string): Node | undefined {
  const inline = options(entity)?.get(key)
  if (inline) return inline
  const stated = (body(entity) ?? []).find(statement => callName(statement) === key)
  return stated && positional(stated)[0]
}
