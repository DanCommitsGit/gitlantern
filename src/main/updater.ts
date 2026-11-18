import type { AppUpdater } from 'electron-updater'
import type { UpdateState, UpdateStatus } from '../shared/update-types'

export type UpdateSource = Pick<
  AppUpdater,
  'autoDownload' | 'on' | 'checkForUpdates' | 'downloadUpdate' | 'quitAndInstall'
>

export interface UpdaterOptions {
  currentVersion: string
  canInstall: boolean
  canCheck: boolean
  isAutomatic(): boolean
  openDownloadPage(version: string): void
  onChange(status: UpdateStatus): void
  onError(error: unknown): void
}

export interface Updater {
  status(): UpdateStatus
  check(): Promise<void>
  download(): Promise<void>
  install(): void
}

export function createUpdater(source: UpdateSource, options: UpdaterOptions): Updater {
  const { currentVersion, canInstall, canCheck } = options
  let state: UpdateState = { kind: 'idle' }

  const status = (): UpdateStatus => ({ currentVersion, canInstall, canCheck, state })

  function setState(nextState: UpdateState): void {
    state = nextState
    options.onChange(status())
  }

  source.on('checking-for-update', () => setState({ kind: 'checking' }))
  source.on('update-not-available', () => setState({ kind: 'up-to-date' }))
  source.on('update-available', ({ version }) =>
    setState({ kind: source.autoDownload ? 'downloading' : 'available', version })
  )
  source.on('update-downloaded', ({ version }) => setState({ kind: 'ready', version }))
  source.on('error', (error) => {
    options.onError(error)
    setState({ kind: 'failed' })
  })

  return {
    status,
    async check() {
      if (!canCheck) return
      if (state.kind === 'checking' || state.kind === 'downloading' || state.kind === 'ready') {
        return
      }
      source.autoDownload = canInstall && options.isAutomatic()
      // A failure also arrives as an 'error' event, which is where it's logged.
      await source.checkForUpdates().catch(() => setState({ kind: 'failed' }))
    },
    async download() {
      if (state.kind !== 'available') return
      const { version } = state
      if (!canInstall) return options.openDownloadPage(version)
      setState({ kind: 'downloading', version })
      await source.downloadUpdate().catch(() => setState({ kind: 'failed' }))
    },
    install() {
      if (state.kind === 'ready') source.quitAndInstall()
    }
  }
}
