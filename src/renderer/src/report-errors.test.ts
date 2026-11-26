import { afterEach, expect, it, vi } from 'vitest'
import { reportErrors } from './report-errors'

afterEach(() => vi.unstubAllGlobals())

it('logs uncaught errors and unhandled rejections', () => {
    const logWindowError = vi.fn(() => Promise.resolve())
    const target = Object.assign(new EventTarget(), { api: { logWindowError } })
    vi.stubGlobal('window', target)
    reportErrors()

    const error = new Error('render failed')
    target.dispatchEvent(Object.assign(new Event('error'), { error, message: error.message }))
    target.dispatchEvent(Object.assign(new Event('error'), { error: null, message: 'Script error.' }))
    target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'no reason' }))

    expect(logWindowError.mock.calls).toEqual([[error.stack], ['Script error.'], ['no reason']])
})
