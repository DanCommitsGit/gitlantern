import { Dialog } from '@base-ui/react/dialog'
import { useState } from 'react'
import { SETTINGS_SECTIONS, type SettingsSection } from '../settings-sections'

export function SettingsDialog(): React.JSX.Element {
  const [selected, setSelected] = useState<SettingsSection>(SETTINGS_SECTIONS[0])

  return (
    <Dialog.Root>
      <Dialog.Trigger className="button button-quiet button-icon" aria-label="Settings">
        <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 5h7M12 5h2M2 11h2M7 11h7" />
          <circle cx="10.5" cy="5" r="1.5" />
          <circle cx="5.5" cy="11" r="1.5" />
        </svg>
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
                <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 4 8 8M12 4l-8 8" />
                </svg>
              </Dialog.Close>
            </div>
          </section>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
