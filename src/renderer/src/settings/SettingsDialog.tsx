import { Dialog } from '@base-ui/react/dialog'
import { Settings2, X } from 'lucide-react'
import { useState } from 'react'
import { SETTINGS_SECTIONS, type SettingsSection } from './settings-sections'

export function SettingsDialog(): React.JSX.Element {
  const [selected, setSelected] = useState<SettingsSection>(SETTINGS_SECTIONS[0])
  const { Panel } = selected

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
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                className="settings-nav-item"
                type="button"
                aria-current={section.id === selected.id ? 'page' : undefined}
                onClick={() => setSelected(section)}
              >
                {section.name}
              </button>
            ))}
          </nav>
          <section className="settings-panel" aria-labelledby="settings-section-title">
            <div className="row-layout">
              <h3 className="text-head grow" id="settings-section-title">
                {selected.name}
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
