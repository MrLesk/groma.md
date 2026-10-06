import { parseScanObservation, type ScannerPlugin } from '@groma/scanner'
import { checkScalaReadiness, readScalaOutline, scanWithWorker } from './adapter.ts'

const isSource = (file: string) => file.endsWith('.scala')

export default {
  id: 'scala',
  listSourceFiles: async (_root, _settings, candidates) => candidates.filter(isSource),
  async checkReadiness(_root, _settings, files) {
    if (!files.some(isSource)) throw new Error('scala: No selected Scala source files were found.')
    await checkScalaReadiness()
  },
  readCodeStructure: readScalaOutline,
  async scan(root, _settings, files) {
    const sources = files.filter(isSource)
    if (sources.length === 0) return undefined
    return parseScanObservation(await scanWithWorker(root, sources))
  },
} satisfies ScannerPlugin
