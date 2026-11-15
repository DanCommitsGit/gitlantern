import { describe, expect, it } from 'vitest'
import { MAX_STORED_DATA_LENGTH, repairStoredData, type StoredDataRepairs } from './stored-data'

interface Example {
  enabled: boolean
  name: string | null
}

const DEFAULTS: Example = { enabled: false, name: null }

const REPAIRS: StoredDataRepairs<Example> = {
  enabled: (value) => (typeof value === 'boolean' ? value : undefined),
  name: (value) => (typeof value === 'string' || value === null ? value : undefined)
}

function repair(text: string): ReturnType<typeof repairStoredData<Example>> {
  return repairStoredData(text, DEFAULTS, REPAIRS)
}

describe('repairStoredData', () => {
  it('keeps valid data unchanged', () => {
    expect(repair('{"enabled":true,"name":"site"}')).toEqual({
      data: { enabled: true, name: 'site' },
      changed: false
    })
  })

  it('resets only the key with a wrong value', () => {
    expect(repair('{"enabled":"yes","name":"site"}')).toEqual({
      data: { enabled: false, name: 'site' },
      changed: true
    })
  })

  it('keeps unknown keys', () => {
    expect(repair('{"enabled":true,"name":"site","newerSetting":[1]}')).toEqual({
      data: { enabled: true, name: 'site', newerSetting: [1] },
      changed: false
    })
  })

  it('keeps unknown keys while resetting a wrong value', () => {
    expect(repair('{"enabled":"yes","newerSetting":[1]}').data).toEqual({
      enabled: false,
      name: null,
      newerSetting: [1]
    })
  })

  it('fills in missing keys', () => {
    expect(repair('{"enabled":true}')).toEqual({
      data: { enabled: true, name: null },
      changed: true
    })
  })

  it('ignores a byte order mark', () => {
    expect(repair('\uFEFF{"enabled":true,"name":"site"}').data).toEqual({
      enabled: true,
      name: 'site'
    })
  })

  it.each([['[true]'], ['"text"'], ['null']])('uses the defaults for %s', (text) => {
    expect(repair(text).data).toEqual(DEFAULTS)
  })

  it('treats a key named after an object property as unknown', () => {
    expect(repair('{"constructor":true}').data).toEqual({ ...DEFAULTS, constructor: true })
  })

  it('throws a SyntaxError for text that is not JSON', () => {
    expect(() => repair('{ enabled: tru')).toThrow(SyntaxError)
  })

  it('throws a SyntaxError for a file over the size limit', () => {
    const text = JSON.stringify({ enabled: true, pasted: 'x'.repeat(MAX_STORED_DATA_LENGTH) })

    expect(() => repair(text)).toThrow(SyntaxError)
  })
})
