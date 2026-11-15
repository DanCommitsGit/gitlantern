import Store, { type Options } from 'electron-store'
import { writeFileSync } from 'node:fs'
import { logError } from './log'
import { repairStoredData, type StoredDataRepairs } from './stored-data'

type RepairedStoreOptions<Data extends Record<keyof Data, unknown>> = Omit<
  Options<Data>,
  'defaults' | 'schema' | 'rootSchema' | 'deserialize'
> & { defaults: Data }

function backUpUnreadableFile(path: string, text: string, readError: unknown): void {
  const backupPath = `${path}.bak`
  try {
    writeFileSync(backupPath, text)
    logError(`Could not read ${path}, so it was reset. The old file is in ${backupPath}`, readError)
  } catch (backupError) {
    logError(`Could not read ${path}, so it was reset without a backup`, backupError)
  }
}

/** An electron-store whose file is repaired key by key each time it's read. */
export function createRepairedStore<Data extends Record<keyof Data, unknown>>(
  options: RepairedStoreOptions<Data>,
  repairs: StoredDataRepairs<Data>
): Store<Data> {
  let storePath: string | null = null
  let repairedWhileOpening = false
  let unreadableWhileOpening: { text: string; error: unknown } | null = null

  const store = new Store<Data>({
    ...options,
    defaults: options.defaults as Options<Data>['defaults'],
    // Repairs handle every key, so only text that isn't JSON or is too large gets here.
    clearInvalidConfig: true,
    deserialize: (text) => {
      try {
        const { data, changed } = repairStoredData(text, options.defaults, repairs)
        repairedWhileOpening ||= changed
        return data
      } catch (error) {
        // The path is only known once the constructor returns.
        if (storePath === null) unreadableWhileOpening = { text, error }
        else backUpUnreadableFile(storePath, text, error)
        throw error
      }
    }
  })
  storePath = store.path

  if (unreadableWhileOpening !== null) {
    const { text, error } = unreadableWhileOpening
    backUpUnreadableFile(storePath, text, error)
  }

  if (repairedWhileOpening) {
    // Saves the repaired values, so the file holds what the app reads.
    try {
      const repairedData = store.store
      store.store = repairedData
    } catch (error) {
      logError(`Could not save the repaired ${store.path}`, error)
    }
  }
  return store
}
