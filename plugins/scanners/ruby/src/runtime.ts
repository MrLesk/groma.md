import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { CORE_SCHEMA, load, mergeTag } from 'js-yaml'
import type { ScanDataStore, ScanEntryPoint, ScanHostedService } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { parseRuby } from './parser.ts'
import { argumentsOf, literal } from './syntax.ts'
import { walk } from './http-values.ts'

const dynamic = '__groma_unresolved_expression__'
const mapping = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}

function productionSource(source: string): string {
  let selected = false
  return source.split('\n').filter(line => {
    const section = /^([a-zA-Z_][\w-]*):/.exec(line)?.[1]
    if (section) selected = section === 'default' || section === 'production'
    return selected
  }).join('\n')
}

async function yaml(root: string, file: string, production = false): Promise<Record<string, unknown>> {
  const text = await readFile(path.join(root, file), 'utf8')
  const source = production ? productionSource(text) : text
  // Rails interpolates Ruby before parsing YAML; scanning deliberately leaves it unresolved.
  return mapping(load(source.replace(/<%=[\s\S]*?%>/g, dynamic), { schema: CORE_SCHEMA.withTags(mergeTag) }))
}

function productionDatabases(document: Record<string, unknown>): ScanDataStore['databases'] {
  const production = mapping(document.production)
  const roles = production.adapter ? { primary: production } : production
  return Object.entries(roles).flatMap(([role, value]) => {
    const database = mapping(value)
    const name = database.database
    return database.adapter === 'postgresql' && typeof name === 'string' && !name.includes(dynamic)
      ? [{ role, name }] : []
  })
}

function pumaQueue(root: Node): boolean {
  let configured = false
  walk(root, node => {
    if (node.type !== 'if_modifier') return
    const condition = node.childForFieldName('condition')
    const call = node.childForFieldName('body')
    if (condition?.type !== 'element_reference' || condition.childForFieldName('object')?.text !== 'ENV') return
    if (!condition.namedChildren.some(child => literal(child) === 'SOLID_QUEUE_IN_PUMA')) return
    configured ||= call?.type === 'call' && call.childForFieldName('method')?.text === 'plugin'
      && argumentsOf(call).length === 1 && literal(argumentsOf(call)[0]) === 'solid_queue'
  })
  return configured
}

function solidQueue(root: Node): boolean {
  let configured = false
  walk(root, node => {
    if (node.type !== 'assignment') return
    configured ||= node.childForFieldName('left')?.text === 'config.active_job.queue_adapter'
      && literal(node.childForFieldName('right')) === 'solid_queue'
  }, true)
  return configured
}

async function hostedQueue(root: string, entry: ScanEntryPoint, selected: Set<string>): Promise<ScanHostedService[]> {
  const prefix = path.posix.dirname(entry.file)
  const deploy = path.posix.join(prefix, 'config/deploy.yml')
  const puma = path.posix.join(prefix, 'config/puma.rb')
  const production = path.posix.join(prefix, 'config/environments/production.rb')
  const declarations = [deploy, puma, production]
  if (!declarations.every(file => selected.has(file))) return []
  const environment = mapping(mapping((await yaml(root, deploy)).env).clear)
  if (environment.SOLID_QUEUE_IN_PUMA !== true) return []
  if (!await parseRuby(puma, await readFile(path.join(root, puma), 'utf8'), pumaQueue)) return []
  if (!await parseRuby(production, await readFile(path.join(root, production), 'utf8'), solidQueue)) return []
  return [{ entry: entry.file, declarations, environment: 'production', name: 'Solid Queue', host: 'Puma' }]
}

/** Read only selected configuration for entries already proven to launch Rails. */
export async function railsRuntime(root: string, selected: readonly string[], entries: ScanEntryPoint[]) {
  const files = new Set(selected)
  const dataStores: ScanDataStore[] = []
  const hostedServices: ScanHostedService[] = []
  for (const entry of entries) {
    const file = path.posix.join(path.posix.dirname(entry.file), 'config/database.yml')
    if (files.has(file)) {
      const databases = productionDatabases(await yaml(root, file, true))
      if (databases.length) dataStores.push({ entry: entry.file, file, environment: 'production', technology: 'PostgreSQL', databases })
    }
    hostedServices.push(...await hostedQueue(root, entry, files))
  }
  return { dataStores, hostedServices }
}
