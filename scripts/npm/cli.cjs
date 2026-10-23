#!/usr/bin/env node
'use strict'

const { execFileSync, spawn } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const packages = {
  linux: {
    arm64: 'groma.md-linux-arm64',
    x64: 'groma.md-linux-x64',
  },
  win32: {
    arm64: 'groma.md-windows-arm64',
    x64: 'groma.md-windows-x64',
  },
}

function isAppleSilicon(platform = process.platform, exec = execFileSync) {
  if (platform !== 'darwin') return false
  try {
    return exec('/usr/sbin/sysctl', ['-n', 'hw.optional.arm64'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() === '1'
  } catch {
    return false
  }
}

function platformPackageName(
  platform = process.platform,
  arch = process.arch,
  appleSilicon = isAppleSilicon(platform),
) {
  if (platform === 'darwin' && (arch === 'arm64' || appleSilicon)) {
    return 'groma.md-darwin-arm64'
  }
  return packages[platform]?.[arch]
}

function unsupportedArchitectureMessage(platform = process.platform, arch = process.arch) {
  if (platform === 'darwin') {
    return `groma.md does not support Intel Macs (${platform}/${arch}).`
  }
  return `groma.md does not provide a binary for ${platform}/${arch}.`
}

function resolveBinaryPath(packageName, binaryName, resolver = require.resolve) {
  const manifest = resolver(`${packageName}/package.json`)
  const binary = path.join(path.dirname(manifest), binaryName)
  if (!fs.existsSync(binary)) throw new Error(`missing ${binaryName}`)
  return binary
}

/** The native process owns cleanup; the launcher stays until its exit is reported. */
function relayTerminationSignals(forward, platform) {
  if (platform === 'win32') return () => {}
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT']
  for (const signal of signals) process.on(signal, forward)
  return () => {
    for (const signal of signals) process.off(signal, forward)
  }
}

function runWrapper({
  platform = process.platform,
  arch = process.arch,
  appleSilicon = isAppleSilicon(platform),
  argv = process.argv.slice(2),
  spawnBinary = spawn,
  writeError = message => console.error(message),
} = {}) {
  const packageName = platformPackageName(platform, arch, appleSilicon)
  if (packageName === undefined) {
    writeError(unsupportedArchitectureMessage(platform, arch))
    return { spawned: false }
  }

  const binaryName = platform === 'win32' ? 'groma.exe' : 'groma'
  let binary
  try {
    binary = resolveBinaryPath(packageName, binaryName)
  } catch {
    writeError(`groma.md could not load its platform package ${packageName}.`)
    writeError('Reinstall groma.md with optional dependencies enabled.')
    return { spawned: false }
  }

  // A fast child can become ready before spawn returns. Listen before it starts.
  let child
  let pendingSignal
  const releaseSignals = relayTerminationSignals(signal => {
    if (child === undefined) pendingSignal = signal
    // The terminal already sends Ctrl+C to both existing foreground processes.
    else if (signal !== 'SIGINT') child.kill(signal)
  }, platform)
  try {
    child = spawnBinary(binary, argv, { stdio: 'inherit' })
  } catch (error) {
    releaseSignals()
    throw error
  }
  child.once('error', error => {
    releaseSignals()
    writeError(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
  child.once('exit', (code, signal) => {
    releaseSignals()
    process.exitCode = code ?? (platform !== 'win32' && signal !== null ? 128 + os.constants.signals[signal] : 1)
  })
  if (pendingSignal !== undefined) child.kill(pendingSignal)
  return { spawned: true, child }
}

function main() {
  if (runWrapper().spawned !== true) process.exitCode = 1
}

if (require.main === module) main()

module.exports = {
  isAppleSilicon,
  platformPackageName,
  resolveBinaryPath,
  runWrapper,
  unsupportedArchitectureMessage,
}
