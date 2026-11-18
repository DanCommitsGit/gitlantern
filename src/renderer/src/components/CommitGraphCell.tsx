import type { GraphRow } from '../commit-graph'
import {
  DOT_RADIUS,
  graphWidth,
  laneCenter,
  laneFillClass,
  laneStrokeClass,
  linePath
} from '../graph-drawing'

interface CommitGraphCellProps {
  row: GraphRow
  columnCount: number
  height: number
}

export function CommitGraphCell({
  row,
  columnCount,
  height
}: CommitGraphCellProps): React.JSX.Element {
  return (
    <svg className="flex-none" width={graphWidth(columnCount)} height={height} aria-hidden="true">
      {row.lines.map((line, index) => (
        <path
          key={index}
          className={`graph-line ${laneStrokeClass(line.lane)}`}
          d={linePath(line, height)}
        />
      ))}
      <circle
        className={laneFillClass(row.column)}
        cx={laneCenter(row.column)}
        cy={height / 2}
        r={DOT_RADIUS}
      />
    </svg>
  )
}
