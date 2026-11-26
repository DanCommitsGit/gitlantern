import { app, dialog } from 'electron'
import { EventEmitter } from 'node:events'
import { expect, it, vi } from 'vitest'
import { recoverFromCrashes } from './crash-recovery'
import { createNotifications } from './notifications'

vi.mock('electron', async () => {
    const { EventEmitter } = await import('node:events')
    return {
        app: Object.assign(new EventEmitter(), { quit: vi.fn() }),
        BrowserWindow: { fromWebContents: () => ({}) },
        dialog: { showMessageBox: vi.fn() }
    }
})
vi.mock('./main-window', () => ({ setDialogOpen: vi.fn() }))

it('reloads after a crash, and asks before reloading again within a minute', async () => {
    vi.useFakeTimers()
    const notifications = createNotifications(() => {})
    recoverFromCrashes(notifications)
    const webContents = { reload: vi.fn() }
    const stop = (reason: string): boolean =>
        (app as unknown as EventEmitter).emit('render-process-gone', {}, webContents, { reason })
    const answer = (response: number): void => {
        vi.mocked(dialog.showMessageBox).mockResolvedValueOnce({ response, checkboxChecked: false })
    }

    stop('clean-exit')
    expect(webContents.reload).not.toHaveBeenCalled()

    stop('crashed')
    expect(webContents.reload).toHaveBeenCalledTimes(1)
    expect(notifications.list()).toMatchObject([{ severity: 'warning', action: 'open-logs' }])

    answer(0)
    await vi.advanceTimersByTimeAsync(59_000)
    stop('crashed')
    await vi.advanceTimersByTimeAsync(0)
    expect(dialog.showMessageBox).toHaveBeenCalledTimes(1)
    expect(webContents.reload).toHaveBeenCalledTimes(2)

    answer(1)
    stop('crashed')
    await vi.advanceTimersByTimeAsync(0)
    expect(app.quit).toHaveBeenCalledOnce()
    expect(webContents.reload).toHaveBeenCalledTimes(2)

    notifications.dismissBanner(notifications.list()[0].id)
    await vi.advanceTimersByTimeAsync(60_000)
    stop('crashed')
    expect(webContents.reload).toHaveBeenCalledTimes(3)
    expect(dialog.showMessageBox).toHaveBeenCalledTimes(2)
    expect(notifications.list()).toMatchObject([{ isBannerDismissed: false }])
    vi.useRealTimers()
})
