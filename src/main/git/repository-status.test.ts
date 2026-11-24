import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { readRepositoryStatus } from './repository-status'
import {
    createTestRepository,
    isolateGitEnvironment,
    testGitPath,
    type TestRepository
} from './test-repository'

describe('readRepositoryStatus', () => {
    let repository: TestRepository
    let gitPath: string

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

    it('reports a new repository with no commits', async () => {
        await expect(status()).resolves.toEqual({
            branchName: 'main',
            hasCommits: false,
            unstaged: [],
            staged: []
        })
    })

    it('reports a clean repository', async () => {
        commitFile('a.txt', 'a\n')

        await expect(status()).resolves.toEqual({
            branchName: 'main',
            hasCommits: true,
            unstaged: [],
            staged: []
        })
    })

    it('reports null when not on a branch', async () => {
        commitFile('a.txt', 'a\n')
        repository.git('switch', '-q', '--detach')

        expect((await status()).branchName).toBeNull()
    })

    it('sorts changes into unstaged and staged', async () => {
        commitFile('modified.txt', 'a\n')
        commitFile('staged.txt', 'a\n')
        commitFile('deleted.txt', 'a\n')
        repository.writeFile('modified.txt', 'b\n')
        repository.writeFile('staged.txt', 'b\n')
        repository.git('add', 'staged.txt')
        rmSync(join(repository.path, 'deleted.txt'))
        repository.writeFile('untracked.txt', 'a\n')

        const { unstaged, staged } = await status()

        expect(unstaged).toEqual(
            expect.arrayContaining([
                { path: 'modified.txt', status: 'M' },
                { path: 'deleted.txt', status: 'D' },
                { path: 'untracked.txt', status: '?' }
            ])
        )
        expect(unstaged).toHaveLength(3)
        expect(staged).toEqual([{ path: 'staged.txt', status: 'M' }])
    })

    it('lists a partly staged file in both lists', async () => {
        commitFile('a.txt', 'one\n')
        repository.writeFile('a.txt', 'two\n')
        repository.git('add', 'a.txt')
        repository.writeFile('a.txt', 'three\n')

        const { unstaged, staged } = await status()

        expect(unstaged).toEqual([{ path: 'a.txt', status: 'M' }])
        expect(staged).toEqual([{ path: 'a.txt', status: 'M' }])
    })

    it('reports a staged rename with its original path', async () => {
        commitFile('old name.txt', 'same\ncontent\nhere\n')
        repository.git('mv', 'old name.txt', 'new name.txt')

        expect((await status()).staged).toEqual([
            { path: 'new name.txt', status: 'R', originalPath: 'old name.txt' }
        ])
    })

    it('keeps paths with spaces and non-ASCII characters unchanged', async () => {
        repository.writeFile('folder with space/café file.txt', 'a\n')

        expect((await status()).unstaged).toEqual([{ path: 'folder with space/café file.txt', status: '?' }])
    })

    it('lists a conflicted file as unstaged with status U', async () => {
        commitFile('a.txt', 'base\n')
        repository.git('switch', '-qc', 'side')
        commitFile('a.txt', 'side\n')
        repository.git('switch', '-q', 'main')
        commitFile('a.txt', 'main\n')
        expect(() => repository.git('merge', 'side')).toThrow()

        const { unstaged, staged } = await status()

        expect(unstaged).toEqual([{ path: 'a.txt', status: 'U' }])
        expect(staged).toEqual([])
    })
})
