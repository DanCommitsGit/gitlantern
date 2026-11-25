import { app, BrowserWindow, nativeTheme } from 'electron'
import serve from 'electron-serve'
import { setApplicationMenu } from './app-menu'
import { createAppUpdater } from './app-updater'
import { createAppDataStore } from './app-data-store'
import { sendToAllWindows } from './broadcast'
import { IPC_CHANNELS } from '../shared/gitlantern-api'
import { registerIpcHandlers } from './ipc-handlers'
import { createMainWindow } from './main-window'
import { NOTIFICATION_SOURCES } from '../shared/notifications'
import { createNotifications } from './notifications'
import { APP_DATA_NOT_SAVED, SETTINGS_NOT_OPENED } from './notification-messages'
import { RepositorySession } from './repository-session'
import { createSettingsStore } from './settings-store'
import { denyAllPermissions, restrictWebContents } from './window-security'

// electron-serve's default scheme and hostname.
const SERVED_RENDERER_URL = 'app://-'

const rendererUrl =
    !app.isPackaged && process.env['ELECTRON_RENDERER_URL']
        ? process.env['ELECTRON_RENDERER_URL']
        : SERVED_RENDERER_URL

serve({ directory: 'out/renderer' })
restrictWebContents(rendererUrl)

app.whenReady().then(() => {
    app.setAppUserModelId('io.github.dancommitsgit.gitlantern')

    denyAllPermissions()
    setApplicationMenu()
    const notifications = createNotifications((raised) =>
        sendToAllWindows(IPC_CHANNELS.notificationsChanged, raised)
    )
    const settingsStore = createSettingsStore(undefined, () =>
        notifications.raise('warning', SETTINGS_NOT_OPENED, {
            action: 'open-logs',
            source: NOTIFICATION_SOURCES.settings
        })
    )
    nativeTheme.themeSource = settingsStore.get('theme')
    const updater = createAppUpdater(settingsStore)
    registerIpcHandlers(
        new RepositorySession(
            createAppDataStore(undefined, () =>
                notifications.raise('warning', APP_DATA_NOT_SAVED, {
                    action: 'open-logs',
                    source: NOTIFICATION_SOURCES.appData
                })
            )
        ),
        settingsStore,
        updater,
        notifications,
        rendererUrl
    )

    createMainWindow(rendererUrl)
    void updater.check()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow(rendererUrl)
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
