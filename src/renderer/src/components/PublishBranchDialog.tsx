import { AlertDialog } from '@base-ui/react/alert-dialog'
import { formatCommand, pushAction, type PublishTarget } from '../../../shared/git-actions'

interface PublishBranchDialogProps {
    target: PublishTarget
    onPublish(): void
    onCancel(): void
}

export function PublishBranchDialog({
    target,
    onPublish,
    onCancel
}: PublishBranchDialogProps): React.JSX.Element {
    return (
        <AlertDialog.Root open onOpenChange={(open) => !open && onCancel()}>
            <AlertDialog.Portal>
                <AlertDialog.Backdrop className="dialog-backdrop" />
                <AlertDialog.Popup className="dialog">
                    <AlertDialog.Title className="text-title">
                        Publish {target.branchName} to {target.remote}?
                    </AlertDialog.Title>
                    <span className="command-box">{formatCommand(pushAction(target).typedArguments)}</span>
                    <div className="flex items-center justify-end gap-2">
                        <AlertDialog.Close className="button" onClick={onCancel}>
                            Cancel
                        </AlertDialog.Close>
                        <button className="button button-primary" type="button" onClick={onPublish}>
                            Push
                        </button>
                    </div>
                </AlertDialog.Popup>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    )
}
