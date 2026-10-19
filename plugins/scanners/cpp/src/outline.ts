import type { CodeDeclaration, CodeFile, CodeSymbol, CodeType, CodeVisibility, SourceReference } from '@groma/scanner'
import type { CppDeclarations, CppFunction, CppType } from './declarations.ts'

export interface CppFile extends CppDeclarations { file: string }

function symbol(value: { name: string; line: number }, visibility: CodeVisibility, names: readonly string[], typeName?: string): CodeSymbol {
  return { name: value.name, line: value.line, visibility, entry: value.name !== typeName && names.includes(value.name) }
}

function typeOutline(type: CppType, names: readonly string[]): CodeType {
  return { kind: 'type', ...symbol(type, type.visibility!, names), members: type.members
    .filter(member => member.visibility !== undefined)
    .map(member => symbol(member, member.visibility!, names, type.name)) }
}

function ownerName(fn: CppFunction, types: CppType[]): string | undefined {
  if (!fn.qualifier.length) return undefined
  const relative = [...fn.namespace, ...fn.qualifier].join('::')
  if (types.some(type => type.qualified === relative)) return relative
  const absolute = fn.qualifier.join('::')
  return types.some(type => type.qualified === absolute) ? absolute : undefined
}

function memberAccess(fn: CppFunction, owner: string, types: CppType[]): CodeVisibility | undefined {
  const declarations = types.filter(type => type.qualified === owner)
    .flatMap(type => type.members.filter(member => member.name === fn.name))
    .filter(member => fn.parameterCount === undefined || member.parameterCount === undefined
      || member.parameterCount === fn.parameterCount)
  const access = new Set(declarations.map(member => member.visibility))
  return access.size === 1 ? [...access][0] : undefined
}

function appendMember(result: CodeDeclaration[], entries: Map<string, CodeType>, fn: CppFunction, owner: string, types: CppType[], names: readonly string[]): void {
  const access = memberAccess(fn, owner, types)
  if (!access) return
  const type = types.find(type => type.qualified === owner && type.topLevel)
  if (!type?.visibility) return
  // The file may contain only a method definition. Its containing type remains Code, not a new component.
  let entry = entries.get(owner)
  if (!entry) {
    entry = { kind: 'type', ...symbol({ ...type, line: fn.line }, type.visibility!, names), members: [] }
    result.push(entry)
    entries.set(owner, entry)
  }
  entry.members.push(symbol(fn, access, names, type.name))
}

function appendFreeFunction(result: CodeDeclaration[], fn: CppFunction, file: CppFile, names: readonly string[], namespaces: Set<string>): void {
  if (fn.qualifier.length && !namespaces.has([...fn.namespace, ...fn.qualifier].join('::'))) return
  const access = functionAccess(fn, file.functions)
  if (access) result.push({ kind: 'function', ...symbol(fn, access, names) })
}

/** A static declaration proves later linkage only in the same scope with identical parameter syntax. */
function functionAccess(fn: CppFunction, declarations: CppFunction[]): CodeVisibility | undefined {
  if (fn.visibility !== 'public') return fn.visibility
  const prior = declarations.filter(value => value.position < fn.position && value.qualified === fn.qualified
    && !value.owner && value.topLevel === fn.topLevel && value.privateNamespace === fn.privateNamespace
    && value.visibility === 'private')
  if (!prior.length) return fn.visibility
  return prior.some(value => !value.conditional && value.parameters === fn.parameters) ? 'private' : undefined
}

function visibleTypes(file: CppFile, context: CppFile[]): CppType[] {
  const local = new Set(file.types.filter(type => type.visibility === 'private').map(type => type.qualified))
  return context.flatMap(source => source === file ? source.types
    : source.types.filter(type => type.visibility !== 'private' && !local.has(type.qualified)))
}

function outlineFile(file: CppFile, context: CppFile[], names: readonly string[]): CodeDeclaration[] {
  const types = visibleTypes(file, context)
  const namespaces = new Set(context.flatMap(file => file.namespaces))
  const result: CodeDeclaration[] = []
  const entries = new Map<string, CodeType>()
  for (const value of [...file.types, ...file.functions].sort((a, b) => a.position - b.position)) {
    if (!value.topLevel) continue
    if ('members' in value) {
      if (value.visibility) {
        const entry = typeOutline(value, names)
        result.push(entry)
        entries.set(value.qualified, entry)
      }
      continue
    }
    if (value.owner) continue // Its lexical type already owns the member.
    const owner = ownerName(value, types)
    if (owner) appendMember(result, entries, value, owner, types, names)
    else appendFreeFunction(result, value, file, names, namespaces)
  }
  return result
}

/** Selected context can prove a separate definition's class and member access; otherwise omit that outline member. */
export function cppOutline(files: CppFile[], references: readonly SourceReference[]): CodeFile[] {
  return references.flatMap(reference => {
    const file = files.find(file => file.file === reference.file)
    if (!file) return []
    const declarations = outlineFile(file, files, reference.symbols)
    return declarations.length ? [{ file: file.file, declarations }] : []
  })
}
