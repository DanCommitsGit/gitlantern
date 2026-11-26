import { app } from 'electron'
import { logError } from './log'

/** Logs uncaught main-process errors and other app processes' unexpected exits. */
export function logCrashes(): void {
    // 'uncaughtExceptionMonitor' logs without replacing Electron's error dialog, unlike 'uncaughtException'.
    process.on('uncaughtExceptionMonitor', (error) => logError('Uncaught error in the main process', error))
    process.on('unhandledRejection', (reason) => logError('Unhandled rejection in the main process', reason))

    app.on('render-process-gone', (_event, _webContents, { reason, exitCode }) => {
        if (reason !== 'clean-exit') logError('The window process stopped', { reason, exitCode })
    })
    app.on('child-process-gone', (_event, details) => {
        if (details.reason !== 'clean-exit') logError('A helper process stopped', details)
    })
}
