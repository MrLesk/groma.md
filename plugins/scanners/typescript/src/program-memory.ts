import { stat } from 'node:fs/promises'
import os from 'node:os'

/**
 * Analysing one program takes about this many bytes of memory for every byte of its source, at the highest point and
 * in both processes together: the compiler holds the program's syntax trees and symbols, and the scanner its copy of
 * the trees and what it resolves from them. Programs of 18 to 36 MB of source in three repositories took 184 to 258.
 * To measure again, divide the highest memory of both processes by the source size of one such program.
 */
const MEMORY_PER_SOURCE_BYTE = 250

/** One program's analysis may take this share of the machine's memory; the rest stays with everything else running. */
const MACHINE_SHARE = 0.5

/** The most source, in bytes, that one program may hold on this machine. */
export function largestProgramSource(): number {
  return os.totalmem() * MACHINE_SHARE / MEMORY_PER_SOURCE_BYTE
}

const gigabytes = (bytes: number) => `${Number((bytes / 2 ** 30).toFixed(1))} GB`

/**
 * Fails the scan before a program takes more memory than the machine can give it. A program that runs the machine out
 * of memory freezes it or is killed without a word; this failure is a message, and core keeps the saved scanner data.
 * `name` says what was measured and `files` how many files it holds.
 */
export function requireMemoryFor(name: string, files: number, sourceBytes: number): void {
  if (sourceBytes <= largestProgramSource()) return
  throw new Error(`stopped, ${name} (${files.toLocaleString('en-US')} files) would take about `
    + `${gigabytes(sourceBytes * MEMORY_PER_SOURCE_BYTE)} of memory, more than the `
    + `${gigabytes(os.totalmem() * MACHINE_SHARE)} one project may take of this machine's ${gigabytes(os.totalmem())}`)
}

/** The size on disk of a project's files. A file removed since the files were listed counts as nothing. */
export async function sizeOnDisk(files: readonly string[]): Promise<number> {
  const sizes = await Promise.all(files.map(file => stat(file).then(stats => stats.size, () => 0)))
  return sizes.reduce((sum, size) => sum + size, 0)
}
