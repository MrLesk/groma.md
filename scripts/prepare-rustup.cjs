// Bootstrap the patched Rustup before it performs any toolchain network requests.
const { createHash } = require('node:crypto');
const { appendFileSync, chmodSync, mkdirSync, writeFileSync } = require('node:fs');
const { homedir, tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const version = '1.29.2';
// Official https://static.rust-lang.org/rustup/archive/1.29.2/<target>/rustup-init[.exe].sha256
const assets = {
  'linux-x64': ['x86_64-unknown-linux-gnu', '5be191e8c70a5007074254cb74d78dbfdd25cd5a61c27de7b8e5410122ec24f4'],
  'linux-arm64': ['aarch64-unknown-linux-gnu', 'a9c168dbea81a84671c6b7a5c1795cb0eb699020110d107ddfca427bd797e697'],
  'darwin-arm64': ['aarch64-apple-darwin', 'f7c7e11eb2e07f006e532a8aaac77b32f4527d305ac386c0c633ca6133d35ca9'],
  'win32-x64': ['x86_64-pc-windows-msvc', '00f139da614dced87d3c3d4121c43eebdac3c1bf8a5ee86b9d80dfd71c8d70fd'],
  'win32-arm64': ['aarch64-pc-windows-msvc', '58005a321c5dcb9c4457c0a13bb5d6a56a5793efaef429004edaa1db33019b59'],
};

async function main() {
  const [major, minor, patch] = process.versions.node.split('.').map(Number);
  if (major < 26 || (major === 26 && (minor < 12 || (minor === 12 && patch < 1)))) {
    throw new Error('Use patched Node.js 26.12.1 or later');
  }
  const asset = assets[`${process.platform}-${process.arch}`];
  if (!asset) throw new Error(`Unsupported Rustup host: ${process.platform}-${process.arch}`);
  const [target, checksum] = asset;
  const executable = `rustup-init${process.platform === 'win32' ? '.exe' : ''}`;
  const url = `https://static.rust-lang.org/rustup/archive/${version}/${target}/${executable}`;
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Rustup download returned HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(bytes).digest('hex') !== checksum) throw new Error('Rustup checksum mismatch');
  const directory = path.join(process.env.RUNNER_TEMP ?? tmpdir(), `groma-rustup-${version}`);
  mkdirSync(directory, { recursive: true });
  const installer = path.join(directory, executable);
  writeFileSync(installer, bytes);
  chmodSync(installer, 0o755);
  execFileSync(installer, ['-y', '--no-modify-path', '--default-toolchain', 'none', '--no-update-default-toolchain'],
    { stdio: 'inherit', timeout: 120_000 });
  const cargoBin = path.join(process.env.CARGO_HOME ?? path.join(homedir(), '.cargo'), 'bin');
  const rustup = path.join(cargoBin, `rustup${process.platform === 'win32' ? '.exe' : ''}`);
  const installed = execFileSync(rustup, ['--version'], { encoding: 'utf8', timeout: 30_000 });
  if (!installed.startsWith(`rustup ${version} `)) throw new Error(`Unexpected Rustup version: ${installed.trim()}`);
  if (process.env.GITHUB_PATH) appendFileSync(process.env.GITHUB_PATH, `${cargoBin}\n`);
  console.log(`Verified ${installed.trim()} before installing build toolchains`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
