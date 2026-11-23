export type FileStatus = 'M' | 'A' | 'D' | 'R' | 'C' | 'T' | 'U' | '?'

export interface FileChange {
    path: string
    status: FileStatus
    originalPath?: string
}

export interface RepositoryStatus {
    // null when not on a branch.
    branchName: string | null
    hasCommits: boolean
    // The remote branch the current branch follows, such as "origin/main"; null when it follows none.
    upstream: string | null
    remotes: string[]
    unstaged: FileChange[]
    staged: FileChange[]
}

export interface Branch {
    name: string
    // Commits this branch and its upstream don't share; both 0 without an upstream.
    ahead: number
    behind: number
    // Unix seconds of the tip commit.
    committedAt: number
}

export interface DiffLine {
    kind: 'context' | 'added' | 'removed' | 'no-newline'
    oldLineNumber: number | null
    newLineNumber: number | null
    text: string
}

export interface DiffHunk {
    header: string
    lines: DiffLine[]
}

export type FileDiff =
    // reachesEndOfFile: the last hunk ends at the last line of both versions.
    | { kind: 'text'; hunks: DiffHunk[]; reachesEndOfFile: boolean }
    | { kind: 'binary'; details: string }
    | { kind: 'no-content-change'; details: string }
    | { kind: 'too-large'; lineCount: number }
    | { kind: 'conflict' }
