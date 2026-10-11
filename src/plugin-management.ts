import { readPluginConfig, writePluginConfig, type PluginConfig } from './scanner/modules/config.ts'
import {
  installPluginPackage,
  preparePluginUpdate,
  requestedPluginSource,
  restorePluginPackage,
  type PluginInstallOptions,
  type PluginKind,
  type ResolvedPluginPackage,
} from './scanner/modules/package.ts'
import { hostIncompatibility } from './work-sources.ts'

/** A selection as a command reports it after adding or updating it. */
export interface PluginSelection {
  id: string
  kind: PluginKind
  source: string
  status: 'found'
}

/**
 * A work source this groma.md version cannot load is refused with the reason. A scanner passes: its compatibility
 * is judged from its discovery metadata when the settings are read.
 */
function requireCompatibleHost(resolved: ResolvedPluginPackage): void {
  const incompatible = resolved.kind === 'workSource' ? hostIncompatibility(resolved) : undefined
  if (incompatible) throw new Error(incompatible)
}

/** Every selection with the kind of its section. A scanner command passes its kind and sees no other section. */
function selections(config: PluginConfig, kind?: PluginKind): { kind: PluginKind; entry: { id: string; source: string } }[] {
  return [
    ...config.scanners.map(entry => ({ kind: 'scanner' as const, entry })),
    ...config.workSources.map(entry => ({ kind: 'workSource' as const, entry })),
  ].filter(selected => kind === undefined || selected.kind === kind)
}

function selection(config: PluginConfig, id: string, kind?: PluginKind) {
  const selected = selections(config, kind).find(candidate => candidate.entry.id === id)
  if (!selected) throw new Error(`${kind ?? 'plugin'} is not configured: ${id}`)
  return selected
}

/** The config with a newly installed package selected in the section of its kind. */
function withAdded(config: PluginConfig, source: string, resolved: ResolvedPluginPackage): PluginConfig {
  if (resolved.kind === 'workSource') return { ...config, workSources: [...config.workSources, { id: resolved.id, source }] }
  // A scanner entry starts with the include globs and default exclusions its package declares; people edit them afterwards.
  const scanner = { id: resolved.id, source, include: resolved.include, ...(resolved.exclude?.length ? { exclude: resolved.exclude } : {}) }
  return { ...config, scanners: [...config.scanners, scanner] }
}

/**
 * Installs the package a source names and selects it. Its manifest decides the kind unless the caller accepts only
 * one. plugins.json refuses a repeated id, a repeated scanner source and a second work source when it is written.
 */
export async function addPlugin(
  root: string, input: string, options: PluginInstallOptions = {}, kind?: PluginKind,
): Promise<PluginSelection> {
  const source = await requestedPluginSource(root, input, options, kind)
  const installed = await installPluginPackage(source, options, kind)
  requireCompatibleHost(installed.package)
  await writePluginConfig(root, withAdded(await readPluginConfig(root), installed.source, installed.package))
  return { id: installed.package.id, kind: installed.package.kind, source: installed.source, status: 'found' }
}

/** Ids are unique across sections, so removing by id drops exactly the one entry, whichever section holds it. */
export async function removePlugin(root: string, id: string, kind?: PluginKind): Promise<string> {
  const config = await readPluginConfig(root)
  selection(config, id, kind)
  await writePluginConfig(root, {
    ...config,
    scanners: config.scanners.filter(entry => entry.id !== id),
    workSources: config.workSources.filter(entry => entry.id !== id),
  })
  return id
}

/** Moves one selection to another release of the same package; everything else in its entry stays. */
export async function updatePlugin(
  root: string, id: string, input?: string, options: PluginInstallOptions = {}, kind?: PluginKind,
): Promise<PluginSelection> {
  const config = await readPluginConfig(root)
  const selected = selection(config, id, kind)
  const installed = await preparePluginUpdate(root, selected.entry, input, options, selected.kind)
  requireCompatibleHost(installed.package)
  // As in removePlugin, the id finds its one entry in whichever section holds it.
  await writePluginConfig(root, {
    ...config,
    scanners: config.scanners.map(entry => entry.id === id ? { ...entry, source: installed.source } : entry),
    workSources: config.workSources.map(entry => entry.id === id ? { ...entry, source: installed.source } : entry),
  })
  return { id, kind: selected.kind, source: installed.source, status: 'found' }
}

async function restore(root: string, selected: ReturnType<typeof selection>, options: PluginInstallOptions): Promise<boolean> {
  const restored = await restorePluginPackage(root, selected.entry, options, selected.kind)
  requireCompatibleHost(restored.package)
  return restored.installed
}

/** Puts one selection's package back on this computer and reports whether anything was installed. */
export async function restorePlugin(root: string, id: string, options: PluginInstallOptions = {}): Promise<boolean> {
  return restore(root, selection(await readPluginConfig(root), id), options)
}

/** Restores every selection, the first failure stopping the rest, and counts the packages installed. */
export async function installPlugins(root: string, options: PluginInstallOptions = {}, kind?: PluginKind): Promise<number> {
  let installed = 0
  for (const selected of selections(await readPluginConfig(root), kind)) {
    if (await restore(root, selected, options)) installed += 1
  }
  return installed
}
