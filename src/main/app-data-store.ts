import Store from 'electron-store'
import type { AppData, AppDataStore } from './repository-session'

export function createAppDataStore(): AppDataStore {
  return new Store<AppData>({
    defaults: { recentRepositories: [], trustedPrograms: {}, gitLocation: null },
    schema: {
      recentRepositories: { type: 'array', items: { type: 'string' } },
      trustedPrograms: { type: 'object', additionalProperties: { type: 'string' } },
      gitLocation: { type: ['string', 'null'] }
    },
    // Losing these only costs a trust prompt and the recent list, so a damaged file shouldn't stop the app.
    clearInvalidConfig: true,
    // Repository paths contain dots.
    accessPropertiesByDotNotation: false
  })
}
