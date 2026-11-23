import { describe, expect, it } from 'vitest'
import type { Branch, RepositoryStatus } from '../../shared/repository-types'
import { syncStateOf } from './sync-state'

function status(overrides: Partial<RepositoryStatus> = {}): RepositoryStatus {
    return {
        branchName: 'main',
        hasCommits: true,
        upstream: 'origin/main',
        remotes: ['origin'],
        unstaged: [],
        staged: [],
        ...overrides
    }
}

function branch(overrides: Partial<Branch> = {}): Branch {
    return { name: 'main', ahead: 0, behind: 0, committedAt: 0, ...overrides }
}

describe('syncStateOf', () => {
    it('counts the commits only the current branch has, and only its upstream has', () => {
        const sync = syncStateOf(status(), [
            branch({ name: 'other', ahead: 9, behind: 9 }),
            branch({ ahead: 2, behind: 3 })
        ])

        expect(sync).toMatchObject({ ahead: 2, behind: 3, isDiverged: true })
    })

    it('is not diverged when only one side has new commits', () => {
        expect(syncStateOf(status(), [branch({ behind: 3 })]).isDiverged).toBe(false)
        expect(syncStateOf(status(), [branch({ ahead: 3 })]).isDiverged).toBe(false)
    })

    it('cannot pull or push without a remote', () => {
        const sync = syncStateOf(status({ remotes: [], upstream: null }), [branch()])

        expect(sync).toMatchObject({ hasRemote: false, canPull: false, canPush: false })
    })

    it('pushes a branch with no upstream by publishing it, and cannot pull it', () => {
        const sync = syncStateOf(status({ upstream: null }), [branch()])

        expect(sync).toMatchObject({
            canPull: false,
            canPush: true,
            publishTarget: { remote: 'origin', branchName: 'main' }
        })
    })

    it('cannot pull or push when not on a branch', () => {
        const sync = syncStateOf(status({ branchName: null, upstream: null }), [branch()])

        expect(sync).toMatchObject({ canPull: false, canPush: false, publishTarget: null })
    })
})
