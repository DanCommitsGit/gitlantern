import { AlertDialog } from '@base-ui/react/alert-dialog'
import { formatCommand, pullAction, type PullMode } from '../../../shared/git-actions'

const CHOICES: { mode: PullMode; label: string }[] = [
    { mode: 'merge', label: 'Merge' },
    { mode: 'rebase', label: 'Rebase' }
]

function commitCount(count: number): string {
    return count === 1 ? '1 commit' : `${count} commits`
}

interface DivergedPullDialogProps {
    branchName: string
    upstream: string
    ahead: number
    behind: number
    onChoose(mode: PullMode): void
    onCancel(): void
}

export function DivergedPullDialog({
    branchName,
    upstream,
    ahead,
    behind,
    onChoose,
    onCancel
}: DivergedPullDialogProps): React.JSX.Element {
    return (
        <AlertDialog.Root open onOpenChange={(open) => !open && onCancel()}>
            <AlertDialog.Portal>
                <AlertDialog.Backdrop className="dialog-backdrop" />
                <AlertDialog.Popup className="dialog">
                    <AlertDialog.Title className="text-title">Both sides have changes</AlertDialog.Title>
                    <AlertDialog.Description>
                        {branchName} has {commitCount(ahead)} that {upstream} doesn&apos;t, and {upstream} has{' '}
                        {commitCount(behind)} that {branchName} doesn&apos;t.
                    </AlertDialog.Description>
                    {CHOICES.map(({ mode, label }) => (
                        <div key={mode} className="flex items-center gap-3">
                            <button
                                className="button w-20 flex-none"
                                type="button"
                                onClick={() => onChoose(mode)}
                            >
                                {label}
                            </button>
                            <span className="command-box min-w-0 flex-1">
                                {formatCommand(pullAction(mode).typedArguments)}
                            </span>
                        </div>
                    ))}
                    <div className="flex items-center justify-end gap-2">
                        <AlertDialog.Close className="button" onClick={onCancel}>
                            Cancel
                        </AlertDialog.Close>
                    </div>
                </AlertDialog.Popup>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    )
}
