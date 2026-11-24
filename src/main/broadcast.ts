import { BrowserWindow } from 'electron'

export function sendToAllWindows(channel: string, payload: unknown): void {
    for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send(channel, payload)
    }
}
