import type { Commit } from '../../../shared/history-types'
import type { GraphRow } from '../commit-graph'
import { formatDateAgo } from '../time-ago'
import { CommitGraphCell } from './CommitGraphCell'
import { RefLabels } from './RefLabels'

const SHORT_HASH_LENGTH = 7
const ROW_HEIGHT = 28
const COMPACT_ROW_HEIGHT = 44

interface CommitRowProps {
    commit: Commit
    // null when the graph is hidden.
    graph: { row: GraphRow; columnCount: number } | null
    isSelected: boolean
    // Two lines per commit, for a narrow log.
    isCompact: boolean
    now: number
    onSelect(): void
}

export function CommitRow({
    commit,
    graph,
    isSelected,
    isCompact,
    now,
    onSelect
}: CommitRowProps): React.JSX.Element {
    const height = isCompact ? COMPACT_ROW_HEIGHT : ROW_HEIGHT
    const date = formatDateAgo(new Date(commit.authorDate).getTime(), now)
    const shortHash = commit.hash.slice(0, SHORT_HASH_LENGTH)

    return (
        <li className="list-row pr-0" style={{ height }} data-selected={isSelected}>
            <button
                className="list-row-select self-stretch py-0 pr-3 pl-1 whitespace-nowrap"
                type="button"
                aria-current={isSelected}
                onClick={onSelect}
            >
                {graph ? (
                    <CommitGraphCell row={graph.row} columnCount={graph.columnCount} height={height} />
                ) : (
                    <span className="w-2 flex-none" />
                )}
                {isCompact ? (
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex min-w-0 items-center gap-2">
                            <RefLabels commit={commit} />
                            <span className="min-w-0 flex-1 truncate">{commit.subject}</span>
                        </span>
                        <span className="truncate text-small text-ink-2">
                            {commit.authorName}, {date}{' '}
                            <span className="font-mono text-ink-3">{shortHash}</span>
                        </span>
                    </span>
                ) : (
                    <>
                        <RefLabels commit={commit} />
                        <span className="min-w-0 flex-1 truncate">{commit.subject}</span>
                        <span className="w-30 flex-none truncate text-small text-ink-2">
                            {commit.authorName}
                        </span>
                        <span className="w-22.5 flex-none truncate text-small text-ink-2">{date}</span>
                        <span className="w-16 flex-none font-mono text-code text-ink-3">{shortHash}</span>
                    </>
                )}
            </button>
        </li>
    )
}
