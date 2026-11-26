import { app } from 'electron'
import { EventEmitter } from 'node:events'
import { expect, it, vi } from 'vitest'
import { logCrashes } from './crash-logging'
import { logError } from './log'

vi.mock('electron', async () => {
    const { EventEmitter } = await import('node:events')
    return { app: new EventEmitter() }
})
vi.mock('./log', () => ({ logError: vi.fn() }))

it('logs a process that stops unexpectedly, and not one that exits cleanly', () => {
    vi.spyOn(process, 'on').mockImplementation(() => process)
    logCrashes()
    const events = app as unknown as EventEmitter

    events.emit('render-process-gone', {}, {}, { reason: 'clean-exit', exitCode: 0 })
    events.emit('child-process-gone', {}, { type: 'GPU', reason: 'clean-exit', exitCode: 0 })
    expect(logError).not.toHaveBeenCalled()

    events.emit('render-process-gone', {}, {}, { reason: 'crashed', exitCode: 1 })
    events.emit('child-process-gone', {}, { type: 'GPU', reason: 'killed', exitCode: 1 })
    expect(logError).toHaveBeenCalledTimes(2)
})
