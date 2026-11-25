import type { Severity } from '../../../shared/notifications'

export function raiseNotification(severity: Severity, message: string): void {
    window.api.raiseNotification(severity, message).catch((error: unknown) => {
        console.error('Could not raise a notification', error)
    })
}
