import { BASELINE, CAPITAL_MIDDLE, CONTAINER_FONT, ICON_LEAD, ICON_RATIO, PLANE, textLineHeight, textPadding } from '../../../../sheet/measure.ts'
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

/** The map only needs title updates when this index changes, or when it paints a new scene. */
export function surfaceLabelStep(zoom: number): number {
  return TITLE_STEPS.findIndex(step => zoom < step.below)
}

/**
 * Fit a fixed preset inside the packed band, including its leader and hit area. With an icon the title shares
 * the band with the icon's box: box, gap and title are centred together. The box lies on the title's line and
 * is sized from the title's font, so it follows the title's zoom step like the letters do.
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
  /** Font sizes the icon's box and its gap take before the title. */
  const leadShare = icon ? ICON_LEAD : 0
  const fontSize = Math.min(
    step.size * size / CONTAINER_FONT,
    size * (text.band.width - 2 * paddingX) / (text.width + leadShare * size),
    (text.band.height - 3 * paddingY) / TITLE_LINE_HEIGHT,
  )
  const width = text.width * fontSize / size
  const lead = leadShare * fontSize
  const start = (text.width - width - lead) / 2
  const iconSide = fontSize * ICON_RATIO
  return {
    fontSize,
    x: start - paddingX,
    width: lead + width + 2 * paddingX,
    height: 3 * paddingY + fontSize * TITLE_LINE_HEIGHT,
    leader: paddingY,
    baseline: 2 * paddingY + fontSize * BASELINE,
    /** Where the title is centred; an icon's box moves it along +gx. */
    centre: start + lead + width / 2,
    /** The icon's box: a square before the title, centred on the middle of the title's capitals. */
    icon: { x: start, y: 2 * paddingY + fontSize * CAPITAL_MIDDLE - iconSide / 2, side: iconSide },
  }
}

/**
 * Building names stay inset on their own roofs, laid out in plane pixels. `lead` and `drop` leave an icon's box
 * free: before the lines, or above them.
 */
export function surfaceText(
  text: SurfaceText,
  size: number,
  className: string,
  view: ProjectionView,
  lead = 0,
  drop = 0,
): SvgNode {
  const padding = textPadding(size)
  return node('g', { transform: planeMatrix('ground', text.origin, view) }, className,
    text.lines.map((line, index) => node('text', {
      x: padding + lead,
      y: padding + drop + size * BASELINE + index * textLineHeight(size),
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
