import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppDataStore } from './app-data-store'
import { logError } from './log'

vi.mock('./log', () => ({ logError: vi.fn() }))

let folder: string
let configFile: string

beforeEach(async () => {
  folder = await realpath(await mkdtemp(join(tmpdir(), 'gitlantern-config-')))
  configFile = join(folder, 'config.json')
})

afterEach(async () => {
  vi.mocked(logError).mockClear()
  await rm(folder, { recursive: true, force: true, maxRetries: 5 })
})

describe('createAppDataStore', () => {
  it('reads a saved file', async () => {
    await writeFile(configFile, JSON.stringify({ recentRepositories: ['C:\\work\\site.v2'] }))

    expect(createAppDataStore(folder).get('recentRepositories')).toEqual(['C:\\work\\site.v2'])
  })

  it('backs up a file that is not JSON, then resets it', async () => {
    await writeFile(configFile, '{ recentRepositories: [')

    expect(createAppDataStore(folder).get('recentRepositories')).toEqual([])
    expect(JSON.parse(await readFile(configFile, 'utf8'))).toMatchObject({ recentRepositories: [] })
    expect(await readFile(`${configFile}.bak`, 'utf8')).toBe('{ recentRepositories: [')
  })

  it('keeps a key it does not know', async () => {
    await writeFile(
      configFile,
      JSON.stringify({ recentRepositories: ['C:\\work\\site'], newerSetting: 'on' })
    )

    expect(createAppDataStore(folder).get('recentRepositories')).toEqual(['C:\\work\\site'])
    expect(JSON.parse(await readFile(configFile, 'utf8'))).toMatchObject({ newerSetting: 'on' })
  })

  it('resets only the values that are wrong', async () => {
    await writeFile(
      configFile,
      JSON.stringify({
        recentRepositories: ['C:\\work\\site', 42],
        trustedPrograms: { 'C:\\work\\site': 'fingerprint', 'C:\\work\\other': false },
        gitLocation: 7,
        lastOpenRepository: 7,
        collapsedBranchGroups: { 'C:\\work\\site': ['feature', 3], 'C:\\work\\other': 'fix' }
      })
    )

    const store = createAppDataStore(folder)

    expect(store.get('recentRepositories')).toEqual(['C:\\work\\site'])
    expect(store.get('trustedPrograms')).toEqual({ 'C:\\work\\site': 'fingerprint' })
    expect(store.get('gitLocation')).toBeNull()
    expect(store.get('lastOpenRepository')).toBeNull()
    expect(store.get('collapsedBranchGroups')).toEqual({ 'C:\\work\\site': ['feature'] })
  })

  it('keeps changes in memory once saving fails', async () => {
    await writeFile(configFile, JSON.stringify({ recentRepositories: ['C:\\work\\site'] }))
    const onNotSaved = vi.fn()
    const store = createAppDataStore(folder, onNotSaved)
    await rm(configFile)
    await mkdir(configFile)

    expect(onNotSaved).not.toHaveBeenCalled()
    store.set('gitLocation', 'C:\\Git\\cmd\\git.exe')
    store.set('trustedPrograms', { 'C:\\work\\site': 'fingerprint' })

    expect(store.get('gitLocation')).toBe('C:\\Git\\cmd\\git.exe')
    expect(store.get('trustedPrograms')).toEqual({ 'C:\\work\\site': 'fingerprint' })
    expect(store.get('recentRepositories')).toEqual(['C:\\work\\site'])
    expect(logError).toHaveBeenCalledOnce()
    expect(onNotSaved).toHaveBeenCalledOnce()
  })

  it('keeps the last values it read once reading fails', async () => {
    await writeFile(configFile, JSON.stringify({ recentRepositories: ['C:\\work\\site'] }))
    const onNotSaved = vi.fn()
    const store = createAppDataStore(folder, onNotSaved)
    await rm(configFile)
    await mkdir(configFile)

    expect(store.get('recentRepositories')).toEqual(['C:\\work\\site'])
    expect(logError).toHaveBeenCalledOnce()
    expect(onNotSaved).toHaveBeenCalledOnce()
  })

  it('keeps changes in memory when the file cannot be opened', async () => {
    await mkdir(configFile)

    const onNotSaved = vi.fn()
    const store = createAppDataStore(folder, onNotSaved)
    store.set('gitLocation', 'C:\\Git\\cmd\\git.exe')

    expect(store.get('gitLocation')).toBe('C:\\Git\\cmd\\git.exe')
    expect(store.get('trustedPrograms')).toEqual({})
    expect(logError).toHaveBeenCalledOnce()
    expect(onNotSaved).toHaveBeenCalledOnce()
  })

  it('does not report a file that works', async () => {
    const onNotSaved = vi.fn()
    const store = createAppDataStore(folder, onNotSaved)

    store.set('gitLocation', 'C:\\Git\\cmd\\git.exe')

    expect(onNotSaved).not.toHaveBeenCalled()
  })
})
