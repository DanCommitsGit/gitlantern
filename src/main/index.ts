import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import serve from 'electron-serve'
import icon from '../../resources/icon.png?asset'
import { createAppDataStore } from './app-data-store'
import { registerIpcHandlers } from './ipc-handlers'
import { RepositorySession } from './repository-session'
import { denyAllPermissions, restrictWebContents } from './window-security'

// electron-serve's default scheme and hostname.
const SERVED_RENDERER_URL = 'app://-'

const rendererUrl =
  is.dev && process.env['ELECTRON_RENDERER_URL']
    ? process.env['ELECTRON_RENDERER_URL']
    : SERVED_RENDERER_URL

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.loadURL(rendererUrl)
}

serve({ directory: 'out/renderer' })
restrictWebContents(rendererUrl)

app.whenReady().then(() => {
  electronApp.setAppUserModelId('io.github.dancommitsgit.gitlantern')

  denyAllPermissions()
  registerIpcHandlers(new RepositorySession(createAppDataStore()), rendererUrl)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
