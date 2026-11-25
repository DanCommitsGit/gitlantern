import { useState } from 'react'
import type { Notification } from '../../../shared/notifications'
import { formatDateAgo } from '../time-ago'
import { NotificationRow } from './NotificationRow'

export function NotificationList({ notifications }: { notifications: Notification[] }): React.JSX.Element {
    // The list is only mounted while it is open, so the times are read when it opens.
    const [now] = useState(() => Date.now())

    if (notifications.length === 0) return <p className="py-2 text-center text-ink-2">No notifications</p>

    return (
        <>
            {/* Newest first. Rows aren't virtualized, so thousands of notifications render slowly. */}
            {[...notifications].reverse().map((notification) => (
                <NotificationRow
                    key={notification.id}
                    notification={notification}
                    className="rounded-md"
                    detail={
                        <span className="flex-none text-ink-2">
                            {formatDateAgo(notification.raisedAt, now)}
                        </span>
                    }
                    onDismiss={() => void window.api.dismissNotification(notification.id)}
                />
            ))}
            <button
                className="button self-end"
                type="button"
                onClick={() => void window.api.dismissAllNotifications()}
            >
                Dismiss all
            </button>
        </>
    )
}
