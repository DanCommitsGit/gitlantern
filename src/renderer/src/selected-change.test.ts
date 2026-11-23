import { describe, expect, it } from 'vitest'
import type { RepositoryStatus } from '../../shared/repository-types'
import { resolveCheckboxSelection, resolveSelectedChange } from './selected-change'

const a = { path: 'a.txt', status: 'M' as const }
const b = { path: 'b.txt', status: 'M' as const }

function status(unstaged: (typeof a)[], staged: (typeof a)[]): RepositoryStatus {
    return { branchName: 'main', hasCommits: true, upstream: null, remotes: [], unstaged, staged }
}

describe('resolveSelectedChange', () => {
    it('keeps the selected file in its list', () => {
        expect(resolveSelectedChange(status([a], [a]), { path: 'a.txt', staged: true })).toEqual({
            change: a,
            staged: true
        })
    })

    it('follows a file to the other list', () => {
        expect(resolveSelectedChange(status([], [a]), { path: 'a.txt', staged: false })).toEqual({
            change: a,
            staged: true
        })
    })

    it('falls back to the first unstaged file, then the first staged file', () => {
        expect(resolveSelectedChange(status([b], [a]), null)).toEqual({ change: b, staged: false })
        expect(resolveSelectedChange(status([], [a]), { path: 'gone.txt', staged: false })).toEqual({
            change: a,
            staged: true
        })
    })

    it('selects nothing when nothing changed', () => {
        expect(resolveSelectedChange(status([], []), null)).toBeNull()
    })
})

describe('resolveCheckboxSelection', () => {
    it('shows the staged changes of a fully staged file', () => {
        expect(resolveCheckboxSelection(status([], [a]), { path: 'a.txt', staged: false })).toEqual({
            change: a,
            staged: true
        })
    })

    it('shows the unstaged changes of a partly staged file', () => {
        expect(resolveCheckboxSelection(status([a], [a]), { path: 'a.txt', staged: true })).toEqual({
            change: a,
            staged: false
        })
    })

    it('falls back to the first file by path', () => {
        expect(resolveCheckboxSelection(status([b], [a]), null)).toEqual({ change: a, staged: true })
    })

    it('selects nothing when nothing changed', () => {
        expect(resolveCheckboxSelection(status([], []), null)).toBeNull()
    })
})
