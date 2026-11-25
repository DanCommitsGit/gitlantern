import { describe, expect, it, vi } from 'vitest'
import { MAX_NOTIFICATIONS } from '../shared/notifications'
import { createNotifications } from './notifications'

describe('createNotifications', () => {
    it('starts empty', () => {
        expect(createNotifications(vi.fn()).list()).toEqual([])
    })

    it('adds a notification and reports the whole list', () => {
        const onChange = vi.fn()
        const notifications = createNotifications(onChange, () => 1000)

        notifications.raise('error', 'Push failed', { action: 'open-logs' })

        const expected = [
            {
                id: 1,
                severity: 'error',
                message: 'Push failed',
                action: 'open-logs',
                raisedAt: 1000,
                isBannerDismissed: false
            }
        ]
        expect(notifications.list()).toEqual(expected)
        expect(onChange).toHaveBeenCalledExactlyOnceWith(expected)
    })

    it('replaces a notification raised again, moving it to the newest place with its banner showing', () => {
        const notifications = createNotifications(vi.fn())
        notifications.raise('error', 'Push failed')
        notifications.raise('warning', 'Settings not opened')
        notifications.dismissBanner(2)

        notifications.raise('error', 'Push failed')
        notifications.raise('warning', 'Settings not opened')

        expect(notifications.list().map(({ id, message }) => [id, message])).toEqual([
            [3, 'Push failed'],
            [4, 'Settings not opened']
        ])
        expect(notifications.list()[1].isBannerDismissed).toBe(false)
    })

    it('keeps the same message at another severity as a separate notification', () => {
        const notifications = createNotifications(vi.fn())

        notifications.raise('error', 'Same')
        notifications.raise('warning', 'Same')

        expect(notifications.list()).toHaveLength(2)
    })

    it('keeps only the newest notifications once the limit is passed', () => {
        const notifications = createNotifications(vi.fn())

        for (let count = 0; count <= MAX_NOTIFICATIONS; count++) {
            notifications.raise('error', `Failure ${count}`)
        }

        const kept = notifications.list()
        expect(kept).toHaveLength(MAX_NOTIFICATIONS)
        expect(kept[0].message).toBe('Failure 1')
        expect(kept.at(-1)?.message).toBe(`Failure ${MAX_NOTIFICATIONS}`)
    })

    it('removes a dismissed notification and ignores an id that is not in the list', () => {
        const onChange = vi.fn()
        const notifications = createNotifications(onChange)
        notifications.raise('error', 'First')
        notifications.raise('error', 'Second')
        onChange.mockClear()

        notifications.dismiss(99)
        expect(onChange).not.toHaveBeenCalled()

        notifications.dismiss(1)
        expect(notifications.list().map(({ message }) => message)).toEqual(['Second'])
        expect(onChange).toHaveBeenCalledOnce()
    })

    it('hides a banner but keeps the notification, reporting the change once', () => {
        const onChange = vi.fn()
        const notifications = createNotifications(onChange)
        notifications.raise('error', 'Push failed')
        onChange.mockClear()

        notifications.dismissBanner(1)
        notifications.dismissBanner(1)

        expect(notifications.list()).toHaveLength(1)
        expect(notifications.list()[0].isBannerDismissed).toBe(true)
        expect(onChange).toHaveBeenCalledOnce()
    })

    it('clears the list, reporting nothing when it is already empty', () => {
        const onChange = vi.fn()
        const notifications = createNotifications(onChange)

        notifications.dismissAll()
        expect(onChange).not.toHaveBeenCalled()

        notifications.raise('error', 'Push failed')
        notifications.dismissAll()
        expect(notifications.list()).toEqual([])
        expect(onChange).toHaveBeenLastCalledWith([])
    })

    describe('with a source', () => {
        it('replaces the earlier notification from the same source, whatever its message', () => {
            const notifications = createNotifications(vi.fn())
            notifications.raise('error', 'First read failed', { source: 'status' })
            notifications.raise('error', 'Other', { source: 'diff' })

            notifications.raise('error', 'Second read failed', { source: 'status' })

            expect(notifications.list().map(({ message }) => message)).toEqual([
                'Other',
                'Second read failed'
            ])
        })

        it('leaves a repeated notification as it is, with its banner dismissed', () => {
            const onChange = vi.fn()
            const notifications = createNotifications(onChange)
            notifications.raise('error', 'Read failed', { source: 'status' })
            notifications.dismissBanner(1)
            onChange.mockClear()

            notifications.raise('error', 'Read failed', { source: 'status' })

            expect(notifications.list()).toHaveLength(1)
            expect(notifications.list()[0]).toMatchObject({ id: 1, isBannerDismissed: true })
            expect(onChange).not.toHaveBeenCalled()
        })

        it('shows the banner again when the severity changes', () => {
            const notifications = createNotifications(vi.fn())
            notifications.raise('warning', 'Read failed', { source: 'status' })
            notifications.dismissBanner(1)

            notifications.raise('error', 'Read failed', { source: 'status' })

            expect(notifications.list()).toMatchObject([{ severity: 'error', isBannerDismissed: false }])
        })

        it('removes the notifications from a resolved source and ignores a source with none', () => {
            const onChange = vi.fn()
            const notifications = createNotifications(onChange)
            notifications.raise('error', 'Read failed', { source: 'status' })
            notifications.raise('error', 'Push failed')
            onChange.mockClear()

            notifications.resolve('other')
            expect(onChange).not.toHaveBeenCalled()

            notifications.resolve('status')
            expect(notifications.list().map(({ message }) => message)).toEqual(['Push failed'])
            expect(onChange).toHaveBeenCalledOnce()
        })
    })
})
