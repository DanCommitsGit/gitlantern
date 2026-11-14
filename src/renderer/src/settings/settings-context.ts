import { createContext, useContext } from 'react'
import type { SettingKey, Settings } from '../../../shared/settings'

export interface SettingsContextValue {
  settings: Settings
  saveFailed: boolean
  saveSetting<Key extends SettingKey>(key: Key, value: Settings[Key]): void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext)
  if (value === null) throw new Error('useSettings needs a SettingsProvider above it')
  return value
}
