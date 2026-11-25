export const SEVERITIES = ['error', 'warning'] as const

export type Severity = (typeof SEVERITIES)[number]

export interface Notification {
    id: number
    severity: Severity
    message: string
    // Only the main process can attach an action, so a window can't ask for one.
    action?: 'open-logs'
    // What the notification is about, one of NOTIFICATION_SOURCES. A later notification from the same source replaces this one, and resolve(source) removes it.
    source?: string
    raisedAt: number
    // The banner is hidden, but the notification stays in the list.
    isBannerDismissed: boolean
}

export const MAX_NOTIFICATIONS = 5000

export const NOTIFICATION_SOURCES = {
    appData: 'app-data',
    settings: 'settings',
    gitCheck: 'git-check',
    repositoryStatus: 'repository-status',
    fileDiff: 'file-diff',
    sync: 'sync'
} as const

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
