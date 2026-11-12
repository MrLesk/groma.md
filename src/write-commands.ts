import type { Command } from 'commander'

import { writes } from './authoring.ts'
import type { AddInput, RemoveInput } from './authoring.ts'
import { COLOR_NAMES } from './colors.ts'
import { ICON_NAMES } from './icons.ts'
import type { StructuralResult } from './curate.ts'
import { scanRepository } from './scanner.ts'

function printWriteResult(result: string | StructuralResult): void {
  console.log('ok')
  console.log(typeof result === 'string' ? result : result.id)
  if (typeof result === 'string') return
  for (const kind of ['created', 'changed', 'removed'] as const) {
    for (const filename of result[kind]) console.log(`${kind}: ${filename}`)
  }
  for (const id of result.affectedIds) console.log(`affected: ${id}`)
  for (const replacement of result.replacements) {
    console.log(`replaced: ${replacement.oldId} -> ${replacement.newId}`)
  }
}

/** `<verb> relation <a> <b>` names a relationship; every other id stands alone. */
function addressed(id: string, ids: string[]): RemoveInput {
  if (id === 'relation') {
    const [source, target] = ids
    if (source === undefined || target === undefined || ids.length > 2) {
      throw new Error('relation takes a source endpoint and a target endpoint')
    }
    return { id: source, relation: target }
  }
  if (ids.length > 0) throw new Error(`${id} takes no further id`)
  return { id }
}

/** `add relation <a> <b>` and `add group <name> <ids...>` carry ids after the name; nothing else does. */
function addedIds(thing: string, ids: string[]): Pick<AddInput, 'relation' | 'members'> {
  if (thing === 'relation') {
    if (ids.length !== 1) throw new Error('add relation takes a source endpoint and a target endpoint')
    return { relation: ids[0] }
  }
  if (thing === 'group') return { members: ids }
  if (ids.length > 0) throw new Error('add takes one name; quote a name with spaces')
  return {}
}

/** The commands that change architecture Markdown: draft, add, remove, edit, and accept. */
export function registerWriteCommands(program: Command): void {
  program
    .command('draft')
    .description('Draft software or a directed relationship')
    .argument('<kind>', 'system, container, component, or relation')
    .argument('<name>', 'element name')
    .argument('[target]', 'target file or concept ID when drafting a relation')
    .option('--overview <markdown>', 'full explanation in Markdown')
    .option('--description <text>', 'optional short summary')
    .option('--parent <id>', 'parent element id')
    .option('--technology <text>', 'implementation technology')
    .option('--draft <draft-id>', 'the draft record this ghost belongs to')
    .addHelpText('after', '\nAgent guides: groma agent-instructions')
    .action(async (kind: string, name: string, target: string | undefined, options) => {
      try {
        const id = await writes.draft(process.cwd(), {
          kind,
          name,
          ...(kind === 'relation' ? { relation: target ?? '' } : {}),
          overview: options.overview,
          description: options.description,
          parent: options.parent,
          technology: options.technology,
          draft: options.draft,
        })
        printWriteResult(id)
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exitCode = 1
      }
    })

  program
    .command('add')
    .description('Declare an actor, external system, draft, flow, relation, or group')
    .argument('<thing>', 'actor, external, draft, flow, relation, or group')
    .argument('<name>', 'name, or the source file or concept ID of a relation')
    .argument('[ids...]', 'target file or concept ID of a relation, or the component IDs a group lists')
    .option('--overview <markdown>', 'full Markdown explanation, or the outcome of a draft')
    .option('--steps <markdown>', 'flow Steps table: From | To | Action, with Markdown endpoint links')
    .option('--description <text>', 'optional short summary, or how the source uses the target')
    .option('--technology <text>', 'technology of an external, or the interaction mechanism of a relation')
    .addHelpText('after', '\nAgent guides: groma agent-instructions')
    .action(async (thing: string, name: string, ids: string[], options) => {
      try {
        const id = await writes.add(process.cwd(), {
          thing,
          name,
          ...addedIds(thing, ids),
          overview: options.overview,
          steps: options.steps,
          description: options.description,
          technology: options.technology,
        })
        printWriteResult(id)
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exitCode = 1
      }
    })

  program
    .command('remove')
    .description('Remove a person, external, ghost, component without Code, empty system/container, unused draft, relation, or group')
    .argument('<id>', 'element id, draft id, flow id, group id, or relation')
    .argument('[ids...]', 'with relation: the source and target endpoints')
    .action(async (id: string, ids: string[]) => {
      try {
        const removed = await writes.remove(process.cwd(), addressed(id, ids))
        printWriteResult(removed)
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exitCode = 1
      }
    })

  program
    .command('edit')
    .description('Update authored meaning')
    .argument('<id>', 'element id, draft id, flow id, group id, project, or relation')
    .argument('[ids...]', 'with relation: the source and target endpoints')
    .option('--title <text>', 'new title; the id stays')
    .option('--overview <markdown>', 'full Markdown explanation, or the outcome of a draft')
    .option('--steps <markdown>', 'flow Steps table: From | To | Action, with Markdown endpoint links')
    .option('--description <text>', 'optional short summary (empty removes it), or how a relation works')
    .option('--technology <text>', 'technology of an element (empty removes it) or of a relation')
    .option('--tags <tags>', 'comma-separated OKF tags of an element; replaces its list (empty removes it)')
    .option('--color <name>', `color of an element on the map: ${COLOR_NAMES.join(', ')} (empty removes it)`)
    .option('--icon <name>', `icon of an element on the map: ${ICON_NAMES.join(', ')} (empty removes it)`)
    .option('--draft <draft-id>', 'link this element to the draft that touches it')
    .option('--group <group-id>', 'put this component in a group of its container; it leaves the group it was in')
    .option('--ungroup', 'take this component out of its group')
    .option('--parent <id>', 'move an empty scanned component to this container, or a container to this system')
    .option('--combine <ids...>', 'combine empty sibling systems, containers or components into this one; their containers, components or files move to it')
    .option('--detach <files...>', 'detach these source files from the component')
    .option('--id <new-id>', 'rename this element; its document and the documents under it move with it')
    .addHelpText('after', '\nAgent guides: groma agent-instructions')
    .action(async (id: string, ids: string[], options) => {
      try {
        const { id: target, relation } = addressed(id, ids)
        const edited = await writes.edit(process.cwd(), {
          id: target,
          relation,
          title: options.title,
          overview: options.overview,
          steps: options.steps,
          description: options.description,
          technology: options.technology,
          tags: options.tags,
          color: options.color,
          icon: options.icon,
          draft: options.draft,
          group: options.group,
          ungroup: options.ungroup,
          parent: options.parent,
          combine: options.combine,
          detach: options.detach,
          newId: options.id,
        })
        printWriteResult(edited)
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exitCode = 1
      }
    })

  program
    .command('accept')
    .description('Accept a matched draft element or explicitly accept a draft relationship')
    .argument('<id>', 'draft element id, or relation')
    .argument('[ids...]', 'source and target files or concept IDs when accepting a relation')
    .action(async (id: string, ids: string[]) => {
      try {
        try {
          await writes.accept(process.cwd(), addressed(id, ids))
        } catch (error) {
          if (!(error instanceof Error) || error.message !== 'no scan match') throw error
          await scanRepository(process.cwd())
          await writes.accept(process.cwd(), { id })
        }
        console.log('ok')
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exitCode = 1
      }
    })
}
