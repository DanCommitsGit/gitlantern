import { PULL_MODES, type PullMode } from '../shared/git-actions'
import { LOG_SCOPES, type LogScope } from '../shared/history-types'
import { NOTICES, type Notice } from '../shared/notices'
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

export function requireCount(value: unknown): number {
    if (!Number.isSafeInteger(value) || (value as number) < 0) {
        throw new TypeError('Expected a count')
    }
    return value as number
}

// A full hash can't be mistaken for an option or a path.
export function requireCommitHash(value: unknown): string {
    if (typeof value !== 'string' || !/^[0-9a-f]{40,64}$/.test(value)) {
        throw new TypeError('Expected a commit hash')
    }
    return value
}

export function requireLogScope(value: unknown): LogScope {
    if (!LOG_SCOPES.includes(value as LogScope)) throw new TypeError('Unknown log scope')
    return value as LogScope
}

export function requirePullMode(value: unknown): PullMode {
    if (!PULL_MODES.includes(value as PullMode)) throw new TypeError('Unknown pull mode')
    return value as PullMode
}

export function requireNotice(value: unknown): Notice {
    if (!NOTICES.includes(value as Notice)) throw new TypeError('Unknown notice')
    return value as Notice
}

export function requireStrings(value: unknown): string[] {
    if (!Array.isArray(value)) throw new TypeError('Expected a list of strings')
    return value.map(requireString)
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
        ...(change.originalPath === undefined ? {} : { originalPath: requireString(change.originalPath) })
    }
}
