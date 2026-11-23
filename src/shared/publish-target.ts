import type { PublishTarget } from './git-actions'
import type { RepositoryStatus } from './repository-types'

// Where pushing the current branch for the first time would send it: origin, or else the first remote.
// Null when the branch already has an upstream, or can't be pushed.
export function publishTargetOf(status: RepositoryStatus): PublishTarget | null {
    const { branchName, hasCommits, upstream, remotes } = status
    if (branchName === null || !hasCommits || upstream !== null || remotes.length === 0) return null

    return { remote: remotes.includes('origin') ? 'origin' : remotes[0], branchName }
}
