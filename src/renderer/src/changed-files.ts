import type { FileChange, RepositoryStatus } from '../../shared/repository-types'

export type StagedState = 'unstaged' | 'partly-staged' | 'staged'

/** One file in the checkbox list, with whichever of its staged and unstaged changes exist. */
export interface ChangedFile {
    path: string
    staged?: FileChange
    unstaged?: FileChange
}

export function listChangedFiles(status: RepositoryStatus): ChangedFile[] {
    const files = new Map<string, ChangedFile>()
    for (const change of status.staged) files.set(change.path, { path: change.path, staged: change })
    for (const change of status.unstaged) {
        files.set(change.path, { ...files.get(change.path), path: change.path, unstaged: change })
    }
    return [...files.values()].sort((first, second) => (first.path < second.path ? -1 : 1))
}

export function pathLabelOf(change: FileChange): string {
    return change.originalPath ? `${change.originalPath} → ${change.path}` : change.path
}

export function stagedStateOf(file: ChangedFile): StagedState {
    if (file.unstaged === undefined) return 'staged'
    return file.staged === undefined ? 'unstaged' : 'partly-staged'
}

// A file deleted after staging is gone from the working tree, so its deletion is what shows.
export function displayedChangeOf(file: ChangedFile): FileChange {
    if (file.unstaged?.status === 'D') return file.unstaged
    return (file.staged ?? file.unstaged) as FileChange
}
