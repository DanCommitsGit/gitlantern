import type { FileChange, FileStatus } from '../shared/repository-types'

const FILE_STATUSES = new Set<FileStatus>(['M', 'A', 'D', 'R', 'C', 'T', 'U', '?'])

export function requireString(value: unknown): string {
  if (typeof value !== 'string') throw new TypeError('Expected a string')
  return value
}

export function requireBoolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new TypeError('Expected a boolean')
  return value
}

export function requireNonEmptyStrings(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new TypeError('Expected a list of paths')
  return value.map(requireString)
}

export function requireFileChange(value: unknown): FileChange {
  const change = value as Partial<FileChange> | null
  if (change === null || typeof change !== 'object') throw new TypeError('Expected a file change')
  if (!FILE_STATUSES.has(change.status as FileStatus)) throw new TypeError('Unknown file status')

  return {
    path: requireString(change.path),
    status: change.status as FileStatus,
    ...(change.originalPath === undefined
      ? {}
      : { originalPath: requireString(change.originalPath) })
  }
}
