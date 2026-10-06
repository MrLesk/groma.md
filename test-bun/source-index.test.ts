import { expect, test } from 'bun:test'
import { sourceIndex } from '../src/source-index.ts'

test.concurrent('queries reuse the snapshot index and replacement snapshots resolve their own ownership', () => {
  const oldOwner = { id: 'old', code: [{ file: 'src/shared.ts' }, { file: 'src/removed.ts' }] }
  const before = [oldOwner]
  const index = sourceIndex(before)
  expect(sourceIndex(before)).toBe(index)
  expect(index.resolve('src/shared.ts')).toBe(oldOwner)
  expect(index.resolve('old')).toBe(oldOwner)

  const newOwner = { id: 'new', code: [{ file: 'src/shared.ts' }] }
  const after = [newOwner]
  const next = sourceIndex(after)
  expect(next.owner('src/shared.ts')).toBe(newOwner)
  expect(index.owner('src/shared.ts')).toBe(oldOwner)
  expect(next.owner('src/removed.ts')).toBeUndefined()
  expect(next.resolve('old')).toBeUndefined()
  expect(next.byFile.get('src/shared.ts')).toBe('new')
  expect(sourceIndex(after)).toBe(next)
})

test.concurrent('one source may have several references within its owner, but cannot have two owners', () => {
  const first = { id: 'first', code: [{ file: 'src/shared.ts' }, { file: 'src/shared.ts' }] }
  expect(sourceIndex([first]).owner('src/shared.ts')).toBe(first)
  expect(() => sourceIndex([first, { id: 'second', code: [{ file: 'src/shared.ts' }] }])).toThrow(/more than one owner/)
})
