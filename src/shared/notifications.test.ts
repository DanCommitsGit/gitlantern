import { describe, expect, it } from 'vitest'
import { bannerNotification, worstSeverity, type Notification, type Severity } from './notifications'

function notification(id: number, severity: Severity, isBannerDismissed = false): Notification {
    return { id, severity, message: `Message ${id}`, raisedAt: 0, isBannerDismissed }
}

describe('worstSeverity', () => {
    it('is null for an empty list', () => {
        expect(worstSeverity([])).toBeNull()
    })

    it('is a warning when there are only warnings', () => {
        expect(worstSeverity([notification(1, 'warning')])).toBe('warning')
    })

    it('is an error when any notification is an error', () => {
        expect(worstSeverity([notification(1, 'error'), notification(2, 'warning')])).toBe('error')
    })
})

describe('bannerNotification', () => {
    it('is null for an empty list', () => {
        expect(bannerNotification([])).toBeNull()
    })

    it('is the newest notification', () => {
        expect(bannerNotification([notification(1, 'error'), notification(2, 'warning')])?.id).toBe(2)
    })

    it('is null when the newest banner is dismissed, even if an older banner is not', () => {
        expect(bannerNotification([notification(1, 'error'), notification(2, 'warning', true)])).toBeNull()
    })
})
