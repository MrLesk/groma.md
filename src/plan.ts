import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { escapeMarkdownText, escapeTableCell } from './architecture-markdown.ts'
import { buildArchitectureModel, draftRecordOf, freeId } from './architecture-model.ts'
import { architectureElementPath, draftRecordPath } from './architecture-path.ts'
import { loadArchitecture, parseArchitectureDocument } from './architecture-reader.ts'
import { resolveFlows } from './flow-model.ts'
import { GromaFileSystem } from './groma-filesystem.ts'
import { renderDraftDocument, renderFlowDocument, sourceWithFrontmatter } from './markdown-emitter.ts'
import { requireText } from './naming.ts'
import { c4Kind, FLOW_TYPE, PLAN_TYPE, renderBundleIndex, requireBundleIndex, requireGromaMapping } from './okf-profile.ts'
import { isDeclaredConcept } from './relationship-markdown.ts'
import { withStoredRelationships } from './relationship-storage.ts'
import type {
  ArchitectureDocument, ArchitectureElement, ArchitectureFlow, ArchitectureModel, ArchitectureRecords, C4Kind,
  RelationshipConnection,
} from './types.ts'

export interface PlanExportInput { ids: string[]; to: string }
export interface PlanImportInput { path: string; parent?: string }

/** The documents of one sort in a bundle, with the ids they declare. */
interface BundleDocuments {
  documents: ArchitectureDocument[]
  /** Every groma.id, read once. An id that is not text is absent; the model refuses that document when it is built. */
  ids: Set<string>
}

interface PlanBundle {
  title: string
  /** The Markdown body of plan.md. It becomes the outcome of the draft record. */
  outcome: string
  elements: BundleDocuments
  flows: BundleDocuments
}

/**
 * Bundle documents are named as if this were their architecture directory, because links between documents and
 * the flows/ folder are resolved below one. The name appears in import errors and is never a path on disk.
 */
const BUNDLE_ROOT = 'plan'

/** True when `target` is `directory` or lies below it. Both are compared as written; links are not followed. */
function isInside(directory: string, target: string): boolean {
  const fromDirectory = path.relative(directory, target)
  return fromDirectory.split(path.sep)[0] !== '..' && !path.isAbsolute(fromDirectory)
}

/**
 * An element document as a plan carries it, in a bundle or after import. The Markdown body travels as written.
 * Only what belongs to one repository is replaced: software becomes a draft while a person or an external system
 * stays a stable declaration, code ownership, the group and an earlier draft tag are dropped, and the
 * relationship sections are rebuilt from the plan's draft rows with links that fit `filename`.
 */
function plannedSource(input: {
  document: ArchitectureDocument
  element: ArchitectureElement
  /** Where the document will be stored. */
  filename: string
  rows: readonly RelationshipConnection[]
  /** The document path of every element a row may name. */
  filenames: ReadonlyMap<string, string>
  /** The draft record an imported element is tagged with. */
  draft?: string
}): string {
  const { document, element, draft } = input
  const { code: _code, group: _group, draft: _draft, ...groma } = requireGromaMapping(document.frontmatter, document.sourceFilename)
  const frontmatter = {
    ...document.frontmatter,
    status: isDeclaredConcept(element) ? 'stable' : 'draft',
    groma: draft === undefined ? groma : { ...groma, draft },
  }
  return withStoredRelationships(sourceWithFrontmatter(frontmatter, document.body), input.filename,
    input.rows.filter(row => row.source === element.id), input.filenames)
}

/**
 * A flow is written again from its meaning, because the links of its Steps table depend on where the elements
 * are stored. Its overview is the text the reader decoded, so formatting inside it is not carried.
 */
function flowSource(flow: ArchitectureFlow, filenames: ReadonlyMap<string, string>, filename: string): string {
  const link = (id: string): string => `[${id}](${path.posix.relative(path.posix.dirname(filename), filenames.get(id)!)})`
  const rows = flow.steps.map(step => `| ${link(step.source)} | ${link(step.target)} | ${escapeTableCell(step.action)} |`)
  return renderFlowDocument({
    id: flow.id, title: flow.title, description: flow.description, overview: escapeMarkdownText(flow.overview),
    steps: `| From | To | Action |\n| --- | --- | --- |\n${rows.join('\n')}`,
  })
}

/** The relationships inside the selection, as the draft rows a plan carries between element documents. */
function selectedRelationships(model: ArchitectureModel, ids: ReadonlySet<string>): RelationshipConnection[] {
  return model.relationships.filter(row => ids.has(row.sourceId) && ids.has(row.targetId)).map(row => ({
    source: row.sourceId, target: row.targetId, description: row.description,
    technology: row.technology, status: 'draft', authored: true,
  }))
}

