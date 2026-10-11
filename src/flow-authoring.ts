import { parseMarkdown, parseFrontmatter } from 'comark'
import { buildArchitectureModel, freeId } from './architecture-model.ts'
import { loadArchitecture } from './architecture-reader.ts'
import { resolveFlows } from './flow-model.ts'
import { GromaFileSystem } from './groma-filesystem.ts'
import { readDocument, renderFlowDocument, replaceLeadProse, withDescription, withTitle, writeDocument } from './markdown-emitter.ts'
import { requireText } from './naming.ts'
import type { ArchitectureDocument, ArchitectureRecords } from './types.ts'

export interface FlowChanges {
  title?: string
  overview?: string
  description?: string
  /** The complete From | To | Action Markdown table, including any link definitions. */
  steps?: string
}

async function writeFlow(repositoryRoot: string, records: ArchitectureRecords, filename: string, source: string): Promise<void> {
  const tree = await parseMarkdown(source)
  const document = { sourceFilename: filename, body: parseFrontmatter(source).content, nodes: tree.nodes, frontmatter: tree.frontmatter } as ArchitectureDocument
  resolveFlows([...records.flows.filter(flow => flow.sourceFilename !== filename), document], buildArchitectureModel(records.documents))
  await writeDocument(repositoryRoot, filename, source)
}

export async function addFlow(repositoryRoot: string, title: string, input: FlowChanges): Promise<string> {
  const records = await loadArchitecture(repositoryRoot)
  const id = freeId(records, buildArchitectureModel(records.documents), title)
  const source = renderFlowDocument({
    id, title, description: input.description,
    overview: requireText(input.overview, '--overview'), steps: requireText(input.steps, '--steps'),
  })
  const filename = GromaFileSystem.open(repositoryRoot).sourceFilename(`flows/${id}.md`)
  await writeFlow(repositoryRoot, records, filename, source)
  return id
}

export async function editFlow(repositoryRoot: string, records: ArchitectureRecords, document: ArchitectureDocument, input: FlowChanges): Promise<string> {
  let source = await readDocument(repositoryRoot, document.sourceFilename)
  if (input.title !== undefined) source = withTitle(source, requireText(input.title, '--title'))
  if (input.overview !== undefined) source = replaceLeadProse(source, requireText(input.overview, '--overview'))
  source = withDescription(source, input.description)
  if (input.steps !== undefined) {
    source = source.replace(/\n## Steps\s*\n[\s\S]*$/, `\n## Steps\n\n${requireText(input.steps, '--steps')}\n`)
  }
  await writeFlow(repositoryRoot, records, document.sourceFilename, source)
  return String((document.frontmatter.groma as { id: string }).id)
}
