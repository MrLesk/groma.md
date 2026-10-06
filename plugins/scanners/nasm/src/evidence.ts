import type { ScanInvocation, ScanOperation } from '@groma/scanner'
import type { AssemblySource, Preprocessed } from './preprocess.ts'

interface Location { file: string; line: number; position: number }
interface Label extends Location { name: string; local: boolean }
interface Call extends Location { target?: string }
type Event = { label: Label } | { call: Call } | { reset: true }

export interface Routine extends ScanOperation { line: number; local: boolean; exported: boolean }
export interface AssemblyEvidence { routines: Routine[]; calls: ScanInvocation[] }

const identifier = '[a-zA-Z_.$?@][a-zA-Z_0-9.$?@#~]*'
const labelPattern = new RegExp(`^(${identifier}):\\s*(.*)$`)
const directTarget = new RegExp(`^${identifier}$`)
const register = /^(?:[re]?(?:ax|bx|cx|dx|si|di|bp|sp)|r(?:[89]|1[0-5])(?:d|w|b)?)$/i

function location(sources: Map<string, AssemblySource>, file: string, line: number): Location {
  const source = sources.get(file)
  const original = source?.lines[line - 1]
  if (original === undefined) throw new Error(`nasm: source location is outside selected files: ${file}:${line}`)
  return { file, line, position: source!.offsets[line - 1]! + original.search(/\S|$/) }
}

function qualify(name: string, scope: string): string {
  return name.startsWith('.') ? scope + name : name
}

function* sourceLines(input: Preprocessed) {
  let file = '', line = 0, increment = 1
  for (const raw of input.text.split(/\r?\n/)) {
    const directive = /^%line (\d+)\+(\d+) (.+)$/.exec(raw)
    if (directive) {
      file = directive[3]!.replace(/^["']|["']$/g, '').replaceAll('\\', '/')
      line = Number(directive[1]); increment = Number(directive[2])
      continue
    }
    const text = raw.trim()
    const currentLine = line
    line += increment
    if (text) yield { text, at: location(input.sources, file, currentLine) }
  }
}

interface AssemblyState {
  events: Event[]; labels: Map<string, Label>; exported: Set<string>; code: boolean; scope: string
}

function declaration(text: string, state: AssemblyState): boolean {
  const section = /^\[?\s*(?:section|segment)\s+(\S+)/i.exec(text)
  if (section) {
    state.code = section[1]!.replace(/\]$/, '') === '.text'
    state.events.push({ reset: true })
    return true
  }
  const global = /^\[?\s*global\s+([^\]]+)/i.exec(text)
  if (!global) return false
  for (const name of global[1]!.split(',')) state.exported.add(name.trim().split(/[:\s]/)[0]!)
  return true
}

function readCode(text: string, at: Location, state: AssemblyState): void {
  const match = labelPattern.exec(text)
  if (match) {
    const local = match[1]!.startsWith('.')
    if (!local) state.scope = match[1]!
    const name = qualify(match[1]!, state.scope)
    const label = { ...at, name, local }
    if (state.labels.has(name)) throw new Error(`nasm: duplicate code label ${name}`)
    state.labels.set(name, label)
    state.events.push({ label })
    text = match[2]!
  }
  const call = /^call\s+(.+)$/i.exec(text)
  if (!call) return
  const operand = call[1]!.trim()
  const target = directTarget.test(operand) && !register.test(operand) ? qualify(operand, state.scope) : undefined
  state.events.push({ call: { ...at, target } })
}

function instructions(input: Preprocessed): AssemblyState {
  const state: AssemblyState = { events: [], labels: new Map(), exported: new Set(), code: false, scope: '' }
  for (const { text, at } of sourceLines(input)) {
    if (!declaration(text, state) && state.code) readCode(text, at, state)
  }
  return state
}

function invocation(call: Call, owner: Routine, byName: Map<string, Routine>): ScanInvocation {
  const target = call.target === undefined ? undefined : byName.get(call.target)
  return { source: owner.id, targets: target ? [target.id] : [], unresolved: !target,
    line: call.line, position: call.position, ...(call.target ? { member: call.target } : {}) }
}

function readCalls(events: Event[], byName: Map<string, Routine>): ScanInvocation[] {
  const calls: ScanInvocation[] = []
  let owner: Routine | undefined
  for (const event of events) {
    if ('reset' in event) owner = undefined
    else if ('label' in event) {
      const routine = byName.get(event.label.name)
      if (routine || !event.label.local) owner = routine
    } else if (owner && owner.file === event.call.file) {
      calls.push(invocation(event.call, owner, byName))
    }
  }
  return calls
}

/** An exported or directly called text label is a supported routine entry; data and branch labels are not. */
export function evidence(input: Preprocessed): AssemblyEvidence {
  const { events, labels, exported } = instructions(input)
  const names = new Set([...exported, ...events.flatMap(event => 'call' in event ? [event.call.target] : [])])
  const routines = [...labels.values()].filter(label => names.has(label.name)).map(label => ({
    id: `${label.file}:${label.name}`, file: label.file, name: label.name,
    position: label.position, line: label.line, local: label.local, exported: exported.has(label.name),
  }))
  return { routines, calls: readCalls(events, new Map(routines.map(routine => [routine.name, routine]))) }
}
