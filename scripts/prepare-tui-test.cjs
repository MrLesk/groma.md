// Qualification tool only; never included in a product package.
const { createHash } = require('node:crypto');
const { appendFileSync, chmodSync, mkdirSync, writeFileSync } = require('node:fs');
const { setGlobalProxyFromEnv } = require('node:http');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { download, requirePatchedNode } = require('./prepare-bun-runtime.cjs');

const version = '0.1.1';
// Published SHA-256 digests on microsoft/tui-test release 0.1.1.
const assets = {
  'linux-x64': ['x86_64-unknown-linux-gnu.tar.gz', 'ae1f32afb34c713284b0637ea41d855124fe0ac298defb38a4018cd952c158ca'],
  'linux-arm64': ['aarch64-unknown-linux-gnu.tar.gz', '99588dd2e296f9b2685d7fb71d68a3dde3b1fed8c0e8f1af4d215538e858bd09'],
  'darwin-arm64': ['aarch64-apple-darwin.tar.gz', 'a6819562a18031b212565f771d03fe9e5ec7d4f71b389394fd909cc66cee6b81'],
  'win32-x64': ['x86_64-pc-windows-msvc.zip', '1dfdc80c6394bb723c9f3e3cb919db5138f72c75855b8fba2051dadf89663856'],
  // Windows 11 ARM runs this test driver under x64 emulation; the product stays native ARM64.
  'win32-arm64': ['x86_64-pc-windows-msvc.zip', '1dfdc80c6394bb723c9f3e3cb919db5138f72c75855b8fba2051dadf89663856'],
};

async function main() {
  requirePatchedNode();
  setGlobalProxyFromEnv();
  const host = `${process.platform}-${process.arch}`;
  if (!Object.hasOwn(assets, host)) throw new Error(`Unsupported console qualification host ${host}`);
  const [asset, checksum] = assets[host];
  const bytes = await download(`https://github.com/microsoft/tui-test/releases/download/${version}/tui-test-${asset}`);
  if (createHash('sha256').update(bytes).digest('hex') !== checksum) throw new Error('tui-test archive checksum mismatch');
  const directory = path.join(process.env.RUNNER_TEMP ?? tmpdir(), `groma-tui-test-${version}`, host);
  mkdirSync(directory, { recursive: true });
  const archive = path.join(directory, asset);
  const member = `tui-test${process.platform === 'win32' ? '.exe' : ''}`;
  const executable = path.join(directory, member);
  writeFileSync(archive, bytes);
  const extract = spawnSync(process.platform === 'win32' ? 'python' : 'python3', ['-c',
    'import pathlib,sys,tarfile,zipfile; a,m,o=sys.argv[1:]; data=zipfile.ZipFile(a).read(m) if a.endswith(".zip") else tarfile.open(a).extractfile(m).read(); pathlib.Path(o).write_bytes(data)',
    archive, member, executable], { stdio: 'inherit' });
  if (extract.status !== 0) throw new Error('Could not extract verified tui-test');
  chmodSync(executable, 0o755);
  const result = spawnSync(executable, ['--version'], { encoding: 'utf8' });
  if (result.status !== 0 || result.stdout.trim() !== `tui-test ${version}`) throw new Error('tui-test version mismatch');
  if (process.env.GITHUB_PATH) appendFileSync(process.env.GITHUB_PATH, `${directory}\n`);
  console.log(`Verified tui-test ${version}: ${executable}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
