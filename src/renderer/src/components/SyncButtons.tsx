import { useState } from 'react'
import type { CommandRecord } from '../../../shared/command-record'
import type { PullMode } from '../../../shared/git-actions'
import type { Branch, RepositoryStatus } from '../../../shared/repository-types'
import { NOTIFICATION_SOURCES } from '../../../shared/notifications'
import { raiseNotification, resolveNotifications } from '../notifications/raise-notification'
import { fetchPreview, pullPreview, pushPreview } from '../sync-previews'
import { syncStateOf } from '../sync-state'
import { CommandButton } from './CommandButton'
import { DivergedPullDialog } from './DivergedPullDialog'
import { PublishBranchDialog } from './PublishBranchDialog'

const NO_REMOTE_HINT = 'This repository has no remote'

function TrackCount({
    arrow,
    count,
    description
}: {
    arrow: string
    count: number
    description: string
}): React.JSX.Element | null {
    if (count === 0) return null

    return (
        <span className="font-mono text-small text-ink-2">
            <span aria-hidden="true">
                {arrow}
                {count}
            </span>
            <span className="sr-only">
                {count} {description}
            </span>
        </span>
    )
}

interface SyncButtonsProps {
    status: RepositoryStatus
    branches: Branch[]
    runCommand(command: () => Promise<CommandRecord>): Promise<CommandRecord | null>
}

export function SyncButtons({ status, branches, runCommand }: SyncButtonsProps): React.JSX.Element {
    const [isRunning, setIsRunning] = useState(false)
    const [openDialog, setOpenDialog] = useState<'publish' | 'diverged' | null>(null)
    const sync = syncStateOf(status, branches)

    async function run(command: () => Promise<CommandRecord>): Promise<void> {
        setOpenDialog(null)
        setIsRunning(true)
        const record = await runCommand(command)
        setIsRunning(false)
        if (record === null) return
        if (record.exitCode === 0) {
            resolveNotifications(NOTIFICATION_SOURCES.sync)
        } else {
            raiseNotification(
                'error',
                record.output || `${record.typedCommand} failed`,
                NOTIFICATION_SOURCES.sync
            )
        }
    }

    function pull(): void {
        if (sync.isDiverged) setOpenDialog('diverged')
        else void run(() => window.api.pull('fast-forward-only'))
    }

    function push(): void {
        if (sync.publishTarget === null) void run(() => window.api.push())
        else setOpenDialog('publish')
    }

    const noRemoteHint = sync.hasRemote ? undefined : NO_REMOTE_HINT

    return (
        <>
            <div className="flex gap-1">
                <CommandButton
                    className="button"
                    disabled={isRunning || !sync.hasRemote}
                    title={noRemoteHint}
                    preview={fetchPreview()}
                    onClick={() => void run(() => window.api.fetch())}
                >
                    Fetch
                </CommandButton>
                <CommandButton
                    className="button"
                    disabled={isRunning || !sync.canPull}
                    title={noRemoteHint}
                    preview={pullPreview(sync.isDiverged)}
                    onClick={pull}
                >
                    Pull
                    <TrackCount arrow="↓" count={sync.behind} description="to pull" />
                </CommandButton>
                <CommandButton
                    className="button"
                    disabled={isRunning || !sync.canPush}
                    title={noRemoteHint}
                    preview={pushPreview(sync.publishTarget)}
                    onClick={push}
                >
                    Push
                    <TrackCount arrow="↑" count={sync.ahead} description="to push" />
                </CommandButton>
            </div>
            {openDialog === 'publish' && sync.publishTarget !== null && (
                <PublishBranchDialog
                    target={sync.publishTarget}
                    onPublish={() => void run(() => window.api.push())}
                    onCancel={() => setOpenDialog(null)}
                />
            )}
            {openDialog === 'diverged' && status.branchName !== null && status.upstream !== null && (
                <DivergedPullDialog
                    branchName={status.branchName}
                    upstream={status.upstream}
                    ahead={sync.ahead}
                    behind={sync.behind}
                    onChoose={(mode: PullMode) => void run(() => window.api.pull(mode))}
                    onCancel={() => setOpenDialog(null)}
                />
            )}
        </>
    )
}
