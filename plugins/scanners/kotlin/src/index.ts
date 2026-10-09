import { parseScanObservation, type ScannerPlugin } from '@groma/scanner'
import { checkKotlinReadiness, readKotlinOutline, scanWithWorker } from './adapter.ts'

const isSource = (file: string) => file.endsWith('.kt')

export default {
  id: 'kotlin',
  listSourceFiles: async (_root, _settings, candidates) => candidates.filter(isSource),
  async checkReadiness(_root, _settings, files) {
    if (!files.some(isSource)) throw new Error('kotlin: No selected Kotlin source files were found.')
    await checkKotlinReadiness()
  },
  readCodeStructure: readKotlinOutline,
  async scan(root, _settings, files) {
    const sources = files.filter(isSource)
    if (sources.length === 0) return undefined
    return parseScanObservation(await scanWithWorker(root, sources))
  },
} satisfies ScannerPlugin
