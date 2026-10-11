import { expect, test } from 'bun:test'
import { componentMetrics } from '../src/component-metrics.ts'
import type { AnnotatedElement, AnnotatedRelationship, ArchitectureGraph } from '../src/types.ts'

function component(id: string, files: string[], lines = 0): AnnotatedElement {
  return {
    id, representationId: id, kind: 'component', title: id, overview: '', parent: 'container',
    children: [], external: false, origin: 'observed', codeLines: lines,
    code: files.map(file => ({ file, scanner: 'typescript' })),
  }
}

function world(elements: AnnotatedElement[], relationships: AnnotatedRelationship[] = []): ArchitectureGraph {
  return {
    elements: [{ ...component('container', []), kind: 'container', parent: null }, ...elements],
    relationships, flows: [],
  }
}

test.concurrent('outliers require ten files and a measure at least four times a container median above zero', () => {
  const outliers = (counts: [number, number][]) => componentMetrics(world(counts.map(([files, lines], index) =>
    component(`part${index}`, Array.from({ length: files }, (_, file) => `${index}/${file}.ts`), lines)))).get('part0')!.outliers
  expect(outliers([[10, 400], [2, 100], [2, 100]])).toEqual(['files', 'lines'])
  expect(outliers([[9, 400], [2, 100], [2, 100]])).toEqual([])
  expect(outliers([[10, 399], [3, 100], [3, 100]])).toEqual([])
  expect(outliers([[10, 400], [1, 100], [3, 100], [4, 100]])).toEqual(['lines'])
  expect(outliers([[10, 400], [10, 0], [10, 0]])).toEqual([])
})

test.concurrent('a relationship is one connection at each end and makes only its source unstable', () => {
  const metrics = componentMetrics(world([component('caller', []), component('callee', [])], [
    { id: 'calls', source: 'caller', target: 'callee', description: '', technology: '', origin: 'observed' },
  ]))
  expect(metrics.get('caller')).toMatchObject({ connections: 1, instability: 1 })
  expect(metrics.get('callee')).toMatchObject({ connections: 1, instability: 0 })
})
