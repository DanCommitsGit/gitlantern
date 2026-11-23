import { DEFAULT_SETTINGS, type Settings } from '../shared/settings'
import { logError } from './log'
import { createRepairedStore } from './repaired-store'
import { SETTING_CHECKS, type SettingsStore } from './settings'
import type { StoredDataRepairs } from './stored-data'

const SETTING_REPAIRS: StoredDataRepairs<Settings> = {
  startupPlace: (value) => (SETTING_CHECKS.startupPlace(value) ? value : undefined),
  commandCard: (value) => (SETTING_CHECKS.commandCard(value) ? value : undefined),
  diffViewMode: (value) => (SETTING_CHECKS.diffViewMode(value) ? value : undefined),
  fileList: (value) => (SETTING_CHECKS.fileList(value) ? value : undefined),
  logStyle: (value) => (SETTING_CHECKS.logStyle(value) ? value : undefined),
  commitDetailPlace: (value) => (SETTING_CHECKS.commitDetailPlace(value) ? value : undefined),
  branchList: (value) => (SETTING_CHECKS.branchList(value) ? value : undefined),
  branchOrder: (value) => (SETTING_CHECKS.branchOrder(value) ? value : undefined),
  autoUpdate: (value) => (SETTING_CHECKS.autoUpdate(value) ? value : undefined)
}

// Kept apart from config.json, which holds the trust decisions.
// `onUnavailable` runs when the file can't be opened and the defaults are used instead.
export function createSettingsStore(
  folder?: string,
  onUnavailable: () => void = () => {}
): SettingsStore {
  try {
    return createRepairedStore<Settings>(
      { name: 'settings', cwd: folder, defaults: DEFAULT_SETTINGS },
      SETTING_REPAIRS
    )
  } catch (error) {
    logError('Could not open settings.json, so the defaults are used', error)
    onUnavailable()
    return {
      get: (key) => DEFAULT_SETTINGS[key],
      set: () => {
        throw new Error('settings.json could not be opened')
      }
    }
  }
}
