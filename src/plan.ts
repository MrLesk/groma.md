import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { escapeMarkdownText, escapeTableCell } from './architecture-markdown.ts'
import { buildArchitectureModel, draftRecordOf, freeId } from './architecture-model.ts'
import { architectureElementPath, draftRecordPath } from './architecture-path.ts'
import { loadArchitecture, parseArchitectureDocument } from './architecture-reader.ts'
import { resolveFlows } from './flow-model.ts'
import { GromaFileSystem } from './groma-filesystem.ts'
import { renderArchitectureDocument, renderDraftDocument, sourceWithFrontmatter } from './markdown-emitter.ts'
import { requireText } from './naming.ts'
import { c4Kind, FLOW_TYPE, OKF_VERSION, PLAN_TYPE, requireBundleIndex, requireGromaMapping } from './okf-profile.ts'
import { withStoredRelationships } from './relationship-storage.ts'
import type { StoredRelationship } from './relationship-markdown.ts'
import type { ArchitectureDocument, ArchitectureElement, ArchitectureFlow, ArchitectureModel, ArchitectureRecords } from './types.ts'

export interface PlanExportInput { ids: string[]; to: string }
export interface PlanImportInput { path: string; parent?: string }

interface PlanBundle {
  title: string
  /** The Markdown body of plan.md. It becomes the outcome of the draft record. */
  outcome: string
  documents: ArchitectureDocument[]
  flows: ArchitectureDocument[]
}

/**
 * Bundle documents are named as if this were their architecture directory, because links between documents and
 * the flows/ folder are resolved below one. The name appears in import errors and is never a path on disk.
 */
const BUNDLE_ROOT = 'plan'

function conceptSource(element: ArchitectureElement, parent = element.parentId, draft?: string): string {
  return renderArchitectureDocument({
    id: element.id, kind: element.kind, name: element.title,
    parent, description: element.description, overview: escapeMarkdownText(element.overview),
    technology: element.technology, status: 'draft', draft,
  })
}

function flowSource(flow: ArchitectureFlow, filenames: ReadonlyMap<string, string>, filename: string): string {
  const link = (id: string): string => `[${id}](${path.posix.relative(path.posix.dirname(filename), filenames.get(id)!)})`
  const rows = flow.steps.map(step => `| ${link(step.source)} | ${link(step.target)} | ${escapeTableCell(step.action)} |`)
  return sourceWithFrontmatter({ type: FLOW_TYPE, title: flow.title, description: flow.description, groma: { id: flow.id } },
    `\n\n${escapeMarkdownText(flow.overview)}\n\n## Steps\n\n| From | To | Action |\n| --- | --- | --- |\n${rows.join('\n')}\n`)
}

function selectedRelationships(model: ArchitectureModel, ids: ReadonlySet<string>, filenames: ReadonlyMap<string, string>): StoredRelationship[] {
  return model.relationships.filter(row => ids.has(row.sourceId) && ids.has(row.targetId)).map(row => ({
    source: row.sourceId, target: row.targetId, description: row.description,
    technology: row.technology, status: 'draft', authored: true, document: filenames.get(row.sourceId)!,
  }))
}

/**
 * A plan contains C4 meaning and parent identities, never source ownership or layout.
 * The command line calls this directly, so `to` may name a new directory anywhere on disk.
 */
