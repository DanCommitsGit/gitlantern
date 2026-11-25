import type { Severity } from '../../../shared/notifications'

/** With a source, a later notification from that source replaces this one, and `resolveNotifications(source)` removes it. */
export function raiseNotification(severity: Severity, message: string, source?: string): void {
    window.api.raiseNotification(severity, message, source).catch((error: unknown) => {
        console.error('Could not raise a notification', error)
    })
}

export function resolveNotifications(source: string): void {
    window.api.resolveNotifications(source).catch((error: unknown) => {
        console.error('Could not resolve notifications', error)
    })
}
