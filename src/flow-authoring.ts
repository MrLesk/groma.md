import { renderFrontmatter } from 'comark/render'
import { buildArchitectureModel, freeId } from './architecture-model.ts'
import { loadArchitecture } from './architecture-reader.ts'
import { elementsByDocument, withElementLinks } from './element-links.ts'
import { resolveFlows } from './flow-model.ts'
import { GromaFileSystem } from './groma-filesystem.ts'
import { parsedDocument, readDocument, replaceLeadProse, type TagChanges, withDescription, withTags, withTitle, writeDocument } from './markdown-emitter.ts'
import { requireText } from './naming.ts'
import { FLOW_TYPE } from './okf-profile.ts'
import type { ArchitectureDocument, ArchitectureRecords } from './types.ts'

/** The wording, tags and ordered steps an author can change on a flow record. */
export interface FlowChanges extends TagChanges {
  title?: string
  overview?: string
  description?: string
  /** The complete From | To | Action Markdown table, including any link definitions. */
  steps?: string
}

/** The section of a flow record that holds its steps. */
export const stepsSection: ReadonlySet<string> = new Set(['## Steps'])

/**
 * Checks the flow against the stored elements and writes it. When the author supplied the steps, their
 * endpoint links are stored as elementLink writes them, whatever text the author typed.
 */
async function writeFlow(
  repositoryRoot: string,
  records: ArchitectureRecords,
  filename: string,
  authored: string,
  hasNewSteps: boolean,
): Promise<void> {
  const model = buildArchitectureModel(records.documents)
  const source = hasNewSteps ? withElementLinks(authored, filename, stepsSection, elementsByDocument(model.elements)) : authored
  const document = await parsedDocument(filename, source)
  resolveFlows([...records.flows.filter(flow => flow.sourceFilename !== filename), document], model)
  await writeDocument(repositoryRoot, filename, source)
}

/** Creates a scenario from its title, overview and ordered steps, with an optional description. */
export async function addFlow(repositoryRoot: string, title: string, input: Pick<FlowChanges, 'overview' | 'steps' | 'description'>): Promise<string> {
  const records = await loadArchitecture(repositoryRoot)
  const id = freeId(records, buildArchitectureModel(records.documents), title)
  const source = `---\n${renderFrontmatter({
    type: FLOW_TYPE, title, ...(input.description === undefined ? {} : { description: input.description }), groma: { id },
  })}\n---\n\n${requireText(input.overview, '--overview')}\n\n## Steps\n\n${requireText(input.steps, '--steps')}\n`
  const filename = GromaFileSystem.open(repositoryRoot).sourceFilename(`flows/${id}.md`)
  await writeFlow(repositoryRoot, records, filename, source, true)
  return id
}

/** Applies the edit to the current flow document and validates its steps before writing. */
export async function editFlow(repositoryRoot: string, records: ArchitectureRecords, document: ArchitectureDocument, input: FlowChanges): Promise<string> {
  let source = await readDocument(repositoryRoot, document.sourceFilename)
  if (input.title !== undefined) source = withTitle(source, requireText(input.title, '--title'))
  if (input.overview !== undefined) source = replaceLeadProse(source, requireText(input.overview, '--overview'))
  source = withDescription(source, input.description)
  source = withTags(source, input)
  if (input.steps !== undefined) {
    source = source.replace(/\n## Steps\s*\n[\s\S]*$/, `\n## Steps\n\n${requireText(input.steps, '--steps')}\n`)
  }
  await writeFlow(repositoryRoot, records, document.sourceFilename, source, input.steps !== undefined)
  return String((document.frontmatter.groma as { id: string }).id)
}
