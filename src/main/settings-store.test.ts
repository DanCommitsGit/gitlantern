import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../shared/settings'
import { logError } from './log'
import { readSettings, saveSetting } from './settings'
import { createSettingsStore } from './settings-store'
import { MAX_STORED_DATA_LENGTH } from './stored-data'

vi.mock('./log', () => ({ logError: vi.fn() }))

let folder: string
let settingsFile: string

beforeEach(async () => {
  folder = await realpath(await mkdtemp(join(tmpdir(), 'gitlantern-settings-')))
  settingsFile = join(folder, 'settings.json')
})

afterEach(async () => {
  vi.mocked(logError).mockClear()
  await rm(folder, { recursive: true, force: true, maxRetries: 5 })
})

describe('createSettingsStore', () => {
  it('reads a saved file', async () => {
    await writeFile(settingsFile, JSON.stringify({ commandCard: true }))

    expect(readSettings(createSettingsStore(folder))).toEqual({
      ...DEFAULT_SETTINGS,
      commandCard: true
    })
  })

  it.each([
    ['commandCard', 'yes'],
    ['fileList', 'grid'],
    ['diffViewMode', 'columns']
  ])('resets a %s of the wrong type', async (key, value) => {
    await writeFile(settingsFile, JSON.stringify({ [key]: value }))

    expect(readSettings(createSettingsStore(folder))).toEqual(DEFAULT_SETTINGS)
    expect(JSON.parse(await readFile(settingsFile, 'utf8'))).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps a key it does not know', async () => {
    await writeFile(settingsFile, JSON.stringify({ commandCard: true, newerSetting: 'on' }))

    expect(readSettings(createSettingsStore(folder))).toEqual({
      ...DEFAULT_SETTINGS,
      commandCard: true
    })
    expect(JSON.parse(await readFile(settingsFile, 'utf8'))).toEqual({
      ...DEFAULT_SETTINGS,
      commandCard: true,
      newerSetting: 'on'
    })
  })

  it.each([
    ['not JSON', '{ commandCard: tru'],
    ['too large', JSON.stringify({ commandCard: true, pasted: 'x'.repeat(MAX_STORED_DATA_LENGTH) })]
  ])('backs up a file that is %s, then resets it', async (_description, contents) => {
    await writeFile(settingsFile, contents)

    expect(readSettings(createSettingsStore(folder))).toEqual(DEFAULT_SETTINGS)
    expect(JSON.parse(await readFile(settingsFile, 'utf8'))).toEqual(DEFAULT_SETTINGS)
    expect(await readFile(`${settingsFile}.bak`, 'utf8')).toBe(contents)
    expect(logError).toHaveBeenCalledOnce()
  })

  it('backs up a file that breaks while the app is running', async () => {
    await writeFile(settingsFile, JSON.stringify({ commandCard: true }))
    const store = createSettingsStore(folder)
    await writeFile(settingsFile, '{ commandCard: tru')

    expect(readSettings(store)).toEqual(DEFAULT_SETTINGS)
    expect(await readFile(`${settingsFile}.bak`, 'utf8')).toBe('{ commandCard: tru')
  })

  it('uses the defaults and refuses changes when the file cannot be opened', async () => {
    await mkdir(settingsFile)

    const store = createSettingsStore(folder)

    expect(readSettings(store)).toEqual(DEFAULT_SETTINGS)
    expect(() => saveSetting(store, 'commandCard', true)).toThrow()
    expect(logError).toHaveBeenCalledOnce()
  })
})
