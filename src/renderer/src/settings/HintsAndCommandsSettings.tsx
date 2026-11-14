import { useId } from 'react'
import { useSettings } from './settings-context'

export function HintsAndCommandsSettings(): React.JSX.Element {
  const { settings, saveSetting } = useSettings()
  const descriptionId = useId()

  return (
    <div className="panel setting">
      <label className="setting-check">
        <input
          type="checkbox"
          checked={settings.commandCard}
          aria-describedby={descriptionId}
          onChange={(event) => saveSetting('commandCard', event.target.checked)}
        />
        <span className="setting-label">Command card at each button</span>
      </label>
      <p className="text-small setting-description" id={descriptionId}>
        Shows the command and what it does when you point at a button.
      </p>
    </div>
  )
}
