import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { fetchAction, pullAction, pushAction, type GitAction, type PullMode } from '../../shared/git-actions'
import { publishTargetOf } from '../../shared/publish-target'
import { readBranches } from './branches'
import { readRepositoryStatus } from './repository-status'
import { runAction } from './run-action'
import {
    createBareRemote,
    createTestRepository,
    isolateGitEnvironment,
    testGitPath,
    type TestRepository
} from './test-repository'

describe('fetch, pull and push', () => {
    let remote: ReturnType<typeof createBareRemote>
    let local: TestRepository
    let colleague: TestRepository
    let gitPath: string

    function runIn(repository: TestRepository, action: GitAction): ReturnType<typeof runAction> {
        return runAction({ gitPath, repositoryPath: repository.path }, action)
    }

    function commitFile(repository: TestRepository, path: string): void {
        repository.writeFile(path, `${path}\n`)
        repository.git('add', '--', path)
        repository.git('commit', '-qm', `Add ${path}`)
    }

    async function publish(repository: TestRepository): Promise<void> {
        const status = await readRepositoryStatus({ gitPath, repositoryPath: repository.path })
        await runIn(repository, pushAction(publishTargetOf(status)))
    }

    beforeAll(() => {
        isolateGitEnvironment()
        gitPath = testGitPath()
    })

    // The colleague's clone follows the same remote as the local repository.
    beforeEach(async () => {
        remote = createBareRemote()
        local = createTestRepository()
        local.git('remote', 'add', 'origin', remote.path)
        commitFile(local, 'first.txt')
        await publish(local)

        colleague = createTestRepository()
        colleague.git('remote', 'add', 'origin', remote.path)
        colleague.git('pull', '-q', 'origin', 'main')
        colleague.git('branch', '--set-upstream-to=origin/main')
    })

    afterEach(() => {
        colleague.remove()
        local.remove()
        remote.remove()
    })

    it('publishes a branch and makes the remote its upstream', async () => {
        const status = await readRepositoryStatus({ gitPath, repositoryPath: local.path })

        expect(status.upstream).toBe('origin/main')
        expect(status.remotes).toEqual(['origin'])
        expect(publishTargetOf(status)).toBeNull()
    })

    it('publishes to origin when there are other remotes too', async () => {
        local.git('remote', 'add', 'another', remote.path)
        local.git('switch', '-q', '-c', 'feature')

        const status = await readRepositoryStatus({ gitPath, repositoryPath: local.path })

        expect(publishTargetOf(status)).toEqual({ remote: 'origin', branchName: 'feature' })
    })

    it('pushes new commits to the upstream', async () => {
        commitFile(local, 'second.txt')

        const record = await runIn(local, pushAction(null))

        expect(record.exitCode).toBe(0)
        expect(record.typedCommand).toBe('git push')
        colleague.git('pull', '-q')
        expect(colleague.git('log', '-1', '--format=%s').trim()).toBe('Add second.txt')
    })

    it('rejects a push when the remote has newer commits', async () => {
        commitFile(colleague, 'theirs.txt')
        await runIn(colleague, pushAction(null))
        commitFile(local, 'mine.txt')

        const record = await runIn(local, pushAction(null))

        expect(record.exitCode).not.toBe(0)
        expect(record.output).not.toBe('')
    })

    it('fetches new commits without moving the branch', async () => {
        commitFile(colleague, 'theirs.txt')
        await runIn(colleague, pushAction(null))

        const record = await runIn(local, fetchAction())

        expect(record.exitCode).toBe(0)
        const [main] = await readBranches({ gitPath, repositoryPath: local.path })
        expect(main).toMatchObject({ name: 'main', ahead: 0, behind: 1 })
    })

    it('pulls new commits by fast-forward', async () => {
        commitFile(colleague, 'theirs.txt')
        await runIn(colleague, pushAction(null))

        const record = await runIn(local, pullAction('fast-forward-only'))

        expect(record.exitCode).toBe(0)
        expect(local.git('log', '-1', '--format=%s').trim()).toBe('Add theirs.txt')
    })

    it('refuses a fast-forward pull of diverged branches and changes nothing', async () => {
        commitFile(colleague, 'theirs.txt')
        await runIn(colleague, pushAction(null))
        commitFile(local, 'mine.txt')
        const headBefore = local.git('rev-parse', 'HEAD')

        const record = await runIn(local, pullAction('fast-forward-only'))

        expect(record.exitCode).not.toBe(0)
        expect(local.git('rev-parse', 'HEAD')).toBe(headBefore)
    })

    it.each<[PullMode, number]>([
        ['merge', 2],
        ['rebase', 1]
    ])('pulls diverged branches by %s', async (mode, parentsOfNewestCommit) => {
        commitFile(colleague, 'theirs.txt')
        await runIn(colleague, pushAction(null))
        commitFile(local, 'mine.txt')

        const record = await runIn(local, pullAction(mode))

        expect(record.exitCode).toBe(0)
        expect(local.git('rev-list', '--parents', '-1', 'HEAD').trim().split(' ')).toHaveLength(
            parentsOfNewestCommit + 1
        )
        const [main] = await readBranches({ gitPath, repositoryPath: local.path })
        expect(main).toMatchObject({ behind: 0, ahead: mode === 'merge' ? 2 : 1 })
    })

    it('records a failure when the remote cannot be reached', async () => {
        local.git('remote', 'set-url', 'origin', 'https://127.0.0.1:9/never.git')

        const record = await runIn(local, fetchAction())

        expect(record.exitCode).not.toBe(0)
    })
})
