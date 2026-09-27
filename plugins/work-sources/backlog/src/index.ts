import { spawn } from 'node:child_process'

import {
  EMPTY_WORK_SOURCE,
  type WorkItem,
  type WorkItemDetails,
  type WorkSource,
  type WorkSourcePlugin,
} from '@groma/work-source'

type BacklogCommandResolver = () => string | null

const installCommand = 'bun i -g backlog.md'

function findBacklogCommand(): string | null {
  return Bun.which('backlog')
}

function startBacklog(
  command: string,
  arguments_: string[],
  repositoryRoot: string,
  detached = false,
) {
  const shim = process.platform === 'win32' && command.toLowerCase().endsWith('.cmd')
  const args = shim
    ? ['/d', '/s', '/c', `""${command}" ${arguments_.map(argument => `"${argument}"`).join(' ')}"`]
    : arguments_
  return spawn(shim ? 'cmd.exe' : command, args, {
    cwd: repositoryRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsVerbatimArguments: shim,
    windowsHide: true,
    detached,
  })
}

function commandFailure(stderr: string, code: number | null): Error {
  if (/unknown option[^\n]*--(?:json|watch)\b/i.test(stderr)) {
    return new Error('Update Backlog.md to show tasks in Groma: npm install -g backlog.md. The installed CLI does not support the required JSON/watch commands.')
  }
  return new Error(stderr.trim() || `backlog exited ${code}`)
}

function runBacklog(command: string, arguments_: string[], repositoryRoot: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = startBacklog(command, arguments_, repositoryRoot)
    const stdout: Buffer[] = []
    let stderr = ''
    child.stdout.on('data', chunk => stdout.push(chunk as Buffer))
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', chunk => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) resolve(Buffer.concat(stdout).toString('utf8'))
      else reject(commandFailure(stderr, code))
    })
  })
}

type BacklogTaskSummary = Omit<WorkItem, 'updatedAt'> & { updatedAt: string | null }

/** Backlog emits complete JSON objects, which can span or share stdout chunks; noise around them is skipped instead of killing the stream. */
function taskListStream(onTasks: (tasks: BacklogTaskSummary[]) => void): (chunk: string) => void {
  let buffer = ''
  let position = 0
  let start = -1
  let depth = 0
  let quoted = false
  let escaped = false

  function endsObject(character: string): boolean {
    if (escaped) {
      escaped = false
      return false
    }
    if (quoted) {
      if (character === '\\') escaped = true
      else if (character === '"') quoted = false
      return false
    }
    if (character === '"') {
      quoted = true
      return false
    }
    if (character === '{') depth++
    return character === '}' && --depth === 0
  }

  /** Consumes one character: top-level noise is skipped, in-region structure updates the scanner, and a completed region is reported. */
  function consume(character: string): boolean {
    if (start < 0) {
      // Everything outside an object is noise: stray braces, quotes, or log lines never reach the parser.
      if (character !== '{') return false
      start = position - 1
      depth = 1
      quoted = false
      escaped = false
      return false
    }
    return endsObject(character)
  }

  /** Delivers the completed region's snapshot, or drops a malformed one; either way the region leaves the buffer. */
  function deliverRegion(): void {
    const region = buffer.slice(start, position)
    buffer = buffer.slice(position)
    position = 0
    start = -1
    try {
      const { tasks } = JSON.parse(region) as { tasks: BacklogTaskSummary[] }
      if (Array.isArray(tasks)) onTasks(tasks)
    } catch { return }
  }

  /** Drops everything the scanner already walked past, keeping any in-flight region. */
  function trimScanned(): void {
    if (start < 0) {
      buffer = buffer.slice(position)
      position = 0
    } else if (start > 0) {
      buffer = buffer.slice(start)
      position -= start
      start = 0
    }
  }

  return chunk => {
    buffer += chunk
    while (position < buffer.length) {
      if (consume(buffer[position++]!)) deliverRegion()
    }
    trimScanned()
  }
}

function watchBacklog(command: string, repositoryRoot: string, onTasks: (tasks: BacklogTaskSummary[]) => void) {
  // The npm launcher and native watcher share a group owned by this subscription.
  const child = startBacklog(command, ['task', 'list', '--json', '--watch'], repositoryRoot, process.platform !== 'win32')
  let closed = false
  let stderr = ''
  const report = (error: unknown) => {
    if (!closed) console.error(`Backlog watch: ${error instanceof Error ? error.message : String(error)}`)
  }
  const finished = new Promise<void>(resolve => {
    child.on('error', report)
    child.on('close', code => {
      if (code !== 0) report(commandFailure(stderr, code))
      resolve()
    })
  })
  function stopProcess(): void {
    if (child.pid === undefined || child.exitCode !== null || child.signalCode !== null) return
    if (process.platform === 'win32') {
      // The npm command shim owns the actual Backlog process on Windows.
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
      killer.on('error', error => console.error(error.message))
      return
    }
    try { process.kill(-child.pid, 'SIGTERM') }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error }
  }
  async function close(): Promise<void> {
    if (!closed) { closed = true; stopProcess() }
    let escalation: NodeJS.Timeout | undefined
    try {
      // A group that ignored SIGTERM gets one unignorable signal after a grace period; a genuinely unkillable child still blocks close.
      await Promise.race([finished, new Promise<void>(resolve => {
        escalation = setTimeout(() => {
          try {
            if (process.platform !== 'win32' && child.pid !== undefined) process.kill(-child.pid, 'SIGKILL')
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ESRCH') report(error)
          }
          resolve()
        }, 5000)
      })])
    } finally { clearTimeout(escalation) }
    await finished
  }
  const receive = taskListStream(tasks => { if (!closed) onTasks(tasks) })
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk: string) => {
    if (closed) return
    try { receive(chunk) }
    catch (error) { report(error); void close() }
  })
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk: string) => { stderr += chunk })
  return { close }
}

