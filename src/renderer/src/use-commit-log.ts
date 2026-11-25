import { useCallback, useEffect, useRef, useState } from 'react'
import type { CommandRecord } from '../../shared/command-record'
import type { Commit, LogScope } from '../../shared/history-types'
import { NOTIFICATION_SOURCES } from '../../shared/notifications'
import { errorMessage } from './error-message'
import { raiseNotification, resolveNotifications } from './notifications/raise-notification'

const SEARCH_DELAY_MILLISECONDS = 250

export interface CommitLog {
    scope: LogScope
    search: string
    // The search the listed commits were read with, which trails what is typed.
    appliedSearch: string
    // null until the first page arrives.
    commits: Commit[] | null
    hasMore: boolean
    setScope(scope: LogScope): void
    setSearch(search: string): void
    loadMore(): void
}

function reportReadError(error: unknown): void {
    raiseNotification('error', errorMessage(error), NOTIFICATION_SOURCES.commitLog)
}

// Re-reads the first page each time the log is shown, so commits made since then appear.
export function useCommitLog(isShown: boolean, onRecord: (record: CommandRecord) => void): CommitLog {
    const [scope, setScope] = useState<LogScope>('all-branches')
    const [search, setSearch] = useState('')
    const [appliedSearch, setAppliedSearch] = useState('')
    const [commits, setCommits] = useState<Commit[] | null>(null)
    const [hasMore, setHasMore] = useState(false)
    // Counts the reads started, so a read that finishes after a newer one began is dropped.
    const latestRead = useRef(0)
    const isLoadingMore = useRef(false)
    // The scope and search last recorded, so showing the log again doesn't repeat the command.
    const recordedQuery = useRef<string | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => setAppliedSearch(search.trim()), SEARCH_DELAY_MILLISECONDS)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        if (!isShown) return
        const read = ++latestRead.current
        const query = `${scope}\0${appliedSearch}`
        isLoadingMore.current = false
        window.api.readCommitLog(scope, appliedSearch, 0).then(
            (page) => {
                if (read !== latestRead.current) return
                setCommits(page.commits)
                setHasMore(page.hasMore)
                resolveNotifications(NOTIFICATION_SOURCES.commitLog)
                if (page.record && recordedQuery.current !== query) onRecord(page.record)
                recordedQuery.current = query
            },
            (error) => {
                if (read === latestRead.current) reportReadError(error)
            }
        )
    }, [isShown, scope, appliedSearch, onRecord])

    const loadMore = useCallback(() => {
        if (commits === null || !hasMore || isLoadingMore.current) return
        const read = ++latestRead.current
        isLoadingMore.current = true
        window.api
            .readCommitLog(scope, appliedSearch, commits.length)
            .then(
                (page) => {
                    if (read !== latestRead.current) return
                    setCommits([...commits, ...page.commits])
                    setHasMore(page.hasMore)
                    resolveNotifications(NOTIFICATION_SOURCES.commitLog)
                },
                (error) => {
                    if (read === latestRead.current) reportReadError(error)
                }
            )
            .finally(() => {
                if (read === latestRead.current) isLoadingMore.current = false
            })
    }, [commits, hasMore, scope, appliedSearch])

    return {
        scope,
        search,
        appliedSearch,
        commits,
        hasMore,
        setScope,
        setSearch,
        loadMore
    }
}
