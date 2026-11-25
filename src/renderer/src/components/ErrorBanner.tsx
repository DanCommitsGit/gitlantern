import { DismissButton } from './DismissButton'

export function ErrorBanner({
    message,
    onDismiss
}: {
    message: string
    onDismiss(): void
}): React.JSX.Element {
    return (
        <div className="banner banner-danger flex items-start gap-2 rounded-none">
            <span className="min-w-0 flex-1">{message}</span>
            <DismissButton onClick={onDismiss} />
        </div>
    )
}
