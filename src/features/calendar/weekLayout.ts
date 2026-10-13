import { HOUR_HEIGHT, minuteOfDay, WEEK_GRID_HEIGHT } from './calendarUtils'

/** The shortest block drawn in the week grid; shorter events still get this much room for one line of text. */
const MIN_EVENT_HEIGHT = 20
/** Events shorter than 40 minutes (or clipped at midnight to less) render on one line: 'Tiêu đề · 16:00'. */
const COMPACT_HEIGHT = 40 / 60 * HOUR_HEIGHT

export type WeekBlockGeometry = { top: number; height: number; compact: boolean }
/** Side-by-side placement: lane `lane` of `lanes` equal lanes across the day column. */
export type WeekBlockLane = { lane: number; lanes: number }

/**
 * Top and height of a block in the 00:00–24:00 column: the exact duration (at least MIN_EVENT_HEIGHT), never running
 * past the day's end (an event may cross midnight). Week events and the move preview both use this.
 */
export function weekBlockGeometry(start: Date, end: Date, minHeight = MIN_EVENT_HEIGHT): WeekBlockGeometry {
  const top = minuteOfDay(start) / 60 * HOUR_HEIGHT
  const exact = (end.getTime() - start.getTime()) / 3600000 * HOUR_HEIGHT
  const height = Math.max(0, Math.min(Math.max(minHeight, exact), WEEK_GRID_HEIGHT - top))
  return { top, height, compact: height < COMPACT_HEIGHT }
}

/**
 * Lanes for one rendered day. Blocks are taken by start (longer first on a tie, then in the given order); each goes
 * into the first lane that is free at its top. Blocks whose drawn ranges intersect, directly or through a chain, form
 * a cluster, and every block of a cluster shares that cluster's lane count, so they sit side by side at equal widths.
 */
export function assignLanes<T extends { top: number; height: number }>(blocks: T[]): (T & WeekBlockLane)[] {
  const ordered = blocks
    .map((block, order) => ({ block, order }))
    .sort((a, b) => a.block.top - b.block.top || b.block.height - a.block.height || a.order - b.order)
  const placed: (T & WeekBlockLane)[] = []
  let cluster: (T & WeekBlockLane)[] = []
  let laneEnds: number[] = []
  let clusterEnd = -Infinity
  const closeCluster = () => {
    for (const item of cluster) item.lanes = laneEnds.length
    cluster = []
    laneEnds = []
  }
  for (const { block } of ordered) {
    if (block.top >= clusterEnd) closeCluster()
    let lane = laneEnds.findIndex(end => end <= block.top)
    if (lane < 0) lane = laneEnds.length
    const bottom = block.top + block.height
    laneEnds[lane] = bottom
    clusterEnd = cluster.length ? Math.max(clusterEnd, bottom) : bottom
    const item = { ...block, lane, lanes: 1 }
    cluster.push(item)
    placed.push(item)
  }
  closeCluster()
  return placed
}

/** Inline position of a laned block: `lane/lanes` across the column with a 2px gutter on each side. */
export const laneStyle = ({ top, height, lane, lanes }: WeekBlockGeometry & WeekBlockLane) => ({
  top,
  height,
  left: `calc(${lane * 100 / lanes}% + 2px)`,
  width: `calc(${100 / lanes}% - 4px)`,
})
