import { useId } from 'react'
import type { UpdateState } from '../../../shared/update-types'
import { useUpdateStatus } from '../updates/use-update-status'
import { SETTING_TEXT } from './setting-text'
import { useSettings } from './settings-context'

function UpdateStateLine({ state }: { state: UpdateState }): React.JSX.Element | null {
  switch (state.kind) {
    case 'idle':
      return null
    case 'checking':
      return <span>Checking…</span>
    case 'up-to-date':
      return <span>GitLantern is up to date.</span>
    case 'downloading':
      return <span>Downloading {state.version}…</span>
    case 'available':
      return (
        <>
          <span className="min-w-0 flex-1">{state.version} is available.</span>
          <button className="button" type="button" onClick={() => void window.api.downloadUpdate()}>
            Download
          </button>
        </>
      )
    case 'ready':
      return (
        <>
          <span className="min-w-0 flex-1">{state.version} installs when you quit.</span>
          <button className="button" type="button" onClick={() => void window.api.installUpdate()}>
            Restart now
          </button>
        </>
      )
    case 'failed':
      return (
        <>
          <span className="min-w-0 flex-1">Couldn&apos;t check for updates.</span>
          <button className="button" type="button" onClick={() => void window.api.showLogs()}>
            Open logs
          </button>
        </>
      )
  }
}

export function UpdatesSettings(): React.JSX.Element | null {
  const { settings, saveSetting } = useSettings()
  const status = useUpdateStatus()
  const descriptionId = useId()

  if (status === null) return null
  const { state } = status
  const isBusy = state.kind === 'checking' || state.kind === 'downloading'

  return (
    <>
      {status.canInstall && (
        <div className="panel px-3.5 py-3">
          <label className="setting-check">
            <input
              type="checkbox"
              checked={settings.autoUpdate}
              aria-describedby={descriptionId}
              onChange={(event) => saveSetting('autoUpdate', event.target.checked)}
            />
            <span className="font-medium">{SETTING_TEXT.autoUpdate.label}</span>
          </label>
          <p className="mt-1 pl-5.75 text-small text-ink-2" id={descriptionId}>
            {SETTING_TEXT.autoUpdate.description}
          </p>
        </div>
      )}
      <div className="panel flex flex-col gap-2 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 font-medium">GitLantern {status.currentVersion}</span>
          <button
            className="button"
            type="button"
            disabled={isBusy}
            onClick={() => void window.api.checkForUpdates()}
          >
            Check for updates
          </button>
        </div>
        <div className="flex items-center gap-2 text-small text-ink-2" role="status">
          <UpdateStateLine state={state} />
        </div>
      </div>
    </>
  )
}
