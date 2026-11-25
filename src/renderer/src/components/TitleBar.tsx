import type { ReactNode } from 'react'
import { SettingsDialog } from '../settings/SettingsDialog'
import { NotificationButton } from './NotificationButton'

interface TitleBarProps {
    children?: ReactNode
    // Shown on the right, before the notifications button.
    actions?: ReactNode
}

export function TitleBar({ children, actions }: TitleBarProps): React.JSX.Element {
    return (
        <header className="title-bar">
            <span className="font-mono font-semibold">GitLantern</span>
            {children}
            <span className="min-w-0 flex-1" />
            {actions}
            <NotificationButton />
            <SettingsDialog />
        </header>
    )
}
