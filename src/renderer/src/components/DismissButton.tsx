import { X } from 'lucide-react'

export function DismissButton({ onClick }: { onClick(): void }): React.JSX.Element {
    return (
        <button
            className="button button-quiet button-icon flex-none"
            type="button"
            aria-label="Dismiss"
            onClick={onClick}
        >
            <X className="size-4" />
        </button>
    )
}
