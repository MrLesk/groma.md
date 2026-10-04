import path from 'node:path'

export function javaCommand(): string {
  const executable = process.platform === 'win32' ? 'java.exe' : 'java'
  return process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', executable) : executable
}

export async function run(command: string, args: string[], root: string, input = '', timeout = 120000): Promise<string> {
  const child = Bun.spawn([command, ...args], {
    cwd: root, stdin: new TextEncoder().encode(input), stdout: 'pipe', stderr: 'pipe', timeout, killSignal: 'SIGKILL',
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ])
  if (code !== 0) throw new Error(stderr.trim() || stdout.trim() || `${command} exited ${code}`)
  return stdout
}

/** The Java host worker owns this wait; Groma's main thread keeps serving and running other scanners. */
export function runCompiler(command: string, args: string[], root: string, input: string, timeout = 120000): string {
  const child = Bun.spawnSync([command, ...args], {
    cwd: root, stdin: new TextEncoder().encode(input), stdout: 'pipe', stderr: 'pipe',
    timeout, killSignal: 'SIGKILL', maxBuffer: Infinity,
  })
  const stdout = child.stdout.toString()
  if (child.exitCode !== 0) throw new Error(child.stderr.toString().trim() || stdout.trim() || `${command} exited ${child.exitCode}`)
  return stdout
}
