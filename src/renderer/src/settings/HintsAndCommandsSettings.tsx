import { useId } from 'react'
import { SETTING_TEXT } from './setting-text'
import { useSettings } from './settings-context'

export function HintsAndCommandsSettings(): React.JSX.Element {
    const { settings, saveSetting } = useSettings()
    const descriptionId = useId()

    return (
        <div className="panel px-3.5 py-3">
            <label className="setting-check">
                <input
                    type="checkbox"
                    checked={settings.commandCard}
                    aria-describedby={descriptionId}
                    onChange={(event) => saveSetting('commandCard', event.target.checked)}
                />
                <span className="font-medium">{SETTING_TEXT.commandCard.label}</span>
            </label>
            <p className="mt-1 pl-5.75 text-small text-ink-2" id={descriptionId}>
                {SETTING_TEXT.commandCard.description}
            </p>
        </div>
    )
}
