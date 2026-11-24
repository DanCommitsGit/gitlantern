import { useId } from 'react'
import type { Settings } from '../../../shared/settings'
import { SETTING_TEXT, type SettingsPageKey } from './setting-text'
import { useSettings } from './settings-context'

type ChoiceSettingKey = {
    [Key in SettingsPageKey]: Settings[Key] extends string ? Key : never
}[SettingsPageKey]

export function ChoiceSetting({ settingKey }: { settingKey: ChoiceSettingKey }): React.JSX.Element {
    const { settings, saveSetting } = useSettings()
    const labelId = useId()
    const { label, choices } = SETTING_TEXT[settingKey]

    return (
        <div className="panel px-3.5 py-3" role="radiogroup" aria-labelledby={labelId}>
            <p className="font-medium" id={labelId}>
                {label}
            </p>
            <div className="mt-2.5 flex flex-col gap-2">
                {choices.map((choice) => (
                    <label key={choice.value} className="setting-check">
                        <input
                            type="radio"
                            name={labelId}
                            checked={settings[settingKey] === choice.value}
                            onChange={() => saveSetting(settingKey, choice.value)}
                        />
                        <span>{choice.label}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}
