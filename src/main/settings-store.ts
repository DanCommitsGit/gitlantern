import { DEFAULT_SETTINGS, type Settings } from '../shared/settings'
import { logError } from './log'
import { createRepairedStore } from './repaired-store'
import { SETTING_CHECKS, type SettingsStore } from './settings'
import type { StoredDataRepairs } from './stored-data'

const SETTING_REPAIRS: StoredDataRepairs<Settings> = {
  commandCard: (value) => (SETTING_CHECKS.commandCard(value) ? value : undefined),
  fileList: (value) => (SETTING_CHECKS.fileList(value) ? value : undefined),
  autoUpdate: (value) => (SETTING_CHECKS.autoUpdate(value) ? value : undefined)
}

// Kept apart from config.json, which holds the trust decisions.
export function createSettingsStore(folder?: string): SettingsStore {
  try {
    return createRepairedStore<Settings>(
      { name: 'settings', cwd: folder, defaults: DEFAULT_SETTINGS },
      SETTING_REPAIRS
    )
  } catch (error) {
    logError('Could not open settings.json, so the defaults are used', error)
    return {
      get: (key) => DEFAULT_SETTINGS[key],
      set: () => {
        throw new Error('settings.json could not be opened')
      }
    }
  }
}
