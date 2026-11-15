import { Dialog } from '@base-ui/react/dialog'
import { Settings2, X } from 'lucide-react'
import { useState } from 'react'
import { searchSettingsSections } from './search-settings'
import { useSettings } from './settings-context'
import { SETTINGS_SECTIONS, type SettingsSection } from './settings-sections'

export function SettingsDialog(): React.JSX.Element {
  const [selected, setSelected] = useState<SettingsSection>(SETTINGS_SECTIONS[0])
  const [query, setQuery] = useState('')
  const visibleSections = searchSettingsSections(query)
  const shown = visibleSections.includes(selected) ? selected : (visibleSections[0] ?? selected)
  const { Panel } = shown
  const { saveFailed } = useSettings()

  return (
    <Dialog.Root>
      <Dialog.Trigger className="button button-quiet button-icon" aria-label="Settings">
        <Settings2 className="size-4 flex-none" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className="dialog h-[min(520px,calc(100vh-96px))] w-[min(760px,calc(100vw-48px))] flex-row gap-0 overflow-hidden p-0">
          <nav
            className="flex w-55 flex-none flex-col gap-0.5 border-r border-line bg-sunken px-2 py-4"
            aria-label="Settings sections"
          >
            <Dialog.Title className="px-2 pb-3 text-head">Settings</Dialog.Title>
            <input
              className="input mb-2"
              placeholder="Search settings"
              aria-label="Search settings"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {visibleSections.map((section) => (
              <button
                key={section.id}
                className="min-h-7.5 cursor-pointer rounded-md px-2 text-left font-medium text-ink-2 hover:bg-hover aria-[current=page]:bg-selected aria-[current=page]:font-semibold aria-[current=page]:text-ink"
                type="button"
                aria-current={section.id === shown.id ? 'page' : undefined}
                onClick={() => setSelected(section)}
              >
                {section.name}
              </button>
            ))}
            {visibleSections.length === 0 && (
              <p className="px-2 text-small text-ink-2">No matching settings</p>
            )}
          </nav>
          <section
            className="flex min-w-0 flex-1 flex-col gap-4 overflow-auto px-5 py-4"
            aria-labelledby="settings-section-title"
          >
            <div className="flex items-center gap-2">
              <h3 className="min-w-0 flex-1 text-head" id="settings-section-title">
                {shown.name}
              </h3>
              <Dialog.Close className="button button-quiet button-icon" aria-label="Close settings">
                <X className="size-4 flex-none" />
              </Dialog.Close>
            </div>
            {Panel && <Panel />}
            {saveFailed && (
              <div className="banner banner-danger flex items-center gap-2" role="alert">
                <span className="min-w-0 flex-1">Couldn&apos;t save that setting. Try again.</span>
                <button className="button" type="button" onClick={() => void window.api.showLogs()}>
                  Open logs
                </button>
              </div>
            )}
          </section>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
