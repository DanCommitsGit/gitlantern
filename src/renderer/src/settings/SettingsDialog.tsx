import { Dialog } from '@base-ui/react/dialog'
import { Settings2, X } from 'lucide-react'
import { useState } from 'react'
import { searchSettingsSections } from './search-settings'
import { SETTINGS_SECTIONS, type SettingsSection } from './settings-sections'

export function SettingsDialog(): React.JSX.Element {
  const [selected, setSelected] = useState<SettingsSection>(SETTINGS_SECTIONS[0])
  const [query, setQuery] = useState('')
  const visibleSections = searchSettingsSections(query)
  const shown = visibleSections.includes(selected) ? selected : (visibleSections[0] ?? selected)
  const { Panel } = shown

  return (
    <Dialog.Root>
      <Dialog.Trigger className="button button-quiet button-icon" aria-label="Settings">
        <Settings2 className="icon" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className="dialog dialog-settings">
          <nav className="settings-nav" aria-label="Settings sections">
            <Dialog.Title className="text-head settings-title">Settings</Dialog.Title>
            <input
              className="input settings-search"
              placeholder="Search settings"
              aria-label="Search settings"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {visibleSections.map((section) => (
              <button
                key={section.id}
                className="settings-nav-item"
                type="button"
                aria-current={section.id === shown.id ? 'page' : undefined}
                onClick={() => setSelected(section)}
              >
                {section.name}
              </button>
            ))}
            {visibleSections.length === 0 && (
              <p className="text-small settings-nav-empty">No matching settings</p>
            )}
          </nav>
          <section className="settings-panel" aria-labelledby="settings-section-title">
            <div className="row-layout">
              <h3 className="text-head grow" id="settings-section-title">
                {shown.name}
              </h3>
              <Dialog.Close className="button button-quiet button-icon" aria-label="Close settings">
                <X className="icon" />
              </Dialog.Close>
            </div>
            {Panel && <Panel />}
          </section>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
