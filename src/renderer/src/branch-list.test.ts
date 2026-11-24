import { describe, expect, it } from 'vitest'
import type { Branch } from '../../shared/repository-types'
import { groupBranches, orderBranches, withCurrentBranch } from './branch-list'

function branch(name: string, committedAt = 0): Branch {
    return { name, ahead: 0, behind: 0, committedAt }
}

const names = (branches: Branch[]): string[] => branches.map((each) => each.name)

describe('withCurrentBranch', () => {
    it('adds a current branch that has no commits yet', () => {
        expect(names(withCurrentBranch([], 'main'))).toEqual(['main'])
    })

    it('leaves the list alone when the current branch is in it or there is none', () => {
        const branches = [branch('main')]

        expect(withCurrentBranch(branches, 'main')).toBe(branches)
        expect(withCurrentBranch(branches, null)).toBe(branches)
    })
})

describe('orderBranches', () => {
    const branches = [branch('main', 100), branch('fix/a', 300), branch('dev', 200)]

    it('puts the current branch first, then the rest by name', () => {
        expect(names(orderBranches(branches, 'main', 'current-first'))).toEqual(['main', 'dev', 'fix/a'])
    })

    it('sorts by name', () => {
        expect(names(orderBranches(branches, 'main', 'name'))).toEqual(['dev', 'fix/a', 'main'])
    })

    it('sorts by newest commit, then by name', () => {
        const tied = [...branches, branch('beta', 300)]

        expect(names(orderBranches(tied, 'main', 'newest-commit'))).toEqual(['beta', 'fix/a', 'dev', 'main'])
    })
})

describe('groupBranches', () => {
    it('groups by the first part before a slash and keeps the rest of the name', () => {
        const grouped = groupBranches([
            branch('feature/ui/x'),
            branch('main'),
            branch('fix/b'),
            branch('feature/y')
        ])

        expect(names(grouped.ungrouped)).toEqual(['main'])
        expect(grouped.groups.map((group) => [group.name, group.branches.map((each) => each.label)])).toEqual(
            [
                ['feature', ['ui/x', 'y']],
                ['fix', ['b']]
            ]
        )
    })
})
