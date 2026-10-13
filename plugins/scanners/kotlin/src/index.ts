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
    if (!files.some(isSource)) return undefined
    // The worker also needs the selected build declarations, whose paths bound the unit of an execution entry.
    return parseScanObservation(await scanWithWorker(root, files))
  },
} satisfies ScannerPlugin
