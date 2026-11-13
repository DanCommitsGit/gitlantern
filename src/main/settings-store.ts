import Store, { type Schema } from 'electron-store'
import { DEFAULT_SETTINGS, type Settings } from '../shared/settings'
import type { SettingsStore } from './settings'

const SETTINGS_SCHEMA: Required<Schema<Settings>> = { commandCard: { type: 'boolean' } }

// Kept apart from config.json, which holds the trust decisions.
export function createSettingsStore(): SettingsStore {
  return new Store<Settings>({
    name: 'settings',
    defaults: DEFAULT_SETTINGS,
    schema: SETTINGS_SCHEMA,
    clearInvalidConfig: true
  })
}
