import { app, BrowserWindow, dialog, type WebContents } from 'electron'
import { NOTIFICATION_SOURCES } from '../shared/notifications'
import { setDialogOpen } from './main-window'
import { RELOADED_AFTER_CRASH } from './notification-messages'
import type { Notifications } from './notifications'

const REPEAT_CRASH_MILLISECONDS = 60_000

/** Reloads a window whose process stops unexpectedly. If it stops again within a minute, asks whether to reload or quit. */
export function recoverFromCrashes(notifications: Notifications): void {
    let reloadedAt = -Infinity

    function reload(webContents: WebContents): void {
        reloadedAt = Date.now()
        // A crash while an in-app dialog is open leaves the window controls tinted.
        setDialogOpen(false)
        webContents.reload()
    }

    async function askToReload(webContents: WebContents): Promise<void> {
        const { response } = await dialog.showMessageBox(BrowserWindow.fromWebContents(webContents)!, {
            type: 'error',
            message: 'GitLantern keeps crashing',
            buttons: ['Reload', 'Quit'],
            // Windows would otherwise show these as command links.
            noLink: true
        })
        if (response === 0) reload(webContents)
        else app.quit()
    }

    app.on('render-process-gone', (_event, webContents, { reason }) => {
        if (reason === 'clean-exit') return
        if (Date.now() - reloadedAt < REPEAT_CRASH_MILLISECONDS) {
            void askToReload(webContents)
            return
        }
        reload(webContents)
        // raise() ignores a repeat, which would leave a dismissed banner hidden.
        notifications.resolve(NOTIFICATION_SOURCES.windowCrash)
        notifications.raise('warning', RELOADED_AFTER_CRASH, {
            action: 'open-logs',
            source: NOTIFICATION_SOURCES.windowCrash
        })
    })
}
