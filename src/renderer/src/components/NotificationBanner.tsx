import { bannerNotification } from '../../../shared/notifications'
import { useNotifications } from '../notifications/use-notifications'
import { NotificationRow } from './NotificationRow'

export function NotificationBanner(): React.JSX.Element | null {
    const notification = bannerNotification(useNotifications())
    if (notification === null) return null

    return (
        <NotificationRow
            notification={notification}
            className="flex-none rounded-none"
            onDismiss={() => void window.api.dismissNotificationBanner(notification.id)}
        />
    )
}
