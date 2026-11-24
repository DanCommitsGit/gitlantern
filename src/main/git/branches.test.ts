import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { parseBranches, readBranches } from './branches'
import {
    createTestRepository,
    isolateGitEnvironment,
    testGitPath,
    type TestRepository
} from './test-repository'

describe('parseBranches', () => {
    it('reads ahead and behind counts, and treats a gone upstream as none', () => {
        const output = [
            'refs/heads/main\0\x001767225600',
            'refs/heads/feature/x\0ahead 2, behind 1\x001767225700',
            'refs/heads/old\0gone\x001767225500',
            ''
        ].join('\n')

        expect(parseBranches(output)).toEqual([
            { name: 'main', ahead: 0, behind: 0, committedAt: 1767225600 },
            { name: 'feature/x', ahead: 2, behind: 1, committedAt: 1767225700 },
            { name: 'old', ahead: 0, behind: 0, committedAt: 1767225500 }
        ])
    })
})

describe('readBranches', () => {
    let repository: TestRepository
    let gitPath: string

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

    function branches(): ReturnType<typeof readBranches> {
        return readBranches({ gitPath, repositoryPath: repository.path })
    }

    it('lists nothing before the first commit', async () => {
        await expect(branches()).resolves.toEqual([])
    })

    it('lists local branches with counts against their upstream', async () => {
        repository.git('commit', '-q', '--allow-empty', '-m', 'one')
        repository.git('branch', 'feature/x')
        repository.git('branch', '-q', '-u', 'main', 'feature/x')
        repository.git('commit', '-q', '--allow-empty', '-m', 'two')
        repository.git('tag', 'feature/x')

        await expect(branches()).resolves.toEqual([
            { name: 'feature/x', ahead: 0, behind: 1, committedAt: 1767225600 },
            { name: 'main', ahead: 0, behind: 0, committedAt: 1767225600 }
        ])
    })
})
