import { describe, expect, it } from 'vitest'
import {
  requireBoolean,
  requireFileChange,
  requireNonEmptyStrings,
  requireString
} from './ipc-validation'

describe('IPC validation', () => {
  it('accepts valid values', () => {
    expect(requireString('a')).toBe('a')
    expect(requireBoolean(false)).toBe(false)
    expect(requireNonEmptyStrings(['a', 'b'])).toEqual(['a', 'b'])
    expect(requireFileChange({ path: 'a', status: 'R', originalPath: 'b' })).toEqual({
      path: 'a',
      status: 'R',
      originalPath: 'b'
    })
  })

  it('drops properties a file change does not have', () => {
    expect(requireFileChange({ path: 'a', status: 'M', extra: 'x' })).toEqual({
      path: 'a',
      status: 'M'
    })
  })

  it.each([
    ['a number as a string', () => requireString(1)],
    ['a string as a boolean', () => requireBoolean('true')],
    ['an empty list', () => requireNonEmptyStrings([])],
    ['a list with a non-string', () => requireNonEmptyStrings(['a', 1])],
    ['null as a change', () => requireFileChange(null)],
    ['an unknown status', () => requireFileChange({ path: 'a', status: 'X' })],
    ['a change without a path', () => requireFileChange({ status: 'M' })],
    [
      'a non-string original path',
      () => requireFileChange({ path: 'a', status: 'R', originalPath: 1 })
    ]
  ])('rejects %s', (_description, validate) => {
    expect(validate).toThrow(TypeError)
  })
})
