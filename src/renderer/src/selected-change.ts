import type { FileChange, RepositoryStatus } from '../../shared/repository-types'
import { listChangedFiles, type ChangedFile } from './changed-files'

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

function diffSideOf(file: ChangedFile): SelectedChange {
  return file.unstaged
    ? { change: file.unstaged, staged: false }
    : { change: file.staged as FileChange, staged: true }
}

// In the checkbox list a file shows its staged changes only once it's fully staged.
export function resolveCheckboxSelection(
  status: RepositoryStatus,
  selection: FileSelection | null
): SelectedChange | null {
  const files = listChangedFiles(status)
  const selectedFile = files.find((file) => file.path === selection?.path) ?? files[0]
  return selectedFile === undefined ? null : diffSideOf(selectedFile)
}
