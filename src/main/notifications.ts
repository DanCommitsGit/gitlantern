import { MAX_NOTIFICATIONS, type Notification, type Severity } from '../shared/notifications'

export interface Notifications {
    /** Oldest first. */
    list(): Notification[]
    /**
     * With a source, replaces the earlier notification from that source, or does nothing if its severity and
     * message are the same. Without a source, replaces an earlier one with the same severity and message.
     */
    raise(severity: Severity, message: string, options?: Pick<Notification, 'action' | 'source'>): void
    /** Removes the notifications with this source. */
    resolve(source: string): void
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
        raise: (severity, message, { action, source } = {}) => {
            const isRepeat = (other: Notification): boolean =>
                other.severity === severity && other.message === message
            const isReplaced = (other: Notification): boolean =>
                source === undefined ? isRepeat(other) : other.source === source
            if (source !== undefined && raised.some((other) => isReplaced(other) && isRepeat(other))) return

            const notification: Notification = {
                id: nextId++,
                severity,
                message,
                ...(action === undefined ? {} : { action }),
                ...(source === undefined ? {} : { source }),
                raisedAt: now(),
                isBannerDismissed: false
            }
            replaceAll(
                [...raised.filter((other) => !isReplaced(other)), notification].slice(-MAX_NOTIFICATIONS)
            )
        },
        resolve: (source) => {
            if (!raised.some((notification) => notification.source === source)) return
            replaceAll(raised.filter((notification) => notification.source !== source))
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
