import type { GraphLine } from './commit-graph'

const LANE_WIDTH = 16
const FIRST_LANE_CENTER = 10
// Written out in full so Tailwind finds them.
const LANE_STROKES = [
  'stroke-lane-0',
  'stroke-lane-1',
  'stroke-lane-2',
  'stroke-lane-3',
  'stroke-lane-4'
]
const LANE_FILLS = ['fill-lane-0', 'fill-lane-1', 'fill-lane-2', 'fill-lane-3', 'fill-lane-4']
// Lanes past this are cut off, so a tangled history can't push the commit messages out of view.
const MAX_SHOWN_COLUMNS = 12

export const DOT_RADIUS = 4

export function laneCenter(column: number): number {
  return FIRST_LANE_CENTER + column * LANE_WIDTH
}

export function laneStrokeClass(lane: number): string {
  return LANE_STROKES[lane % LANE_STROKES.length]
}

export function laneFillClass(lane: number): string {
  return LANE_FILLS[lane % LANE_FILLS.length]
}

export function graphWidth(columnCount: number): number {
  return laneCenter(Math.min(columnCount, MAX_SHOWN_COLUMNS) - 1) + FIRST_LANE_CENTER
}

export function linePath(line: GraphLine, height: number): string {
  const from = laneCenter(line.fromColumn)
  const to = laneCenter(line.toColumn)
  const middle = height / 2
  if (line.part === 'through') return `M${from} 0V${height}`
  if (line.part === 'top') {
    return `M${from} 0C${from} ${middle / 2} ${to} ${middle / 2} ${to} ${middle}`
  }
  return `M${from} ${middle}C${from} ${middle * 1.5} ${to} ${middle * 1.5} ${to} ${height}`
}
