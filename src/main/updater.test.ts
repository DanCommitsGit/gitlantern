import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import type { UpdateStatus } from '../shared/update-types'
import { createUpdater, type Updater, type UpdateSource } from './updater'

class FakeSource extends EventEmitter {
  autoDownload = true
  quitAndInstall = vi.fn()
  downloadUpdate = vi.fn(async () => [])
  availableVersion: string | null = null

  checkForUpdates = vi.fn(async (): Promise<null> => {
    this.emit('checking-for-update')
    if (this.availableVersion === null) this.emit('update-not-available', {})
    else this.emit('update-available', { version: this.availableVersion })
    return null
  })
}

function setUp({ automatic = true, canInstall = true, canCheck = true } = {}): {
  source: FakeSource
  updater: Updater
  changes: UpdateStatus[]
  openDownloadPage: ReturnType<typeof vi.fn>
} {
  const source = new FakeSource()
  const changes: UpdateStatus[] = []
  const openDownloadPage = vi.fn()
  const updater = createUpdater(source as unknown as UpdateSource, {
    currentVersion: '1.0.0',
    canInstall,
    canCheck,
    isAutomatic: () => automatic,
    openDownloadPage,
    onChange: (status) => changes.push(status),
    onError: () => {}
  })
  return { source, updater, changes, openDownloadPage }
}

describe('createUpdater', () => {
  it('reports up to date when nothing newer exists', async () => {
    const { updater, changes } = setUp()

    await updater.check()

    expect(changes.map((status) => status.state.kind)).toEqual(['checking', 'up-to-date'])
  })

  it('downloads a new version and installs it on request', async () => {
    const { source, updater } = setUp()
    source.availableVersion = '1.1.0'

    await updater.check()
    expect(updater.status().state).toEqual({ kind: 'downloading', version: '1.1.0' })

    source.emit('update-downloaded', { version: '1.1.0' })
    updater.install()
    expect(source.quitAndInstall).toHaveBeenCalledOnce()
  })

  it('waits for a download request when updates are not automatic', async () => {
    const { source, updater } = setUp({ automatic: false })
    source.availableVersion = '1.1.0'

    await updater.check()
    expect(source.autoDownload).toBe(false)
    expect(updater.status().state).toEqual({ kind: 'available', version: '1.1.0' })

    await updater.download()
    expect(source.downloadUpdate).toHaveBeenCalledOnce()
    expect(updater.status().state).toEqual({ kind: 'downloading', version: '1.1.0' })
  })

  it('opens the download page where it cannot install', async () => {
    const { source, updater, openDownloadPage } = setUp({ canInstall: false })
    source.availableVersion = '1.1.0'

    await updater.check()
    await updater.download()

    expect(openDownloadPage).toHaveBeenCalledWith('1.1.0')
    expect(source.downloadUpdate).not.toHaveBeenCalled()
  })

  it('does not install before a download finishes', async () => {
    const { source, updater } = setUp()

    updater.install()

    expect(source.quitAndInstall).not.toHaveBeenCalled()
  })

  it('does not check where checking is unavailable', async () => {
    const { source, updater, changes } = setUp({ canCheck: false })

    await updater.check()

    expect(source.checkForUpdates).not.toHaveBeenCalled()
    expect(changes).toEqual([])
  })

  it('reports a failed check', async () => {
    const { source, updater } = setUp()
    source.checkForUpdates.mockRejectedValueOnce(new Error('offline'))

    await updater.check()

    expect(updater.status().state).toEqual({ kind: 'failed' })
  })
})
