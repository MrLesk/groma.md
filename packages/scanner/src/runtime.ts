import { array, object, string } from './values.ts'

/** Configuration for one application-owned storage service, not a deployed server inventory. */
export interface ScanDataStore {
  entry: string
  file: string
  environment: string
  technology: string
  databases: { role: string; name: string }[]
}

/** A configured service hosted by an existing application execution unit. */
export interface ScanHostedService {
  entry: string
  declarations: string[]
  environment: string
  name: string
  host: string
}

function inventoried(value: unknown, paths: Set<string>): string {
  const file = string(value, 'runtime source')
  if (!paths.has(file)) throw new Error(`runtime configuration references unknown file: ${file}`)
  return file
}

function ordered<T>(values: T[]): T[] {
  return [...new Map(values.map(value => [JSON.stringify(value), value]))]
    .sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value)
}

export function runtimeEvidence(
  stores: unknown, services: unknown, paths: Set<string>,
): { dataStores?: ScanDataStore[]; hostedServices?: ScanHostedService[] } {
  const result: { dataStores?: ScanDataStore[]; hostedServices?: ScanHostedService[] } = {}
  if (stores !== undefined) result.dataStores = ordered(array(stores, 'dataStores').map(value => {
    const store = object(value, 'data store')
    const databases = ordered(array(store.databases, 'databases').map(value => {
      const database = object(value, 'database')
      return { role: string(database.role, 'database.role'), name: string(database.name, 'database.name') }
    }))
    if (!databases.length) throw new Error('data store requires configured databases')
    return { entry: inventoried(store.entry, paths), file: inventoried(store.file, paths),
      environment: string(store.environment, 'environment'), technology: string(store.technology, 'technology'), databases }
  }))
  if (services !== undefined) result.hostedServices = ordered(array(services, 'hostedServices').map(value => {
    const service = object(value, 'hosted service')
    const declarations = [...new Set(array(service.declarations, 'declarations').map(value => string(value, 'declaration')))].sort()
    if (!declarations.length) throw new Error('hosted service requires configuration declarations')
    return { entry: inventoried(service.entry, paths), declarations, environment: string(service.environment, 'environment'),
      name: string(service.name, 'service.name'), host: string(service.host, 'service.host') }
  }))
  return result
}
