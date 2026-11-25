import { BrowserWindow, nativeTheme } from 'electron'
import { join } from 'node:path'
import icon from '../../resources/icon.png?asset'

const TITLE_BAR_HEIGHT = 44

// Same values as --color-sunken (background), --color-ink (symbol) and --color-scrim in theme.css.
const THEME_COLORS = {
    light: { background: '#F5F5F2', symbol: '#1C1C19', scrim: { color: '#1C1C19', opacity: 0.32 } },
    dark: { background: '#141412', symbol: '#EDEDE8', scrim: { color: '#000000', opacity: 0.5 } }
}

let isDialogOpen = false

function currentThemeColors(): { background: string; symbol: string } {
    const { background, symbol, scrim } = nativeTheme.shouldUseDarkColors
        ? THEME_COLORS.dark
        : THEME_COLORS.light
    if (!isDialogOpen) return { background, symbol }
    return {
        background: blendHex(background, scrim.color, scrim.opacity),
        symbol: blendHex(symbol, scrim.color, scrim.opacity)
    }
}

/** The color of `base` seen through a layer of `overlay` at `opacity`. Both are `#RRGGBB`. */
function blendHex(base: string, overlay: string, opacity: number): string {
    const channels = [1, 3, 5].map((start) => {
        const baseChannel = parseInt(base.slice(start, start + 2), 16)
        const overlayChannel = parseInt(overlay.slice(start, start + 2), 16)
        const blended = Math.round(overlayChannel * opacity + baseChannel * (1 - opacity))
        return blended.toString(16).padStart(2, '0')
    })
    return `#${channels.join('')}`
}

function titleBarOverlay(): { color: string; symbolColor: string; height: number } {
    const { background, symbol } = currentThemeColors()
    // One pixel short so the title bar's bottom border stays visible under the buttons.
    return { color: background, symbolColor: symbol, height: TITLE_BAR_HEIGHT - 1 }
}

/** Tints the window controls like the dialog scrim, because the page's scrim can't cover them. No-op on macOS. */
export function setDialogOpen(open: boolean): void {
    isDialogOpen = open
    if (process.platform === 'darwin') return
    for (const window of BrowserWindow.getAllWindows()) window.setTitleBarOverlay(titleBarOverlay())
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