/**
 * A plan contains C4 meaning and parent identities, never source ownership or layout.
 * The command line calls this directly, so `to` may name a new directory anywhere outside the Groma directory.
 */
export async function exportPlan(repositoryRoot: string, input: PlanExportInput): Promise<string> {
  const filesystem = GromaFileSystem.open(repositoryRoot)
  const to = path.resolve(repositoryRoot, requireText(input.to, '--to'))
  // A fresh directory keeps an earlier bundle from contributing stale concepts.
  if (existsSync(to)) throw new Error(`"${input.to}" already exists; a plan is exported into a new directory`)
  // Every Markdown file below the Groma directory is read as architecture, so a bundle there would break the next load.
  if (isInside(filesystem.absolute(), to)) {
    throw new Error(`"${input.to}" is inside ${filesystem.directory}/, where a plan would be read as architecture`)
  }
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
    const documents = new Map(records.documents.map(document => [document.sourceFilename, document]))
    const filenames = new Map(selected.map(element => [element.id, element.sourceFilename]))
    const rows = selectedRelationships(model, ids)
    const files = new Map<string, string>()
    files.set('plan.md', sourceWithFrontmatter({ type: PLAN_TYPE, title: path.basename(to) }, '\n\nArchitecture to implement.\n'))
    for (const element of selected) {
      const filename = element.sourceFilename
      files.set(filesystem.relative(filename), plannedSource({ document: documents.get(filename)!, element, filename, rows, filenames }))
    }
    for (const flow of resolveFlows(records.flows, model)) {
      if (!flow.steps.every(step => ids.has(step.source) && ids.has(step.target))) continue
      files.set(filesystem.relative(flow.sourceFilename), flowSource(flow, filenames, flow.sourceFilename))
    }
    // The index lists the top level of the bundle: plan.md and each first folder.
    const topLevel = new Set([...files.keys()].map(file => file.includes('/') ? `${file.split('/')[0]}/` : file))
    files.set('index.md', renderBundleIndex([...topLevel]))
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
 * The export of the live web map, whose destination arrives from a browser. Beyond what exportPlan refuses (an
 * existing directory, the Groma directory), the resolved path must lie inside the repository the map serves.
 */
export async function exportPlanIntoRepository(repositoryRoot: string, input: PlanExportInput): Promise<string> {
  const to = requireText(input.to, 'plan directory')
  if (!isInside(path.resolve(repositoryRoot), path.resolve(repositoryRoot, to))) {
    throw new Error(`plan directory "${to}" must be inside the repository`)
  }
  return exportPlan(repositoryRoot, input)
}

/** Every Markdown file of a bundle, as a path relative to it. */
async function bundleFilenames(directory: string, relative = ''): Promise<string[]> {
  const filenames: string[] = []
  for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
    const filename = path.posix.join(relative, entry.name)
    if (entry.isDirectory()) filenames.push(...await bundleFilenames(directory, filename))
    else if (entry.isFile() && entry.name.endsWith('.md')) filenames.push(filename)
  }
  return filenames
}

/** index.md and plan.md make a directory a plan. */
const planRecordFiles = ['index.md', 'plan.md']

async function readBundleDocument(directory: string, filename: string): Promise<ArchitectureDocument> {
  return parseArchitectureDocument(`${BUNDLE_ROOT}/${filename}`, await readFile(path.join(directory, filename), 'utf8'))
}

/** The two root files are required before anything below the directory is read. */
async function readPlanRecord(directory: string): Promise<Pick<PlanBundle, 'title' | 'outcome'>> {
  for (const filename of planRecordFiles) {
    if (!existsSync(path.join(directory, filename))) throw new Error(`${directory} is not a plan: it has no ${filename}`)
  }
  const index = await readBundleDocument(directory, 'index.md')
  requireBundleIndex(index.frontmatter, index.sourceFilename)
  const plan = await readBundleDocument(directory, 'plan.md')
  const { type, title } = plan.frontmatter
  if (type !== PLAN_TYPE) throw new Error(`plan.md requires type ${PLAN_TYPE}`)
  return { title: requireText(typeof title === 'string' ? title : undefined, 'plan title'), outcome: plan.body.trim() }
}

async function readPlan(directory: string): Promise<PlanBundle> {
  const record = await readPlanRecord(directory)
  const elements: BundleDocuments = { documents: [], ids: new Set() }
  const flows: BundleDocuments = { documents: [], ids: new Set() }
  for (const filename of await bundleFilenames(directory)) {
    if (planRecordFiles.includes(filename)) continue
    const document = await readBundleDocument(directory, filename)
    const sort = c4Kind(document.frontmatter.type) ? elements : document.frontmatter.type === FLOW_TYPE ? flows : undefined
    if (sort === undefined) throw new Error(`unsupported plan document "${filename}"`)
    sort.documents.push(document)
    const { id } = requireGromaMapping(document.frontmatter, document.sourceFilename)
    if (typeof id === 'string') sort.ids.add(id)
  }
  if (elements.documents.length === 0) throw new Error('plan contains no elements')
  return { ...record, elements, flows }
}

