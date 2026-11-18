import { describe, expect, it } from 'vitest'
import {
  requireBoolean,
  requireCommitHash,
  requireCount,
  requireFileChange,
  requireLogScope,
  requireNonEmptyStrings,
  requireString
} from './ipc-validation'

describe('IPC validation', () => {
  it('accepts valid values', () => {
    expect(requireString('a')).toBe('a')
    expect(requireBoolean(false)).toBe(false)
    expect(requireNonEmptyStrings(['a', 'b'])).toEqual(['a', 'b'])
    expect(requireCount(0)).toBe(0)
    expect(requireCommitHash('a'.repeat(40))).toBe('a'.repeat(40))
    expect(requireLogScope('first-parent')).toBe('first-parent')
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
    ['a negative count', () => requireCount(-1)],
    ['a fraction as a count', () => requireCount(1.5)],
    ['a short hash', () => requireCommitHash('034eac8')],
    ['an option as a hash', () => requireCommitHash('--output=x')],
    ['an unknown log scope', () => requireLogScope('everything')],
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
