'use strict'

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const packages = {
  'linux-x64': 'groma.md-linux-x64',
  'linux-arm64': 'groma.md-linux-arm64',
  'darwin-arm64': 'groma.md-darwin-arm64',
  'win32-x64': 'groma.md-windows-x64',
  'win32-arm64': 'groma.md-windows-arm64',
}

function isAppleSilicon(platform) {
  if (platform !== 'darwin') return false
  try {
    return execFileSync('/usr/sbin/sysctl', ['-n', 'hw.optional.arm64'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
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
  const cpu = platform === 'darwin' && appleSilicon ? 'arm64' : arch
  return packages[`${platform}-${cpu}`]
}

/** npm links this target before postinstall. It must never have a Node shebang. */
function installBinary() {
  const packageName = platformPackageName()
  if (packageName === undefined) {
    throw new Error(`groma.md does not provide a binary for ${process.platform}/${process.arch}. Intel Macs are unsupported.`)
  }
  let manifest
  try {
    manifest = require.resolve(`${packageName}/package.json`)
  } catch {
    throw new Error(`groma.md could not load ${packageName}. Install with optional dependencies enabled.`)
  }
  const binaryName = process.platform === 'win32' ? 'groma.exe' : 'groma'
  const destination = path.join(__dirname, 'bin', 'groma.exe')
  fs.copyFileSync(path.join(path.dirname(manifest), binaryName), destination)
  fs.chmodSync(destination, 0o755)
}

if (require.main === module) installBinary()

module.exports = { platformPackageName, platformPackages: Object.values(packages) }