export async function exportPlan(repositoryRoot: string, input: PlanExportInput): Promise<string> {
  const to = path.resolve(repositoryRoot, requireText(input.to, '--to'))
  // A fresh directory keeps an earlier bundle from contributing stale concepts.
  if (existsSync(to)) throw new Error(`"${input.to}" already exists; a plan is exported into a new directory`)
  const filesystem = GromaFileSystem.open(repositoryRoot)
  const files = await filesystem.withAccess(async () => {
    const records = await loadArchitecture(repositoryRoot)
    const model = buildArchitectureModel(records.documents)
    const ids = new Set(input.ids)
    if (ids.size === 0) throw new Error('select at least one element')
    const selected = [...ids].map(id => {
      const element = model.elements.find(candidate => candidate.id === id)
      if (!element) throw new Error(`unknown element "${id}"`)
      return element
    })
    const filenames = new Map(selected.map(element => [element.id, element.sourceFilename]))
    const rows = selectedRelationships(model, ids, filenames)
    const files = new Map<string, string>()
    const title = path.basename(to)
    files.set('plan.md', sourceWithFrontmatter({ type: PLAN_TYPE, title }, '\n\nArchitecture to implement.\n'))
    for (const element of selected) {
      files.set(filesystem.relative(element.sourceFilename), withStoredRelationships(
        conceptSource(element), element.sourceFilename, rows.filter(row => row.source === element.id), filenames,
      ))
    }
    for (const flow of resolveFlows(records.flows, model)) {
      if (!flow.steps.every(step => ids.has(step.source) && ids.has(step.target))) continue
      files.set(filesystem.relative(flow.sourceFilename), flowSource(flow, filenames, flow.sourceFilename))
    }
    const entries = [...new Set([...files.keys()].map(file => file.includes('/') ? `${file.split('/')[0]}/` : file))].sort()
    files.set('index.md', sourceWithFrontmatter({ okf_version: OKF_VERSION },
      `\n\n# Contents\n\n${entries.map(file => `- [${file}](<${file}>)`).join('\n')}\n`))
    return files
  })
  await mkdir(path.dirname(to), { recursive: true })
  await mkdir(to)
  for (const [filename, source] of files) {
    const destination = path.join(to, filename)
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, source)
  }
  return to
}

/**
 * The export of the live web map. Its destination arrives from a browser, so it must lie inside the
 * repository the map serves; everything else about the export is the same.
 */
export async function exportPlanIntoRepository(repositoryRoot: string, input: PlanExportInput): Promise<string> {
  const to = requireText(input.to, 'plan directory')
  const fromRoot = path.relative(repositoryRoot, path.resolve(repositoryRoot, to))
  if (fromRoot.split(path.sep)[0] === '..' || path.isAbsolute(fromRoot)) {
    throw new Error(`plan directory "${to}" must be inside the repository`)
  }
  return exportPlan(repositoryRoot, input)
}

async function readBundleFiles(directory: string, relative = ''): Promise<Map<string, string>> {
  const files = new Map<string, string>()
  for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
    const filename = path.posix.join(relative, entry.name)
    if (entry.isDirectory()) {
      for (const [name, source] of await readBundleFiles(directory, filename)) files.set(name, source)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.set(filename, await readFile(path.join(directory, filename), 'utf8'))
    }
  }
  return files
}

async function readPlan(directory: string): Promise<PlanBundle> {
  const files = await readBundleFiles(directory)
  const bundleDocument = (filename: string, source: string): Promise<ArchitectureDocument> =>
    parseArchitectureDocument(`${BUNDLE_ROOT}/${filename}`, source)
  const index = await bundleDocument('index.md', requireText(files.get('index.md'), 'plan index.md'))
  requireBundleIndex(index.frontmatter, index.sourceFilename)
  const plan = await bundleDocument('plan.md', requireText(files.get('plan.md'), 'plan.md'))
  const { type, title } = plan.frontmatter
  if (type !== PLAN_TYPE) throw new Error(`plan.md requires type ${PLAN_TYPE}`)
  const documents: ArchitectureDocument[] = [], flows: ArchitectureDocument[] = []
  for (const [filename, source] of files) {
    if (filename === 'index.md' || filename === 'plan.md') continue
    const document = await bundleDocument(filename, source)
    if (c4Kind(document.frontmatter.type)) documents.push(document)
    else if (document.frontmatter.type === FLOW_TYPE) flows.push(document)
    else throw new Error(`unsupported plan document "${filename}"`)
  }
  if (documents.length === 0) throw new Error('plan contains no elements')
  return { title: requireText(typeof title === 'string' ? title : undefined, 'plan title'), outcome: plan.body.trim(), documents, flows }
}

function validateImportIds(bundle: PlanBundle, records: ArchitectureRecords, existing: ArchitectureModel): string {
  const draftId = freeId(records, existing, bundle.title)
  for (const document of [...bundle.documents, ...bundle.flows]) {
    const id = String(requireGromaMapping(document.frontmatter, document.sourceFilename).id)
    freeId(records, existing, id)
    if (id === draftId) throw new Error(`id "${draftId}" also names the plan`)
  }
  return draftId
}

