import { useId } from 'react'
import { SETTING_TEXT } from './setting-text'
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
        <span className="setting-label">{SETTING_TEXT.commandCard.label}</span>
      </label>
      <p className="text-small setting-description" id={descriptionId}>
        {SETTING_TEXT.commandCard.description}
      </p>
    </div>
  )
}