type BacklogTaskDetails = Omit<WorkItemDetails,
  'description' | 'implementationPlan' | 'implementationNotes' | 'comments'
> & {
  description: string | null
  implementationPlan: string | null
  implementationNotes: string | null
  comments: { body: string; createdAt: string | null; author: string | null }[]
}

/** Backlog ids are simple tokens; anything else is rejected before it can reach a shell. */
const safeTaskId = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

/** Field-by-field normalization: one null or oddly typed field from a non-conforming CLI must not kill the work chain. */
const asText = (value: unknown): string => value == null ? '' : String(value)

const asCount = (value: unknown): number => {
  const count = Number(value)
  return Number.isFinite(count) ? count : 0
}

function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  return value == null ? [] : [value as T]
}

const asStrings = (value: unknown): string[] => asList<unknown>(value).map(asText)

const asChecklist = (value: unknown): { text: string; checked: boolean }[] =>
  asList<{ text?: unknown; checked?: unknown }>(value).map(item => ({ text: asText(item.text), checked: item.checked === true }))

const asComments = (value: unknown): { body: string; createdAt: string; author: string }[] =>
  asList<{ body?: unknown; createdAt?: unknown; author?: unknown }>(value).map(comment => ({
    body: asText(comment.body),
    createdAt: asText(comment.createdAt),
    author: asText(comment.author),
  }))

function createBacklogSource(
  repositoryRoot: string,
  command: string,
): WorkSource {
  let watchedTasks: BacklogTaskSummary[] | undefined
  const run = (args: string[]) => runBacklog(command, args, repositoryRoot)
  return {
    async read() {
      const [tasks, statusesText, defaultStatusText] = await Promise.all([
        watchedTasks ?? run(['task', 'list', '--json'])
          .then(text => (JSON.parse(text) as { tasks: BacklogTaskSummary[] }).tasks),
        run(['config', 'get', 'statuses']),
        run(['config', 'get', 'defaultStatus']),
      ])
      const items = (watchedTasks ?? tasks).map(task => ({
        id: asText(task.id),
        title: asText(task.title),
        status: asText(task.status),
        assignees: asStrings(task.assignees),
        references: asStrings(task.references),
        modifiedFiles: asStrings(task.modifiedFiles),
        acceptanceCriteriaCompleted: asCount(task.acceptanceCriteriaCompleted),
        acceptanceCriteriaCount: asCount(task.acceptanceCriteriaCount),
        updatedAt: asText(task.updatedAt),
      }))
      const statuses = statusesText.split(',').map(status => status.trim()).filter(Boolean)
      return { statuses, defaultStatus: defaultStatusText.trim(), items }
    },
    async readItem(id) {
      if (!safeTaskId.test(id)) throw new Error(`Invalid task id: ${id}`)
      const output = await run(['task', 'view', id, '--json'])
      const { task } = JSON.parse(output) as { task: BacklogTaskDetails }
      return {
        id: asText(task.id),
        description: asText(task.description),
        acceptanceCriteria: asChecklist(task.acceptanceCriteria),
        definitionOfDone: asChecklist(task.definitionOfDone),
        implementationPlan: asText(task.implementationPlan),
        implementationNotes: asText(task.implementationNotes),
        comments: asComments(task.comments),
      }
    },
    watch(onChange) {
      const watcher = watchBacklog(command, repositoryRoot, tasks => {
        watchedTasks = tasks
        onChange()
      })
      return {
        async close() {
          await watcher.close()
          watchedTasks = undefined
        },
      }
    },
  }
}

export function createBacklogPlugin(
  resolveCommand: BacklogCommandResolver = findBacklogCommand,
): WorkSourcePlugin {
  return {
    id: 'backlog.md',
    readiness() {
      return resolveCommand() === null
        ? { status: 'missing', install: installCommand }
        : { status: 'found' }
    },
    create(repositoryRoot) {
      const command = resolveCommand()
      return command === null
        ? EMPTY_WORK_SOURCE
        : createBacklogSource(repositoryRoot, command)
    },
  }
}

export const backlogPlugin = createBacklogPlugin()
