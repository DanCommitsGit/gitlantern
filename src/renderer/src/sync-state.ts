import type { PublishTarget } from '../../shared/git-actions'
import { publishTargetOf } from '../../shared/publish-target'
import type { Branch, RepositoryStatus } from '../../shared/repository-types'

export interface SyncState {
    hasRemote: boolean
    canPull: boolean
    canPush: boolean
    // ahead: commits only this branch has. behind: commits only its upstream has. Both as of the last fetch.
    ahead: number
    behind: number
    isDiverged: boolean
    // Where the first push would go; null when the branch has an upstream or can't be pushed.
    publishTarget: PublishTarget | null
}

export function syncStateOf(status: RepositoryStatus, branches: Branch[]): SyncState {
    const currentBranch = branches.find((branch) => branch.name === status.branchName)
    const ahead = currentBranch?.ahead ?? 0
    const behind = currentBranch?.behind ?? 0
    const hasRemote = status.remotes.length > 0

    return {
        hasRemote,
        canPull: hasRemote && status.upstream !== null,
        canPush: hasRemote && status.branchName !== null && status.hasCommits,
        ahead,
        behind,
        isDiverged: ahead > 0 && behind > 0,
        publishTarget: publishTargetOf(status)
    }
}
