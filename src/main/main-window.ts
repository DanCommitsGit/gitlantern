import { BrowserWindow, nativeTheme } from 'electron'
import { join } from 'node:path'
import icon from '../../resources/icon.png?asset'

const TITLE_BAR_HEIGHT = 44

// These match --sunken and --ink in the renderer's tokens.
const THEME_COLORS = {
  light: { background: '#F5F5F2', symbol: '#1C1C19' },
  dark: { background: '#141412', symbol: '#EDEDE8' }
}

function currentThemeColors(): { background: string; symbol: string } {
  return nativeTheme.shouldUseDarkColors ? THEME_COLORS.dark : THEME_COLORS.light
}

function titleBarOverlay(): { color: string; symbolColor: string; height: number } {
  const { background, symbol } = currentThemeColors()
  return { color: background, symbolColor: symbol, height: TITLE_BAR_HEIGHT }
}

export function createMainWindow(rendererUrl: string): BrowserWindow {
  const usesOverlay = process.platform !== 'darwin'

  const window = new BrowserWindow({
    width: 1360,
    height: 840,
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    ...(usesOverlay ? { titleBarOverlay: titleBarOverlay() } : {}),
    backgroundColor: currentThemeColors().background,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  const applyTheme = (): void => {
    window.setBackgroundColor(currentThemeColors().background)
    if (usesOverlay) window.setTitleBarOverlay(titleBarOverlay())
  }
  nativeTheme.on('updated', applyTheme)
  window.on('closed', () => nativeTheme.off('updated', applyTheme))

  window.on('ready-to-show', () => window.show())
  window.loadURL(rendererUrl)

  return window
}
