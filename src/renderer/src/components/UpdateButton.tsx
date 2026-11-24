import { useUpdateStatus } from '../updates/use-update-status'

export function UpdateButton({ onShowUpdates }: { onShowUpdates(): void }): React.JSX.Element | null {
    const state = useUpdateStatus()?.state

    if (state?.kind === 'ready') {
        return (
            <button className="button" type="button" onClick={() => void window.api.installUpdate()}>
                Restart to update
            </button>
        )
    }
    if (state?.kind === 'available') {
        return (
            <button className="button" type="button" onClick={onShowUpdates}>
                Update available
            </button>
        )
    }
    return null
}
