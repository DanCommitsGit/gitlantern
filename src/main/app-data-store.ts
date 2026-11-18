import { logError } from './log'
import { createRepairedStore } from './repaired-store'
import type { AppData, AppDataStore } from './repository-session'
import { isPlainObject, type StoredDataRepairs } from './stored-data'

const APP_DATA_REPAIRS: StoredDataRepairs<AppData> = {
  recentRepositories: (value) =>
    Array.isArray(value) ? value.filter((path) => typeof path === 'string') : undefined,
  trustedPrograms: (value) =>
    isPlainObject(value)
      ? (Object.fromEntries(
          Object.entries(value).filter(([, fingerprint]) => typeof fingerprint === 'string')
        ) as Record<string, string>)
      : undefined,
  gitLocation: (value) => (typeof value === 'string' || value === null ? value : undefined),
  collapsedBranchGroups: (value) =>
    isPlainObject(value)
      ? (Object.fromEntries(
          Object.entries(value)
            .filter(([, groups]) => Array.isArray(groups))
            .map(([path, groups]) => [
              path,
              (groups as unknown[]).filter((group) => typeof group === 'string')
            ])
        ) as Record<string, string[]>)
      : undefined
}

// A mapped type, unlike the AppData interface, fits electron-store's type for defaults.
function createAppDataDefaults(): { [Key in keyof AppData]: AppData[Key] } {
  return {
    recentRepositories: [],
    trustedPrograms: {},
    gitLocation: null,
    collapsedBranchGroups: {}
  }
}

export function createMemoryAppDataStore(data: AppData = createAppDataDefaults()): AppDataStore {
  return {
    get: (key) => data[key],
    set: (key, value) => {
      data[key] = value
    }
  }
}

function moveToMemoryWhenFileFails(fileStore: AppDataStore): AppDataStore {
  const lastKnown: AppData = {
    recentRepositories: fileStore.get('recentRepositories'),
    trustedPrograms: fileStore.get('trustedPrograms'),
    gitLocation: fileStore.get('gitLocation'),
    collapsedBranchGroups: fileStore.get('collapsedBranchGroups')
  }
  let memoryStore: AppDataStore | null = null

  function switchToMemory(error: unknown): AppDataStore {
    logError('config.json stopped working, so changes last until the app closes', error)
    memoryStore = createMemoryAppDataStore(lastKnown)
    return memoryStore
  }

  return {
    get: (key) => {
      if (memoryStore !== null) return memoryStore.get(key)
      try {
        const value = fileStore.get(key)
        lastKnown[key] = value
        return value
      } catch (error) {
        return switchToMemory(error).get(key)
      }
    },
    set: (key, value) => {
      if (memoryStore !== null) return memoryStore.set(key, value)
      try {
        fileStore.set(key, value)
        lastKnown[key] = value
      } catch (error) {
        switchToMemory(error).set(key, value)
      }
    }
  }
}

export function createAppDataStore(folder?: string): AppDataStore {
  try {
    const fileStore = createRepairedStore<AppData>(
      {
        cwd: folder,
        defaults: createAppDataDefaults(),
        // Repository paths contain dots.
        accessPropertiesByDotNotation: false
      },
      APP_DATA_REPAIRS
    )
    return moveToMemoryWhenFileFails(fileStore)
  } catch (error) {
    logError(
      'Could not open config.json, so trust decisions and recent repositories last until the app closes',
      error
    )
    return createMemoryAppDataStore()
  }
}
