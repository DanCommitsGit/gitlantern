import { MAX_NOTIFICATIONS, type Notification, type Severity } from '../shared/notifications'

export interface Notifications {
    /** Oldest first. */
    list(): Notification[]
    /** Raising the same severity and message again replaces the earlier notification with a new one. */
    raise(severity: Severity, message: string, action?: Notification['action']): void
    dismiss(id: number): void
    /** Hides the banner and keeps the notification in the list. */
    dismissBanner(id: number): void
    dismissAll(): void
}

/** The notifications the window shows. `onChange` receives the whole list after each change. */
export function createNotifications(
    onChange: (notifications: Notification[]) => void,
    now: () => number = Date.now
): Notifications {
    let raised: Notification[] = []
    let nextId = 1

    function replaceAll(next: Notification[]): void {
        raised = next
        onChange([...raised])
    }

    return {
        list: () => [...raised],
        raise: (severity, message, action) => {
            const notification: Notification = {
                id: nextId++,
                severity,
                message,
                ...(action === undefined ? {} : { action }),
                raisedAt: now(),
                isBannerDismissed: false
            }
            const others = raised.filter((other) => other.severity !== severity || other.message !== message)
            replaceAll([...others, notification].slice(-MAX_NOTIFICATIONS))
        },
        dismiss: (id) => {
            if (!raised.some((notification) => notification.id === id)) return
            replaceAll(raised.filter((notification) => notification.id !== id))
        },
        dismissBanner: (id) => {
            if (!raised.some((notification) => notification.id === id && !notification.isBannerDismissed)) {
                return
            }
            replaceAll(
                raised.map((notification) =>
                    notification.id === id ? { ...notification, isBannerDismissed: true } : notification
                )
            )
        },
        dismissAll: () => {
            if (raised.length === 0) return
            replaceAll([])
        }
    }
}
