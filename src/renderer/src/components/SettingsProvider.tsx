import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, type SettingKey, type Settings } from '../../../shared/settings'
import { SettingsContext } from '../settings-context'

function logSettingsError(error: unknown): void {
  console.error('Settings call failed', error)
}

// Renders nothing until the saved settings arrive, so a setting is never shown at the wrong value.
export function SettingsProvider({ children }: { children: ReactNode }): React.JSX.Element | null {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    void window.api.readSettings().then(setSettings, (error: unknown) => {
      logSettingsError(error)
      setSettings(DEFAULT_SETTINGS)
    })
  }, [])

  const saveSetting = useCallback(
    <Key extends SettingKey>(key: Key, value: Settings[Key]): void => {
      void window.api.saveSetting(key, value).then(setSettings, logSettingsError)
    },
    []
  )

  const value = useMemo(
    () => (settings === null ? null : { settings, saveSetting }),
    [settings, saveSetting]
  )

  if (value === null) return null
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
