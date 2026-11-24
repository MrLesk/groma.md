import { buildArchitectureModel, idConflict } from './architecture-model.ts'
import { addGroups, groupContext, type BatchGroupInput, type GroupContext } from './group.ts'
import { parsedDocument, readDocument, withoutGroupField, writeDocument } from './markdown-emitter.ts'
import { kebabCase } from './naming.ts'
import type { ArchitectureDocument, ArchitectureRecords } from './types.ts'

/** The group name groma 0.7 wrote in a document's own `groma.group` field, if it has one. */
function oldGroupName(document: ArchitectureDocument): string | undefined {
  const groma = document.frontmatter.groma
  if (typeof groma !== 'object' || groma === null) return undefined
  const name = (groma as Record<string, unknown>).group
  return typeof name === 'string' ? name : undefined
}

/**
 * The id `groma add group` gives the record, `<container-id>-<kebab name>`, or the first free numbered one
 * (`api-checks-2`) when an element, a record or another group of this conversion has it. `groma add group`
 * refuses a taken id; a conversion cannot, because nothing would load until someone edited the files.
 */
function freeGroupId(context: GroupContext, base: string, batch: ReadonlyMap<string, BatchGroupInput>): string {
  const taken = (id: string) => [...batch.values()].some(group => group.id === id)
    || idConflict(context.records, context.model, id) !== undefined
  let id = base
  for (let number = 2; taken(id); number++) id = `${base}-${number}`
  return id
}

/**
 * The groups the old fields name: the components of one container that wrote the same name. A container, a
 * component without a container, and a name without a letter or a digit form no group, because a group holds
 * components of one container.
 */
function namedGroups(named: readonly ArchitectureDocument[], context: GroupContext): BatchGroupInput[] {
  const groups = new Map<string, BatchGroupInput>()
  for (const document of named) {
    const name = oldGroupName(document)!.trim()
    const element = context.model.elements.find(candidate => candidate.sourceFilename === document.sourceFilename)
    const container = context.model.elements.find(candidate => candidate.id === element?.parentId)
    if (element?.kind !== 'component' || container?.kind !== 'container' || kebabCase(name) === '') continue
    const base = kebabCase(`${container.id}-${name}`)
    const group = groups.get(base) ?? { name, members: [], id: freeGroupId(context, base, groups) }
    group.members.push(element.id)
    groups.set(base, group)
  }
  return [...groups.values()]
}

/**
 * groma 0.7 stored a component's group as a name in the component's own `groma.group` field. A group is now a
 * record under groups/ (src/group.ts). This converts a project or a revision that still has the field: each
 * named group becomes the record `groma add group` writes, then the field leaves every document. A working copy
 * is converted once; a revision is converted in its temporary snapshot each time it is read, and the repository
 * does not change. The records are checked together against one model, so a conversion costs about one load.
 * Returns whether anything was converted.
 */
export async function upgradeGroupFields(repositoryRoot: string, records: ArchitectureRecords): Promise<boolean> {
  const named = records.documents.filter(document => oldGroupName(document) !== undefined)
  if (named.length === 0) return false

  const sources = new Map(await Promise.all(named.map(async document => [
    document.sourceFilename,
    withoutGroupField(await readDocument(repositoryRoot, document.sourceFilename)),
  ] as const)))
  const documents = await Promise.all(records.documents.map(document => {
    const source = sources.get(document.sourceFilename)
    return source === undefined ? document : parsedDocument(document.sourceFilename, source)
  }))
  const context = groupContext(repositoryRoot, { ...records, documents }, buildArchitectureModel(documents))

  // Records before fields: a conversion stopped in between finds these records and joins them on the next load.
  await addGroups(context, namedGroups(named, context))
  for (const [sourceFilename, source] of sources) await writeDocument(repositoryRoot, sourceFilename, source)
  return true
}
