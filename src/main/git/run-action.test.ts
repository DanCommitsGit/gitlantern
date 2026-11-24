import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
    commitAction,
    formatCommand,
    stageAllAction,
    stageFilesAction,
    unstageAllAction,
    unstageFilesAction
} from '../../shared/git-actions'
import { readRepositoryStatus } from './repository-status'
import { runAction } from './run-action'
import {
    createTestRepository,
    isolateGitEnvironment,
    testGitPath,
    type TestRepository
} from './test-repository'

describe('git actions', () => {
    let repository: TestRepository
    let gitPath: string

    function run(action: Parameters<typeof runAction>[1]): ReturnType<typeof runAction> {
        return runAction({ gitPath, repositoryPath: repository.path }, action)
    }

    function status(): ReturnType<typeof readRepositoryStatus> {
        return readRepositoryStatus({ gitPath, repositoryPath: repository.path })
    }

    beforeAll(() => {
        isolateGitEnvironment()
        gitPath = testGitPath()
    })

    beforeEach(() => {
        repository = createTestRepository()
    })

    afterEach(() => {
        repository.remove()
    })

    function commitFile(path: string, contents: string): void {
        repository.writeFile(path, contents)
        repository.git('add', '--', path)
        repository.git('commit', '-qm', `Add ${path}`)
    }

    it('stages only the named file, even when its name is a pattern', async () => {
        repository.writeFile('a[1].txt', 'a\n')
        repository.writeFile('a1.txt', 'a\n')

        await run(stageFilesAction(['a[1].txt']))

        expect((await status()).staged).toEqual([{ path: 'a[1].txt', status: 'A' }])
    })

    it('stages a file whose name looks like a flag', async () => {
        repository.writeFile('--force', 'a\n')

        const record = await run(stageFilesAction(['--force']))

        expect(record.exitCode).toBe(0)
        expect((await status()).staged).toEqual([{ path: '--force', status: 'A' }])
    })

    it('stages a deleted file', async () => {
        commitFile('a.txt', 'a\n')
        rmSync(join(repository.path, 'a.txt'))

        await run(stageFilesAction(['a.txt']))

        expect((await status()).staged).toEqual([{ path: 'a.txt', status: 'D' }])
    })

    it('stages everything', async () => {
        commitFile('a.txt', 'a\n')
        repository.writeFile('a.txt', 'b\n')
        repository.writeFile('b.txt', 'b\n')

        await run(stageAllAction())

        const { unstaged, staged } = await status()
        expect(unstaged).toEqual([])
        expect(staged).toHaveLength(2)
    })

    it('unstages a file in a repository with commits', async () => {
        commitFile('a.txt', 'a\n')
        repository.writeFile('a.txt', 'b\n')
        repository.git('add', 'a.txt')

        await run(unstageFilesAction(['a.txt'], true))

        const { unstaged, staged } = await status()
        expect(staged).toEqual([])
        expect(unstaged).toEqual([{ path: 'a.txt', status: 'M' }])
    })

    it('unstages both sides of a rename', async () => {
        commitFile('old.txt', 'same\ncontent\nhere\n')
        repository.git('mv', 'old.txt', 'new.txt')

        await run(unstageFilesAction(['new.txt', 'old.txt'], true))

        const { unstaged, staged } = await status()
        expect(staged).toEqual([])
        expect(unstaged).toEqual(
            expect.arrayContaining([
                { path: 'old.txt', status: 'D' },
                { path: 'new.txt', status: '?' }
            ])
        )
    })

    it('unstages a file in a repository with no commits, and keeps it on disk', async () => {
        repository.writeFile('a.txt', 'a\n')
        repository.git('add', 'a.txt')

        const record = await run(unstageFilesAction(['a.txt'], false))

        expect(record.exitCode).toBe(0)
        const { unstaged, staged } = await status()
        expect(staged).toEqual([])
        expect(unstaged).toEqual([{ path: 'a.txt', status: '?' }])
    })

    it('unstages everything, with and without commits', async () => {
        repository.writeFile('a.txt', 'a\n')
        repository.git('add', 'a.txt')
        await run(unstageAllAction(false))
        expect((await status()).staged).toEqual([])

        commitFile('a.txt', 'a\n')
        repository.writeFile('a.txt', 'b\n')
        repository.git('add', 'a.txt')
        await run(unstageAllAction(true))
        expect((await status()).staged).toEqual([])
    })

    it('commits a summary alone', async () => {
        repository.writeFile('a.txt', 'a\n')
        repository.git('add', 'a.txt')

        const record = await run(commitAction('Add "a" file', '   '))

        expect(record.exitCode).toBe(0)
        expect(repository.git('log', '-1', '--format=%B').trim()).toBe('Add "a" file')
    })

    it('commits a summary and description', async () => {
        repository.writeFile('a.txt', 'a\n')
        repository.git('add', 'a.txt')

        await run(commitAction('Summary', 'First line.\n\nSecond paragraph.'))

        expect(repository.git('log', '-1', '--format=%B').trim()).toBe(
            'Summary\n\nFirst line.\n\nSecond paragraph.'
        )
    })

    it('records what you would type and what ran', async () => {
        repository.writeFile('a.txt', 'a\n')
        repository.git('add', 'a.txt')

        const record = await run(commitAction('Say "hi"', ''))

        expect(record).toMatchObject({
            typedCommand: 'git commit -m "Say \\"hi\\""',
            ranCommand: 'git commit -F -',
            differsFromTyped: true,
            exitCode: 0
        })
        expect(record.exactCommand).toContain('safe.bareRepository=explicit')
        expect(record.output).toContain('Say "hi"')
    })

    it('records a failure and its message', async () => {
        const record = await run(commitAction('Nothing staged', ''))

        expect(record.exitCode).not.toBe(0)
        expect(record.output).not.toBe('')
    })

    it('formats commands for display', () => {
        expect(formatCommand(['add', 'src/a.ts'])).toBe('git add src/a.ts')
        expect(formatCommand(['add', 'with space.txt'])).toBe('git add "with space.txt"')
        expect(formatCommand(['commit', '-m', 'cost $5 `now`'])).toBe('git commit -m "cost \\$5 \\`now\\`"')
    })
})
