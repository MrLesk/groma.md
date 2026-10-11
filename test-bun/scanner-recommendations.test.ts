import { expect, test } from 'bun:test'
import { recommendScanners, type TechnologyFinding, type OfficialScanner } from '../src/scanner/modules/catalog.ts'
import { parseScannerDiscovery } from '@groma/scanner'
import { selectPublishedScanner } from '../src/scanner/modules/published.ts'

const catalog: OfficialScanner[] = [{
  id: 'language', package: 'example-scanner', description: '', technologies: ['language'], rules: [],
}]

test.concurrent('detection recommends installation without interpreting language version syntax', () => {
  for (const version of [undefined, '7.1.0-dev.20260905.1', '^7.0.0', 'net10.0', '1.27.1']) {
    const finding: TechnologyFinding = { technology: 'language', kind: 'language', file: 'app/project', declaration: 'project', version }
    const offered = recommendScanners([finding], [], catalog)
    expect(offered[0]?.installSource).toBe('example-scanner')
    expect(recommendScanners([finding], [{ id: 'language', source: 'example-scanner@1.0.0', status: 'missing' }], catalog)[0]?.installSource).toBeUndefined()
  }
  expect(recommendScanners([], [], catalog)).toEqual([])
  expect(parseScannerDiscovery({ technologies: [], rules: [], compatibility: { groma: '^0.3.0' } }).compatibility).toEqual({ groma: '^0.3.0' })
})

function release(version: string, groma = '^0.3.0', os = ['linux']) {
  return { version, os, cpu: ['x64'],
    groma: { scanner: { id: 'language', entry: './index.js', discovery: { compatibility: { groma } } } } }
}
const host = { groma: '0.3.0', os: 'linux', cpu: 'x64' }

test.concurrent('installation chooses the newest published stable release for Groma and this computer', async () => {
  // Each package lists its releases oldest first; the registry tags the last one as latest.
  const packages: Record<string, ReturnType<typeof release>[]> = {
    'example-scanner': [release('1.0.0'), release('1.1.0'), release('2.0.0', '^0.4.0'), release('3.0.0', '^0.3.0', ['darwin']), release('4.0.0-beta.1')],
    'prerelease-scanner': [release('1.0.0-beta.1')],
    'newer-groma-scanner': [release('1.0.0', '^0.4.0')],
    'other-computer-scanner': [release('1.0.0', '^0.3.0', ['darwin'])],
  }
  const server = Bun.serve({ port: 0, fetch(request) {
    const name = decodeURIComponent(new URL(request.url).pathname.slice(1))
    const releases = packages[name]!
    return Response.json({ name, 'dist-tags': { latest: releases.at(-1)!.version },
      versions: Object.fromEntries(releases.map(item => [item.version, item])) })
  } })
  const select = (name: string) => selectPublishedScanner(name, server.url.href, host)
  try {
    expect((await select('example-scanner')).version).toBe('1.1.0')
    await expect(select('prerelease-scanner')).rejects.toThrow('no published stable scanner release')
    await expect(select('newer-groma-scanner')).rejects.toThrow('Update Groma')
    await expect(select('other-computer-scanner')).rejects.toThrow('linux/x64')
  } finally { await server.stop(true) }
})
