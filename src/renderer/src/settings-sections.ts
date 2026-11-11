export const SETTINGS_SECTIONS = [
  { id: 'hints-and-commands', name: 'Hints and commands' },
  { id: 'diffs', name: 'Diffs' }
] as const

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]
