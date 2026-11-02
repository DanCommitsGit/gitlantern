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
  unstaged: FileChange[]
  staged: FileChange[]
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
  | { kind: 'text'; hunks: DiffHunk[] }
  | { kind: 'binary'; details: string }
  | { kind: 'no-content-change'; details: string }
  | { kind: 'too-large'; lineCount: number }
  | { kind: 'conflict' }
