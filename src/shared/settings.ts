export interface Settings {
  commandCard: boolean
}

export type SettingKey = keyof Settings

export const DEFAULT_SETTINGS: Settings = { commandCard: false }
