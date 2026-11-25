import { CircleX, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Notification } from '../../../shared/notifications'
import { DismissButton } from './DismissButton'

interface NotificationRowProps {
    notification: Notification
    // Shown before the Open logs and dismiss buttons.
    detail?: ReactNode
    className?: string
    onDismiss(): void
}

export function NotificationRow({
    notification,
    detail,
    className = '',
    onDismiss
}: NotificationRowProps): React.JSX.Element {
    const isError = notification.severity === 'error'
    const Icon = isError ? CircleX : TriangleAlert

    return (
        <div
            className={`banner ${isError ? 'banner-danger' : 'banner-warning'} flex items-start gap-2 ${className}`}
        >
            <Icon className="mt-px size-4 flex-none" role="img" aria-label={isError ? 'Error' : 'Warning'} />
            <span className="min-w-0 flex-1">{notification.message}</span>
            {detail}
            {notification.action === 'open-logs' && (
                <button className="button" type="button" onClick={() => void window.api.showLogs()}>
                    Open logs
                </button>
            )}
            <DismissButton onClick={onDismiss} />
        </div>
    )
}
