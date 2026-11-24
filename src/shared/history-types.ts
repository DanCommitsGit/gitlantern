import type { CommandRecord } from './command-record'

export const LOG_SCOPES = ['all-branches', 'this-branch', 'first-parent'] as const

export type LogScope = (typeof LOG_SCOPES)[number]

export interface CommitRef {
    // 'head' is the branch HEAD is on, or HEAD itself when not on a branch.
    kind: 'head' | 'branch' | 'remote' | 'tag'
    name: string
}

export interface Commit {
    hash: string
    parentHashes: string[]
    refs: CommitRef[]
    subject: string
    body: string
    authorName: string
    authorEmail: string
    // ISO 8601.
    authorDate: string
}

export interface CommitLogPage {
    commits: Commit[]
    hasMore: boolean
    // Only the first page of a log without a search has one.
    record: CommandRecord | null
}
