import { describe, expect, it } from 'vitest'
import type { FileChange, RepositoryStatus } from '../../shared/repository-types'
import { displayedChangeOf, listChangedFiles, stagedStateOf } from './changed-files'

function status(unstaged: FileChange[], staged: FileChange[]): RepositoryStatus {
    return { branchName: 'main', hasCommits: true, upstream: null, remotes: [], unstaged, staged }
}

describe('listChangedFiles', () => {
    it('merges each file into one row, sorted by path', () => {
        const modified = { path: 'b.txt', status: 'M' as const }
        const added = { path: 'a.txt', status: 'A' as const }

        expect(listChangedFiles(status([modified], [modified, added]))).toEqual([
            { path: 'a.txt', staged: added },
            { path: 'b.txt', staged: modified, unstaged: modified }
        ])
    })
})

describe('stagedStateOf', () => {
    const change = { path: 'a.txt', status: 'M' as const }

    it.each([
        [{ path: 'a.txt', unstaged: change }, 'unstaged'],
        [{ path: 'a.txt', staged: change, unstaged: change }, 'partly-staged'],
        [{ path: 'a.txt', staged: change }, 'staged']
    ])('reads %o as %s', (file, state) => {
        expect(stagedStateOf(file)).toBe(state)
    })
})

describe('displayedChangeOf', () => {
    it('shows the staged status of a partly staged file', () => {
        const added = { path: 'a.txt', status: 'A' as const }
        expect(displayedChangeOf({ path: 'a.txt', staged: added, unstaged: { ...added, status: 'M' } })).toBe(
            added
        )
    })

    it('shows a deletion made after staging', () => {
        const deleted = { path: 'a.txt', status: 'D' as const }
        expect(
            displayedChangeOf({ path: 'a.txt', staged: { ...deleted, status: 'M' }, unstaged: deleted })
        ).toBe(deleted)
    })
})
