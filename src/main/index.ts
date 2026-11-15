import { app, BrowserWindow } from 'electron'
import serve from 'electron-serve'
import { setApplicationMenu } from './app-menu'
import { createAppDataStore } from './app-data-store'
import { registerIpcHandlers } from './ipc-handlers'
import { createMainWindow } from './main-window'
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
  registerIpcHandlers(
    new RepositorySession(createAppDataStore()),
    createSettingsStore(),
    rendererUrl
  )

  createMainWindow(rendererUrl)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow(rendererUrl)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
