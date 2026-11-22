import { app, BrowserWindow } from 'electron'
import serve from 'electron-serve'
import { setApplicationMenu } from './app-menu'
import { createAppUpdater } from './app-updater'
import { createAppDataStore } from './app-data-store'
import { sendToAllWindows } from './broadcast'
import { IPC_CHANNELS } from '../shared/gitlantern-api'
import { registerIpcHandlers } from './ipc-handlers'
import { createMainWindow } from './main-window'
import { createNotices } from './notices'
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
  const settingsStore = createSettingsStore()
  const updater = createAppUpdater(settingsStore)
  const notices = createNotices((raised) => sendToAllWindows(IPC_CHANNELS.noticesChanged, raised))
  registerIpcHandlers(
    new RepositorySession(createAppDataStore(undefined, () => notices.raise('app-data-not-saved'))),
    settingsStore,
    updater,
    notices,
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
