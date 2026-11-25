import { useEffect, useState } from 'react'
import type { Notification } from '../../../shared/notifications'

/** The notifications to show, oldest first. Empty until the first answer arrives. */
export function useNotifications(): Notification[] {
    const [notifications, setNotifications] = useState<Notification[]>([])

    useEffect(() => {
        void window.api.readNotifications().then(setNotifications, (error: unknown) => {
            console.error('Could not read the notifications', error)
        })
        return window.api.onNotifications(setNotifications)
    }, [])

    return notifications
}
