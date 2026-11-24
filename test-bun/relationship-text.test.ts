import { expect, test } from 'bun:test'

import {
  parentOfElements,
  relationshipPairs,
} from '../src/viewers/relationship-text.ts'
import { relationshipPairsFixtureRoot, terminalModel } from './helpers.ts'

test.concurrent('relationship pairs list each ordered pair of ends once at the selection depth', async () => {
  const model = await terminalModel(relationshipPairsFixtureRoot)
  const parentOf = parentOfElements(model.elements)
  const pairs = (id: string) => Object.fromEntries(relationshipPairs(model.relationships, id, parentOf).map(pair => [
    `${pair.outgoing ? 'to' : 'from'} ${pair.peerId}`,
    pair.relationships.map(relationship => `${relationship.source}>${relationship.target}`).sort(),
  ]))
  const towardBackend = ['speakers>people', 'talks>people', 'talks>sessions']
  expect(pairs('site')).toEqual({ 'to backend': towardBackend, 'from backend': ['sessions>talks'] })
  expect(pairs('pages')).toEqual({ 'to api': towardBackend, 'from api': ['sessions>talks'] })
  expect(pairs('talks')).toEqual({
    'to sessions': ['talks>sessions'],
    'to people': ['talks>people'],
    'from sessions': ['sessions>talks'],
  })
})
