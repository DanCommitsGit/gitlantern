import { useId } from 'react'
import { SETTING_TEXT } from './setting-text'
import { useSettings } from './settings-context'

export function ChangesSettings(): React.JSX.Element {
  const { settings, saveSetting } = useSettings()
  const labelId = useId()
  const { label, choices } = SETTING_TEXT.fileList

  return (
    <div className="panel setting" role="radiogroup" aria-labelledby={labelId}>
      <p className="setting-label" id={labelId}>
        {label}
      </p>
      <div className="setting-choices">
        {choices.map((choice) => (
          <label key={choice.value} className="setting-check">
            <input
              type="radio"
              name={labelId}
              checked={settings.fileList === choice.value}
              onChange={() => saveSetting('fileList', choice.value)}
            />
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
