export interface GraphLine {
  fromColumn: number
  toColumn: number
  // 'top' ends at the commit's dot, 'bottom' starts from it, and 'through' passes the row.
  part: 'top' | 'bottom' | 'through'
  // The lane the line belongs to, which picks its color.
  lane: number
}

export interface GraphRow {
  column: number
  lines: GraphLine[]
}

function firstFreeLane(lanes: (string | null)[]): number {
  const freeLane = lanes.indexOf(null)
  return freeLane === -1 ? lanes.length : freeLane
}

/**
 * Gives each commit a column and the lines to draw in its row. Commits must come with no parent
 * before its children, the order `git log --topo-order` prints.
 */
export function layoutCommitGraph(
  commits: readonly { hash: string; parentHashes: readonly string[] }[]
): GraphRow[] {
  // The hash each lane is drawing a line down to, or null for a free lane.
  const lanes: (string | null)[] = []

  return commits.map((commit) => {
    const lines: GraphLine[] = []
    const waitingLane = lanes.indexOf(commit.hash)
    const column = waitingLane === -1 ? firstFreeLane(lanes) : waitingLane

    lanes.forEach((awaitedHash, lane) => {
      if (awaitedHash === commit.hash) {
        lines.push({ fromColumn: lane, toColumn: column, part: 'top', lane })
        lanes[lane] = null
      } else if (awaitedHash !== null) {
        lines.push({ fromColumn: lane, toColumn: lane, part: 'through', lane })
      }
    })

    commit.parentHashes.forEach((parentHash, parentIndex) => {
      let lane = lanes.indexOf(parentHash)
      if (lane === -1) {
        lane = parentIndex === 0 ? column : firstFreeLane(lanes)
        lanes[lane] = parentHash
      }
      lines.push({ fromColumn: column, toColumn: lane, part: 'bottom', lane })
    })

    return { column, lines }
  })
}

export function graphColumnCount(rows: readonly GraphRow[]): number {
  return (
    Math.max(
      0,
      ...rows.map((row) =>
        Math.max(row.column, ...row.lines.map((line) => Math.max(line.fromColumn, line.toColumn)))
      )
    ) + (rows.length > 0 ? 1 : 0)
  )
}
