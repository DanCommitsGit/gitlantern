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
