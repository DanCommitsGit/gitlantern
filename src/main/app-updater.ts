import { app, BrowserWindow, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IPC_CHANNELS } from '../shared/gitlantern-api'
import { logError } from './log'
import type { SettingsStore } from './settings'
import { createUpdater, type Updater } from './updater'

const RELEASES_URL = 'https://github.com/DanCommitsGit/gitlantern/releases'

export function createAppUpdater(settingsStore: SettingsStore): Updater {
  // Failures reach the log through the 'error' event.
  autoUpdater.logger = null

  return createUpdater(autoUpdater, {
    currentVersion: app.getVersion(),
    // The macOS build has no Developer ID signature, which installing an update there needs.
    // The portable build is a single exe that the installer-based update would not replace.
    canInstall: process.platform !== 'darwin' && !process.env.PORTABLE_EXECUTABLE_FILE,
    canCheck: app.isPackaged,
    isAutomatic: () => settingsStore.get('autoUpdate'),
    openDownloadPage: (version) => void shell.openExternal(`${RELEASES_URL}/tag/v${version}`),
    onChange: (status) => {
      for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send(IPC_CHANNELS.updateStatusChanged, status)
      }
    },
    onError: (error) => logError('Update failed', error)
  })
}
