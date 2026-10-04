import { parentPort, workerData } from 'node:worker_threads'
import { scanJavaProjects } from './index.ts'

parentPort!.postMessage(await scanJavaProjects(workerData.root, workerData.files))
parentPort!.close()
