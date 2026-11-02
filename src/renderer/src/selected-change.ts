import type { FileChange, RepositoryStatus } from '../../shared/repository-types'

export interface FileSelection {
  path: string
  staged: boolean
}

export interface SelectedChange {
  change: FileChange
  staged: boolean
}

// Follows a file to the other list when it's staged or unstaged, and otherwise falls back to the first file.
export function resolveSelectedChange(
  status: RepositoryStatus,
  selection: FileSelection | null
): SelectedChange | null {
  if (selection !== null) {
    const sameList = selection.staged ? status.staged : status.unstaged
    const sameListChange = sameList.find((change) => change.path === selection.path)
    if (sameListChange) return { change: sameListChange, staged: selection.staged }

    const otherList = selection.staged ? status.unstaged : status.staged
    const otherListChange = otherList.find((change) => change.path === selection.path)
    if (otherListChange) return { change: otherListChange, staged: !selection.staged }
  }

  if (status.unstaged.length > 0) return { change: status.unstaged[0], staged: false }
  if (status.staged.length > 0) return { change: status.staged[0], staged: true }
  return null
}
