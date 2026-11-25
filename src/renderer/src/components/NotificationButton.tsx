import { Popover } from '@base-ui/react/popover'
import { Bell } from 'lucide-react'
import { worstSeverity } from '../../../shared/notifications'
import { useNotifications } from '../notifications/use-notifications'
import { NotificationList } from './NotificationList'

const MAX_SHOWN_COUNT = 99

export function NotificationButton(): React.JSX.Element {
    const notifications = useNotifications()
    const severity = worstSeverity(notifications)
    const count = notifications.length
    const shownCount = count > MAX_SHOWN_COUNT ? `${MAX_SHOWN_COUNT}+` : String(count)

    return (
        <Popover.Root>
            <Popover.Trigger
                className="button button-quiet button-icon relative flex-none"
                aria-label={count === 0 ? 'Notifications' : `Notifications, ${count}`}
            >
                <Bell className="size-4" />
                {severity !== null && (
                    <span
                        className={`absolute -top-1 -right-1 min-w-4 rounded-full px-1 text-center text-small leading-4 text-canvas ${severity === 'error' ? 'bg-danger' : 'bg-attn'}`}
                        aria-hidden="true"
                    >
                        {shownCount}
                    </span>
                )}
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner sideOffset={6} align="end">
                    <Popover.Popup className="popover-card max-h-96 overflow-auto">
                        <NotificationList notifications={notifications} />
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    )
}
