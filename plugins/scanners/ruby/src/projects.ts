import path from 'node:path'
import type { ScanRoot } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { argumentsOf, literal, literalList, parameterNames, statements } from './syntax.ts'

export interface ProjectDeclaration {
  file: string
  name?: string
  commands: string[]
}

export function projectDeclaration(root: Node, file: string): ProjectDeclaration {
  const result: ProjectDeclaration = { file, commands: [] }
  if (!file.endsWith('.gemspec')) return result
  for (const node of root.namedChildren) {
    if (node.type !== 'call' || node.childForFieldName('receiver')?.text !== 'Gem::Specification') continue
    if (node.childForFieldName('method')?.text !== 'new') continue
    const block = node.childForFieldName('block')
    if (block) readGemSpec(block, result)
  }
  return result
}

function readGemSpec(block: Node, result: ProjectDeclaration): void {
  const receiver = parameterNames(block.childForFieldName('parameters'))[0]
  let bindir = 'bin'
  let executables: string[] = []
  for (const statement of statements(block)) {
    if (statement.type !== 'assignment') continue
    const left = statement.childForFieldName('left')
    if (left?.childForFieldName('receiver')?.text !== receiver) continue
    const value = statement.childForFieldName('right')
    switch (left?.childForFieldName('method')?.text) {
      case 'name': result.name = literal(value); break
      case 'bindir': bindir = literal(value) ?? ''; break
      case 'executables': executables = literalList(value) ?? []; break
    }
  }
  if (bindir) result.commands = executables.map(name => path.posix.join(path.posix.dirname(result.file), bindir, name))
}

export function rubyProjects(repositoryRoot: string, declarations: ProjectDeclaration[], files: readonly string[]) {
  const roots = new Map<string, ScanRoot>()
  for (const declaration of declarations) {
    const directory = path.posix.dirname(declaration.file)
    if (roots.has(directory) && !declaration.name) continue
    roots.set(directory, { id: directory, kind: 'project',
      name: declaration.name ?? (directory === '.' ? path.basename(repositoryRoot) : path.posix.basename(directory)),
      file: declaration.file })
  }
  const nearest = (file: string, excluded?: string) => [...roots.keys()]
    .filter(directory => directory !== excluded && (directory === '.' || file.startsWith(`${directory}/`)))
    .sort((a, b) => b.length - a.length)[0]
  const memberships = new Map<string, string>()
  for (const file of files) {
    const owner = nearest(file) ?? '.'
    if (!roots.has(owner)) roots.set(owner, { id: owner, kind: 'source-group', name: path.basename(repositoryRoot) })
    memberships.set(file, owner)
  }
  for (const [directory, root] of roots) {
    const parent = nearest(`${directory}/`, directory)
    if (parent) root.parent = parent
  }
  return { roots: [...roots.values()], memberships }
}

export function requiredLiteral(node: Node): { target: string; relative: boolean } | undefined {
  if (node.type !== 'call' || node.childForFieldName('receiver')) return undefined
  const name = node.childForFieldName('method')?.text
  if (name !== 'require' && name !== 'require_relative') return undefined
  const target = literal(argumentsOf(node)[0])
  return target === undefined ? undefined : { target, relative: name === 'require_relative' }
}

