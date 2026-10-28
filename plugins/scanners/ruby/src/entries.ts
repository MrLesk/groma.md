import path from 'node:path'
import type { ScanEntryPoint } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import type { ProjectDeclaration } from './projects.ts'
import { requiredLiteral } from './projects.ts'
import { argumentsOf, literalList } from './syntax.ts'

export interface LaunchEvidence {
  requires: { target: string; relative: boolean }[]
  main: boolean
  rack: boolean
  railsRun: boolean
  rails: boolean
  autoloadLib?: string[]
}

export function launchEvidence(root: Node): LaunchEvidence {
  const result: LaunchEvidence = { requires: [], main: false, rack: false, railsRun: false, rails: false }
  function visit(node: Node): void {
    if (['method', 'singleton_method', 'lambda', 'block', 'do_block'].includes(node.type)) return
    const required = requiredLiteral(node)
    if (required) result.requires.push(required)
    if (node.type === 'if') result.main ||= mainGuard(node.childForFieldName('condition'))
    if (node.type === 'class') result.rails ||= node.childForFieldName('superclass')?.text.replace(/\s/g, '') === '<Rails::Application'
    if (node.type === 'call') inspectCall(node, result)
    for (const child of node.namedChildren) visit(child)
  }
  visit(root)
  return result
}

function mainGuard(node: Node | null): boolean {
  if (node?.type !== 'binary' || node.childForFieldName('operator')?.text !== '==') return false
  const sides = [node.childForFieldName('left')?.text, node.childForFieldName('right')?.text]
  return sides.includes('__FILE__') && sides.some(side => side === '$PROGRAM_NAME' || side === '$0')
}

function inspectCall(node: Node, result: LaunchEvidence): void {
  const name = node.childForFieldName('method')?.text
  const receiver = node.childForFieldName('receiver')
  if (name === 'run' && !receiver && argumentsOf(node).length === 1) {
    result.rack = true
    result.railsRun ||= argumentsOf(node)[0]?.text === 'Rails.application'
  }
  if (name !== 'autoload_lib' || receiver?.text !== 'config') return
  const options = argumentsOf(node)
  const ignore = options.find(option => option.childForFieldName('key')?.text === 'ignore')?.childForFieldName('value')
  result.autoloadLib = ignore ? literalList(ignore) : []
}

interface EntrySource { file: string; launch: LaunchEvidence }

export function rubyEntries(sources: EntrySource[], declarations: ProjectDeclaration[], memberships: Map<string, string>): ScanEntryPoint[] {
  const byFile = new Map(sources.map(source => [source.file, source]))
  function closure(file: string): string[] {
    const project = memberships.get(file)!
    const pending = [file]
    const found = new Set<string>()
    while (pending.length) {
      const current = pending.pop()!
      if (found.has(current) || memberships.get(current) !== project) continue
      found.add(current)
      pending.push(...requiredTargets(current, project, byFile))
    }
    return [...found].sort()
  }
  function entry(file: string, declaration: string, name: string): ScanEntryPoint {
    let files = closure(file)
    if (byFile.get(file)!.launch.railsRun) files = railsMembers(files, sources, memberships)
    return { file, declaration, name, files }
  }
  const entries = sources.flatMap(source => {
    if (source.launch.main) return [entry(source.file, source.file, path.posix.basename(source.file, '.rb'))]
    if (path.posix.basename(source.file) === 'config.ru' && source.launch.rack) {
      return [entry(source.file, source.file, path.posix.basename(path.posix.dirname(source.file)) === '.'
        ? 'Rack application' : path.posix.basename(path.posix.dirname(source.file)))]
    }
    return []
  })
  for (const declaration of declarations) for (const file of declaration.commands) {
    if (byFile.has(file)) entries.push(entry(file, declaration.file, path.posix.basename(file)))
  }
  return entries
}

function requiredTargets(file: string, project: string, sources: Map<string, EntrySource>): string[] {
  return sources.get(file)!.launch.requires.flatMap(required => {
    const bases = required.relative ? [path.posix.dirname(file)] : [project, path.posix.join(project, 'lib')]
    const candidates = bases.flatMap(base => [path.posix.join(base, required.target), path.posix.join(base, `${required.target}.rb`)])
    const targets = [...new Set(candidates.filter(candidate => sources.has(candidate)))]
    return targets.length === 1 ? targets : []
  })
}

/** A positive Rack launch plus Rails::Application declares Rails' own autoload/configuration inputs. */
function railsMembers(closure: string[], sources: EntrySource[], memberships: Map<string, string>): string[] {
  const application = sources.find(source => closure.includes(source.file) && source.launch.rails)
  if (!application) return closure
  const project = memberships.get(application.file)!
  const prefix = project === '.' ? '' : `${project}/`
  const ignore = application.launch.autoloadLib
  const files = sources.filter(source => {
    if (memberships.get(source.file) !== project) return false
    const local = source.file.slice(prefix.length)
    if (local.startsWith('app/') || local.startsWith('config/initializers/') || local.startsWith('config/environments/')) return true
    if (local === 'config/routes.rb') return true
    return ignore !== undefined && local.startsWith('lib/') && !ignore.some(folder => local.startsWith(`lib/${folder}/`))
  }).map(source => source.file)
  return [...new Set([...closure, ...files])].sort()
}

