import { buildArchitectureModel, freeId, resolveParent } from './architecture-model.ts'
import { architectureElementPath, draftRecordPath } from './architecture-path.ts'
import { loadArchitecture } from './architecture-reader.ts'
import { GromaFileSystem } from './groma-filesystem.ts'
import {
  renderArchitectureDocument,
  renderDraftDocument,
  writeDocument,
} from './markdown-emitter.ts'
import { addGroup, groupContext } from './group.ts'
import type { StructuralResult } from './curate.ts'
import { requireText } from './naming.ts'
import { addRelation } from './relation.ts'
import { addFlow } from './flow-authoring.ts'
import type { ArchitectureElement } from './types.ts'

/** The declaration made by the add command or a pane on the live map. */
export interface AddInput {
  thing: string
  /** The name of the new record, or the source endpoint of a relationship. */
  name: string
  /** The internal container for a virtual component. */
  parent?: string
  /** With thing relation: the target id. */
  relation?: string
  /** With thing group: the ids of the components it lists. */
  members?: string[]
  overview?: string
  description?: string
  technology?: string
  steps?: string
}

type DeclaredThing = 'actor' | 'external' | 'component' | 'draft'

/**
 * A person can only propose a system or a container, with the draft command and its required parent: the
 * stable ones come from a scan. A component is not listed, because a person may also add a stable one, the
 * virtual component.
 */
const draftOnlyKinds: Record<string, string> = {
  system: '',
  container: ' --parent <system-id>',
}

function requireThing(thing: string, name: string): DeclaredThing {
  const parentHint = draftOnlyKinds[thing]
  if (parentHint !== undefined) {
    throw new Error(
      `To draft a ${thing}, run: groma draft ${thing} "${name}"${parentHint} --overview <prose>`,
    )
  }
  if (thing === 'actor' || thing === 'external' || thing === 'component' || thing === 'draft') return thing
  throw new Error('thing must be actor, external, component, draft, flow, relation or group')
}

/** A draft record has its own path. A declared C4 element uses its kind and parent for both path and content. */
function declaredDocument(
  root: string, elements: readonly ArchitectureElement[], id: string, thing: DeclaredThing, input: AddInput,
): { destination: string; source: string } {
  const overview = requireText(input.overview, '--overview')
  if (input.technology !== undefined && thing !== 'external' && thing !== 'component') {
    throw new Error('--technology is only valid for an external system or a component')
  }
  if (input.parent !== undefined && thing !== 'component') {
    throw new Error('--parent is only valid for a component')
  }
  if (thing === 'draft') {
    return {
      destination: draftRecordPath(root, id),
      source: renderDraftDocument({ id, title: input.name, outcome: overview }),
    }
  }
  const kind = thing === 'external' ? 'system' : thing
  const parent = kind === 'component' ? resolveParent(elements, kind, input.parent) : undefined
  return {
    destination: architectureElementPath({
      root,
      kind,
      id,
      external: thing === 'external',
      parentSourceFilename: parent?.sourceFilename,
    }),
    source: renderArchitectureDocument({
      id,
      kind,
      parent: parent?.id,
      name: input.name,
      description: input.description,
      technology: input.technology,
      overview,
      status: 'stable',
    }),
  }
}

/** Declares the elements, records and relationships people add to explain the architecture. */
export function addThing(repositoryRoot: string, input: AddInput & { thing: DeclaredThing | 'relation' | 'flow' }): Promise<string>
export function addThing(repositoryRoot: string, input: AddInput): Promise<string | StructuralResult>
export async function addThing(repositoryRoot: string, input: AddInput): Promise<string | StructuralResult> {
  if (input.thing === 'flow') return addFlow(repositoryRoot, requireText(input.name, 'name'), input)
  if (input.thing === 'relation') {
    return addRelation(repositoryRoot, {
      source: input.name,
      target: requireText(input.relation, 'target'),
      description: input.description,
      technology: input.technology,
    })
  }
  if (input.thing === 'group') {
    const records = await loadArchitecture(repositoryRoot)
    return addGroup(groupContext(repositoryRoot, records, buildArchitectureModel(records.documents)), {
      name: input.name,
      members: input.members ?? [],
      description: input.description,
      overview: input.overview,
    })
  }
  const name = requireText(input.name, 'name')
  const thing = requireThing(input.thing, name)
  const filesystem = GromaFileSystem.open(repositoryRoot)
  const records = await loadArchitecture(repositoryRoot)
  const model = buildArchitectureModel(records.documents)
  const id = freeId(records, model, name)
  const { destination, source } = declaredDocument(filesystem.sourceFilename(), model.elements, id, thing, input)
  if (filesystem.exists(filesystem.relative(destination))) {
    throw new Error(`architecture document already exists at ${destination}`)
  }
  await writeDocument(repositoryRoot, destination, source)
  return id
}
