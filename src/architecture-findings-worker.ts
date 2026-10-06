import { parentPort, workerData } from 'node:worker_threads'
import { compareOperationPartition } from './architecture-findings.ts'

parentPort!.postMessage(compareOperationPartition(workerData.observations, workerData.first, workerData.step))
parentPort!.close()
