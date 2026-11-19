import { CONTAINER_FONT, ICON_GAP_RATIO, ICON_SIDE, PLANE, TITLE_ICON_CLEARANCE, TITLE_ICON_ROOM, textLineHeight, textPadding } from '../../../../sheet/measure.ts'
import type { ProjectionView, SurfaceLabel, SurfaceText } from '../projection/project.ts'
import { planeMatrix, project } from '../projection/project.ts'
import { node, round, type SvgNode } from './svg.ts'

/** Fixed plane-space sizes keep titles readable without relaying out at every camera scale. */
const TITLE_STEPS = [
  { below: 0.25, size: 108, padding: 12 },
  { below: 0.5, size: 84, padding: 10 },
  { below: 1, size: 64, padding: 8 },
  { below: Infinity, size: 48, padding: 6 },
]
/** Include the map font's full ascent and descent, not only its visible capital height. */
const TITLE_LINE_HEIGHT = 1.3
/** The middle of a title's capital letters lies this many font sizes below the top of its line. */
const TITLE_MIDDLE = 0.54
/** A title's icon lying flat before the title is this many font sizes wide, so its drawing is about as tall as the letters. */
const TITLE_MARK_RATIO = 1.2

/** The map only needs title updates when this index changes, or when it paints a new scene. */
export function surfaceLabelStep(zoom: number): number {
  return TITLE_STEPS.findIndex(step => zoom < step.below)
}

/**
 * Fit a fixed preset inside the packed band, including its leader and hit area. With an icon the title shares
 * the band with the icon's room, and slot, gap and title are centred together.
 *
 * The icon has two places. As an object it stands in `icon`: a slot before the title, kept
 * TITLE_ICON_CLEARANCE slot sides away from the surface and from the band's west end, because an object covers the
 * ground behind it on screen. So it covers neither the surface nor a neighbour. Lying flat it needs no such room:
 * `mark` is a square before the title on the title's own line, at the title's size.
 *
 * The packing reserves TITLE_ICON_ROOM for a saved icon (nameCells). An icon that is only previewed in the Edit
 * form stands in the room its name has now, which may be less: then the clear ground shrinks first, and the
 * title keeps at least half the band.
 */
export function surfaceLabelLayout(
  text: Pick<SurfaceLabel, 'width' | 'band'>,
  size: number,
  zoom: number,
  view: ProjectionView,
  icon = false,
) {
  const step = TITLE_STEPS[surfaceLabelStep(zoom)]!
  const length = (x: number, y: number) => {
    const axis = project(x / PLANE, y / PLANE, 0, view)
    // Match the rounded axes actually used by planeMatrix.
    return Math.hypot(round(axis.x), round(axis.y))
  }
  const paddingX = Math.min(step.padding / length(1, 0), text.band.width / 20)
  const paddingY = Math.min(step.padding / length(0, 1), text.band.height / 20)
  const available = text.band.width - 2 * paddingX
  const room = icon ? Math.min(TITLE_ICON_ROOM, available / 2) : 0
  const clearance = Math.max(0, room - ICON_SIDE)
  const gapShare = icon ? ICON_GAP_RATIO : 0
  const fontSize = Math.min(
    step.size * size / CONTAINER_FONT,
    // The widest font at which the icon's room, the gap and the title fit along the band.
    (available - room) / (text.width / size + gapShare),
    (text.band.height - 3 * paddingY) / TITLE_LINE_HEIGHT,
  )
  const width = text.width * fontSize / size
  const lead = room - clearance + gapShare * fontSize
  // Slot, gap and title are centred under the surface, unless that leaves the slot less clear ground than it needs at the band's west end.
  const west = (text.width - text.band.width) / 2
  const start = Math.max((text.width - width - lead) / 2, west + paddingX + clearance)
  /** Where the slot and the mark end: one gap before the title. */
  const iconEnd = start + room - clearance
  const markSide = fontSize * TITLE_MARK_RATIO
  return {
    fontSize,
    x: start - paddingX,
    width: lead + width + 2 * paddingX,
    height: 3 * paddingY + fontSize * TITLE_LINE_HEIGHT,
    leader: paddingY,
    baseline: 2 * paddingY + fontSize * 0.9,
    /** Where the title is centred; an icon's slot moves it along +gx. */
    centre: start + lead + width / 2,
    icon: { x: iconEnd - ICON_SIDE, y: ICON_SIDE * TITLE_ICON_CLEARANCE, side: ICON_SIDE },
    mark: { x: iconEnd - markSide, y: 2 * paddingY + fontSize * TITLE_MIDDLE - markSide / 2, side: markSide },
  }
}

/** Building names stay inset on their own roofs, laid out in plane pixels; `lead` leaves an icon's slot free before them. */
export function surfaceText(
  text: SurfaceText,
  size: number,
  className: string,
  view: ProjectionView,
  lead = 0,
): SvgNode {
  const padding = textPadding(size)
  return node('g', { transform: planeMatrix('ground', text.origin, view) }, className,
    text.lines.map((line, index) => node('text', {
      x: padding + lead,
      y: padding + size * 0.9 + index * textLineHeight(size),
      'font-size': size,
    }, 'text', line)))
}

/** The label and its short leader share the surface's identity and ground plane. */
export function surfaceLabel(
  text: SurfaceLabel,
  layout: ReturnType<typeof surfaceLabelLayout>,
  view: ProjectionView,
  spacing: number,
): SvgNode {
  return node('g', { transform: planeMatrix('ground', text.origin, view) }, 'label surface-label', [
    node('rect', { x: layout.x, width: layout.width, height: layout.height }, 'label-hit'),
    node('line', { x1: text.width / 2, x2: text.width / 2, y1: 0, y2: layout.leader }, 'label-leader'),
    node('text', {
      x: layout.centre,
      y: layout.baseline,
      'text-anchor': 'middle',
      'font-size': layout.fontSize,
      'letter-spacing': `${spacing}em`,
    }, 'text', text.lines[0]!),
  ])
}
