import type { IconName } from '../../../icons.ts'
import { peopleIcons } from './objects/people.ts'
import { clientsIcons } from './objects/clients.ts'
import { computeIcons } from './objects/compute.ts'
import { trafficIcons } from './objects/traffic.ts'
import { dataIcons } from './objects/data.ts'
import { messagingIcons } from './objects/messaging.ts'
import { securityIcons } from './objects/security.ts'
import { watchingIcons } from './objects/watching.ts'
import { toolingIcons } from './objects/tooling.ts'
import { aiIcons } from './objects/ai.ts'
import { mediaIcons } from './objects/media.ts'
import { commerceIcons } from './objects/commerce.ts'
import { shapesIcons } from './objects/shapes.ts'
import type { IconPart } from './parts.ts'

/**
 * One object per icon name, as the parts it is built from. It is the only drawing an icon has, and it is drawn
 * like the rest of the map: it lies on the map's surface. The 2D view and the panes look at it from straight
 * above, and a tilted map looks at the same object from the map's own angle, where the heights of its parts show
 * as walls. So draw an object as its picture from above, and give each part a height. Its accent is the one thing
 * that says what it is: one part, or the few marks that draw that thing, on a top, so every view shows it.
 *
 * A part lies on the ground, or wholly on the parts under it, and then starts at their top. A part that covers
 * another and reaches past it would float there: it starts on the ground too, is higher than what it covers, and
 * stands after it in the list. The painter draws parts back to front, and a part that starts higher over the one
 * it lies on. Where it cannot tell which of two parts is in front (two parts on one level that overlap, or parts
 * that hide each other in a ring) it keeps the order of the list, so list the parts of an object back to front,
 * lowest first. Parts that lie side by side must not overlap.
 *
 * The objects live in one file per kind under `objects/`, in the kinds `ICON_KINDS` names. Keep every object
 * inside the 1 × 1 footprint, and low: an object rises on screen over what lies behind it, and a test holds every
 * drawing short of what stands on the surface behind a title.
 */
export const iconObjects: Record<IconName, readonly IconPart[]> = {
  ...peopleIcons,
  ...clientsIcons,
  ...computeIcons,
  ...trafficIcons,
  ...dataIcons,
  ...messagingIcons,
  ...securityIcons,
  ...watchingIcons,
  ...toolingIcons,
  ...aiIcons,
  ...mediaIcons,
  ...commerceIcons,
  ...shapesIcons,
}