/** The id of the plan's draft record, once it and every id in the bundle are known to be free in this repository. */
function requireFreeIds(bundle: PlanBundle, records: ArchitectureRecords, existing: ArchitectureModel): string {
  const draftId = freeId(records, existing, bundle.title)
  for (const id of [...bundle.elements.ids, ...bundle.flows.ids]) {
    // Called for its refusal only: freeId throws when an element, a flow or a draft record holds the id, or it is reserved.
    freeId(records, existing, id)
    if (id === draftId) throw new Error(`id "${draftId}" also names the plan`)
  }
  return draftId
}

/** With --parent, a parent that the bundle names but does not contain becomes that element of the destination. */
function withDestinationParent(elements: BundleDocuments, parent: string | undefined): ArchitectureDocument[] {
  if (parent === undefined) return elements.documents
  return elements.documents.map(document => {
    const groma = requireGromaMapping(document.frontmatter, document.sourceFilename)
    if (typeof groma.parent !== 'string' || elements.ids.has(groma.parent)) return document
    return { ...document, frontmatter: { ...document.frontmatter, groma: { ...groma, parent } } }
  })
}

/** A path is built from the path of the parent, so parents are placed first. */
const placementOrder: C4Kind[] = ['actor', 'system', 'container', 'component']

/** The document path of every existing element and, at its canonical place, of every imported one. */
function importLocations(root: string, imported: readonly ArchitectureElement[], existing: ArchitectureModel): Map<string, string> {
  const locations = new Map(existing.elements.map(element => [element.id, element.sourceFilename]))
  const parentsFirst = [...imported].sort((left, right) => placementOrder.indexOf(left.kind) - placementOrder.indexOf(right.kind))
  for (const element of parentsFirst) {
    locations.set(element.id, architectureElementPath({
      root, kind: element.kind, id: element.id, external: element.external,
      parentSourceFilename: element.parentId === null ? undefined : locations.get(element.parentId),
    }))
  }
  return locations
}

/** Validate identities, containment, relationships and flows before the first write. */
export async function importPlan(repositoryRoot: string, input: PlanImportInput): Promise<string> {
  const bundle = await readPlan(path.resolve(repositoryRoot, input.path))
  const filesystem = GromaFileSystem.open(repositoryRoot)
  return filesystem.withAccess(async () => {
    const records = await loadArchitecture(repositoryRoot)
    const existing = buildArchitectureModel(records.documents)
    const draftId = requireFreeIds(bundle, records, existing)
    const root = filesystem.sourceFilename()
    // The first model places the elements: read beside the existing architecture, each has a kind and a parent, and so a path.
    const documents = new Map(withDestinationParent(bundle.elements, input.parent).map(document => [document.sourceFilename, document]))
    const placed = buildArchitectureModel([...records.documents, ...documents.values()])
    const imported = placed.elements.filter(element => documents.has(element.sourceFilename))
    const locations = importLocations(root, imported, existing)
    const rows = selectedRelationships(placed, bundle.elements.ids)
    const output = new Map<string, string>()
    for (const element of imported) {
      const filename = locations.get(element.id)!
      output.set(filename, plannedSource({
        document: documents.get(element.sourceFilename)!, element, filename, rows, filenames: locations, draft: draftId,
      }))
    }
    for (const flow of resolveFlows(bundle.flows.documents, placed)) {
      const filename = `${root}/flows/${flow.id}.md`
      output.set(filename, flowSource(flow, locations, filename))
    }
    // The second model validates what will be stored: the same documents at their destination paths.
    const stored = await Promise.all([...output].map(([filename, source]) => parseArchitectureDocument(filename, source)))
    const model = buildArchitectureModel([...records.documents, ...stored.filter(document => c4Kind(document.frontmatter.type))])
    resolveFlows([...records.flows, ...stored.filter(document => document.frontmatter.type === FLOW_TYPE)], model)
    const draftFilename = draftRecordPath(root, draftId)
    const draftSource = renderDraftDocument({ id: draftId, title: bundle.title, outcome: bundle.outcome })
    draftRecordOf(await parseArchitectureDocument(draftFilename, draftSource))
    output.set(draftFilename, draftSource)
    for (const filename of output.keys()) {
      if (filesystem.exists(filesystem.relative(filename))) throw new Error(`architecture document already exists at ${filename}`)
    }
    for (const [filename, source] of output) await filesystem.writeSource(filename, source)
    return draftId
  })
}
