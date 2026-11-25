export const SEVERITIES = ['error', 'warning'] as const

export type Severity = (typeof SEVERITIES)[number]

export interface Notification {
    id: number
    severity: Severity
    message: string
    // Only the main process can attach an action, so a window can't ask for one.
    action?: 'open-logs'
    raisedAt: number
    // The banner is hidden, but the notification stays in the list.
    isBannerDismissed: boolean
}

export const MAX_NOTIFICATIONS = 5000

/** The most serious severity in the list, or null when it is empty. */
export function worstSeverity(notifications: readonly Notification[]): Severity | null {
    if (notifications.length === 0) return null
    return notifications.some((notification) => notification.severity === 'error') ? 'error' : 'warning'
}

/** The notification to show as a banner: the newest one, unless its banner was dismissed. Lists are oldest first. */
export function bannerNotification(notifications: readonly Notification[]): Notification | null {
    const newest = notifications.at(-1)
    return newest === undefined || newest.isBannerDismissed ? null : newest
}