function importedDocuments(bundle: PlanBundle, existing: ArchitectureModel, parent: string | undefined, draft: string): ArchitectureDocument[] {
  const ids = new Set(bundle.documents.map(document => String(requireGromaMapping(document.frontmatter, document.sourceFilename).id)))
  const externalParents = new Set(bundle.documents.flatMap(document => {
    const parentId = requireGromaMapping(document.frontmatter, document.sourceFilename).parent
    return typeof parentId === 'string' && !ids.has(parentId) ? [parentId] : []
  }))
  for (const id of parent === undefined ? externalParents : [parent]) {
    if (!existing.elements.some(element => element.id === id)) throw new Error(`unknown parent "${id}"`)
  }
  return bundle.documents.map(document => {
    const groma = requireGromaMapping(document.frontmatter, document.sourceFilename)
    const parentId = parent !== undefined && externalParents.has(String(groma.parent)) ? parent : groma.parent
    return { ...document, frontmatter: { ...document.frontmatter, status: 'draft', groma: { ...groma, parent: parentId, code: undefined, draft } } }
  })
}

function importLocations(filesystem: GromaFileSystem, imported: ArchitectureElement[], existing: ArchitectureModel): Map<string, string> {
  const locations = new Map(existing.elements.map(element => [element.id, element.sourceFilename]))
  const pending = [...imported]
  while (pending.length) {
    const index = pending.findIndex(element => element.parentId === null || locations.has(element.parentId))
    if (index < 0) throw new Error(`unresolved parent for "${pending[0]!.id}"`)
    const element = pending.splice(index, 1)[0]!
    locations.set(element.id, architectureElementPath({ root: filesystem.sourceFilename(), kind: element.kind,
      id: element.id, external: element.external, parentSourceFilename: element.parentId ? locations.get(element.parentId) : undefined }))
  }
  return locations
}

function renderImport(bundle: PlanBundle, filesystem: GromaFileSystem, model: ArchitectureModel, existing: ArchitectureModel, draft: string): Map<string, string> {
  const ids = new Set(bundle.documents.map(document => String(requireGromaMapping(document.frontmatter, document.sourceFilename).id)))
  const imported = model.elements.filter(element => ids.has(element.id))
  const locations = importLocations(filesystem, imported, existing)
  const rows = selectedRelationships(model, ids, locations)
  const output = new Map<string, string>()
  for (const element of imported) {
    const filename = locations.get(element.id)!
    output.set(filename, withStoredRelationships(conceptSource(element, element.parentId, draft), filename,
      rows.filter(row => row.source === element.id), locations))
  }
  for (const flow of resolveFlows(bundle.flows, model)) {
    const filename = filesystem.sourceFilename(`flows/${flow.id}.md`)
    output.set(filename, flowSource(flow, locations, filename))
  }
  return output
}

/** Validate identities, containment, relationships and flows before the first write. */
export async function importPlan(repositoryRoot: string, input: PlanImportInput): Promise<string> {
  const bundle = await readPlan(path.resolve(repositoryRoot, input.path))
  const filesystem = GromaFileSystem.open(repositoryRoot)
  return filesystem.withAccess(async () => {
    const records = await loadArchitecture(repositoryRoot)
    const existing = buildArchitectureModel(records.documents)
    const draftId = validateImportIds(bundle, records, existing)
    const documents = importedDocuments(bundle, existing, input.parent, draftId)
    const model = buildArchitectureModel([...records.documents, ...documents])
    const output = renderImport(bundle, filesystem, model, existing, draftId)
    const finalDocuments = await Promise.all([...output].map(([filename, source]) => parseArchitectureDocument(filename, source)))
    const finalModel = buildArchitectureModel([...records.documents, ...finalDocuments.filter(document => c4Kind(document.frontmatter.type))])
    resolveFlows([...records.flows, ...finalDocuments.filter(document => document.frontmatter.type === FLOW_TYPE)], finalModel)
    const draftFilename = draftRecordPath(filesystem.sourceFilename(), draftId)
    output.set(draftFilename, renderDraftDocument({ id: draftId, title: bundle.title, outcome: bundle.outcome }))
    for (const filename of output.keys()) {
      if (filesystem.exists(filesystem.relative(filename))) throw new Error(`architecture document already exists at ${filename}`)
    }
    draftRecordOf(await parseArchitectureDocument(draftFilename, output.get(draftFilename)!))
    for (const [filename, source] of output) await filesystem.writeSource(filename, source)
    return draftId
  })
}
