import {
  DEFAULT_SETTINGS,
  FILE_LIST_STYLES,
  type FileListStyle,
  type SettingKey,
  type Settings
} from '../shared/settings'

export interface SettingsStore {
  get<Key extends SettingKey>(key: Key): Settings[Key]
  set(key: SettingKey, value: Settings[SettingKey]): void
}

export const SETTING_CHECKS: { [Key in SettingKey]: (value: unknown) => value is Settings[Key] } = {
  commandCard: (value): value is boolean => typeof value === 'boolean',
  fileList: (value): value is FileListStyle => FILE_LIST_STYLES.includes(value as FileListStyle),
  autoUpdate: (value): value is boolean => typeof value === 'boolean'
}

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[]

export function readSettings(store: SettingsStore): Settings {
  return Object.fromEntries(SETTING_KEYS.map((key) => [key, store.get(key)])) as unknown as Settings
}

export function saveSetting(store: SettingsStore, key: unknown, value: unknown): Settings {
  if (typeof key !== 'string' || !Object.hasOwn(SETTING_CHECKS, key)) {
    throw new TypeError('Unknown setting')
  }
  const settingKey = key as SettingKey
  const check = SETTING_CHECKS[settingKey] as (candidate: unknown) => boolean
  if (!check(value)) throw new TypeError(`Invalid value for ${key}`)

  store.set(settingKey, value as Settings[SettingKey])
  return readSettings(store)
}
