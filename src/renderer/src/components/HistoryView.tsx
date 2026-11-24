import { useState } from 'react'
import type { CommandRecord } from '../../../shared/command-record'
import { useSettings } from '../settings/settings-context'
import { useCommitLog } from '../use-commit-log'
import { CommitDetail } from './CommitDetail'
import { CommitLog } from './CommitLog'
import { DiffMessage } from './DiffMessage'

interface HistoryViewProps {
    isShown: boolean
    hasCommits: boolean
    onRecord(record: CommandRecord): void
}

function CommitHistory({ isShown, onRecord }: Omit<HistoryViewProps, 'hasCommits'>): React.JSX.Element {
    const log = useCommitLog(isShown, onRecord)
    const [selectedHash, setSelectedHash] = useState<string | null>(null)
    const { logStyle, commitDetailPlace } = useSettings().settings
    // Falls back to the newest commit, so there is always one to show.
    const selectedCommit =
        log.commits?.find((commit) => commit.hash === selectedHash) ?? log.commits?.[0] ?? null

    const commitLog = (
        <CommitLog
            log={log}
            selectedHash={selectedCommit?.hash ?? null}
            showGraph={logStyle === 'graph'}
            isCompact={commitDetailPlace === 'right'}
            onSelect={setSelectedHash}
        />
    )
    const commitDetail = selectedCommit && <CommitDetail commit={selectedCommit} place={commitDetailPlace} />

    return commitDetailPlace === 'under' ? (
        <section className="pane flex-1">
            <div className="flex min-h-0 flex-1 flex-col">{commitLog}</div>
            {commitDetail}
        </section>
    ) : (
        <>
            <section className="pane w-80 flex-none">{commitLog}</section>
            {commitDetail ?? <section className="pane flex-1" />}
        </>
    )
}

export function HistoryView({ isShown, hasCommits, onRecord }: HistoryViewProps): React.JSX.Element {
    if (!hasCommits) {
        return (
            <section className="pane flex-1">
                <DiffMessage
                    title="No commits yet"
                    message="This repository is empty. Your first commit will show up here."
                />
            </section>
        )
    }
    return <CommitHistory isShown={isShown} onRecord={onRecord} />
}
