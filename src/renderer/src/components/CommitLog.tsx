import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { LOG_SCOPES, type LogScope } from '../../../shared/history-types'
import { graphColumnCount, layoutCommitGraph } from '../commit-graph'
import type { CommitLog as CommitLogState } from '../use-commit-log'
import { graphWidth } from '../graph-drawing'
import { CommitRow } from './CommitRow'
import { DiffMessage } from './DiffMessage'

const SCOPE_LABELS: Record<LogScope, string> = {
    'all-branches': 'All branches',
    'this-branch': 'This branch',
    'first-parent': 'First parent'
}

interface CommitLogProps {
    log: CommitLogState
    selectedHash: string | null
    showGraph: boolean
    // Two lines per commit and no column headings, for a narrow log.
    isCompact: boolean
    onSelect(commitHash: string): void
}

export function CommitLog({
    log,
    selectedHash,
    showGraph,
    isCompact,
    onSelect
}: CommitLogProps): React.JSX.Element {
    const searchId = useId()
    const [now] = useState(() => Date.now())
    const listRef = useRef<HTMLDivElement>(null)
    const listEndRef = useRef<HTMLLIElement>(null)
    const { commits, scope, hasMore, loadMore } = log
    // Lines between search results would join commits that aren't parent and child.
    const isGraphShown = showGraph && log.appliedSearch === ''

    const graphRows = useMemo(() => {
        if (!isGraphShown || commits === null) return null
        // A first-parent log leaves out every other parent, so no line should lead to one.
        return layoutCommitGraph(
            scope === 'first-parent'
                ? commits.map(({ hash, parentHashes }) => ({
                      hash,
                      parentHashes: parentHashes.slice(0, 1)
                  }))
                : commits
        )
    }, [isGraphShown, commits, scope])
    const columnCount = graphRows === null ? 0 : graphColumnCount(graphRows)

    useEffect(() => {
        const listEnd = listEndRef.current
        if (listEnd === null) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) loadMore()
            },
            { root: listRef.current, rootMargin: '400px' }
        )
        observer.observe(listEnd)
        return () => observer.disconnect()
    }, [loadMore, hasMore])

    return (
        <>
            <div className="flex flex-none flex-wrap items-center gap-2 border-b border-line p-3">
                <div className="segmented" role="group" aria-label="Commits shown">
                    {LOG_SCOPES.map((logScope) => (
                        <button
                            key={logScope}
                            type="button"
                            aria-pressed={logScope === scope}
                            onClick={() => log.setScope(logScope)}
                        >
                            {SCOPE_LABELS[logScope]}
                        </button>
                    ))}
                </div>
                <span className="min-w-0 flex-1" />
                <label className="flex w-65 max-w-full items-center gap-2" htmlFor={searchId}>
                    <span className="text-small text-ink-2">Search</span>
                    <input
                        className="input"
                        id={searchId}
                        type="search"
                        placeholder="Message, author or commit"
                        value={log.search}
                        onChange={(event) => log.setSearch(event.target.value)}
                    />
                </label>
            </div>
            {log.errorMessage !== null && (
                <div className="banner banner-danger flex-none rounded-none">{log.errorMessage}</div>
            )}
            {!isCompact && (
                <div className="flex flex-none items-center gap-2 border-b border-line py-1.5 pr-3 pl-1 text-label text-ink-2">
                    <span
                        className="flex-none"
                        style={{ width: graphRows === null ? 8 : graphWidth(columnCount) }}
                    />
                    <span className="min-w-0 flex-1">Commit</span>
                    <span className="w-30 flex-none">Author</span>
                    <span className="w-22.5 flex-none">Date</span>
                    <span className="w-16 flex-none">SHA</span>
                </div>
            )}
            {commits?.length === 0 ? (
                <DiffMessage title="No commits found" message="Nothing matches this search." />
            ) : (
                <div className="list-scroll" ref={listRef}>
                    <ul>
                        {commits?.map((commit, index) => (
                            <CommitRow
                                key={commit.hash}
                                commit={commit}
                                graph={graphRows === null ? null : { row: graphRows[index], columnCount }}
                                isSelected={commit.hash === selectedHash}
                                isCompact={isCompact}
                                now={now}
                                onSelect={() => onSelect(commit.hash)}
                            />
                        ))}
                        {hasMore && <li className="h-px" ref={listEndRef} />}
                    </ul>
                </div>
            )}
        </>
    )
}
