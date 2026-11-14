import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type Settings } from '../shared/settings'
import { readSettings, saveSetting, type SettingsStore } from './settings'

function createMemoryStore(): SettingsStore {
  const data: Settings = { ...DEFAULT_SETTINGS }
  return {
    get: (key) => data[key],
    set: (key, value) => {
      Object.assign(data, { [key]: value })
    }
  }
}

describe('settings', () => {
  it('starts with the defaults', () => {
    expect(readSettings(createMemoryStore())).toEqual(DEFAULT_SETTINGS)
  })

  it('saves a change and returns every setting', () => {
    const store = createMemoryStore()

    expect(saveSetting(store, 'commandCard', true)).toEqual({ commandCard: true })
    expect(readSettings(store)).toEqual({ commandCard: true })
  })

  it.each([
    ['an unknown setting', 'theme', true],
    ['a setting named after an object property', 'constructor', true],
    ['a key that is not a string', 1, true],
    ['a value of the wrong type', 'commandCard', 'yes']
  ])('rejects %s', (_description, key, value) => {
    const store = createMemoryStore()

    expect(() => saveSetting(store, key, value)).toThrow(TypeError)
    expect(readSettings(store)).toEqual(DEFAULT_SETTINGS)
  })
})
