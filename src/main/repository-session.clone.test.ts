import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, normalize } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createBareRemote,
    createTestRepository,
    isolateGitEnvironment,
    type TestRepository
} from './git/test-repository'
import { createMemoryAppDataStore } from './app-data-store'
import { RepositorySession } from './repository-session'

describe('RepositorySession.clone', () => {
    let remote: ReturnType<typeof createBareRemote>
    let source: TestRepository
    let parentFolder: string
    let clonedFolder: string
    let session: RepositorySession

    beforeAll(() => {
        isolateGitEnvironment()
    })

    beforeEach(async () => {
        remote = createBareRemote()
        source = createTestRepository()
        source.git('remote', 'add', 'origin', remote.path)
        source.writeFile('first.txt', 'first\n')
        source.git('add', '--', 'first.txt')
        source.git('commit', '-qm', 'Add first.txt')
        source.git('push', '-q', 'origin', 'main')
        parentFolder = realpathSync.native(mkdtempSync(join(tmpdir(), 'gitlantern-clone-')))
        clonedFolder = join(parentFolder, basename(remote.path))
        session = new RepositorySession(createMemoryAppDataStore())
        await session.checkGit()
    })

    afterEach(() => {
        session.close()
        source.remove()
        remote.remove()
        rmSync(parentFolder, { recursive: true, force: true, maxRetries: 5 })
    })

    it('clones into a folder named after the URL and opens it', async () => {
        const result = await session.clone(remote.path, parentFolder, () => undefined)

        expect(result).toMatchObject({
            kind: 'cloned',
            result: { kind: 'opened', repository: { path: normalize(clonedFolder) } },
            record: { exitCode: 0 }
        })
        expect(existsSync(join(clonedFolder, 'first.txt'))).toBe(true)
    })

    it('keeps the clone and its command when the new repository cannot be opened', async () => {
        vi.spyOn(session, 'open').mockRejectedValueOnce(new Error('no access'))

        const result = await session.clone(remote.path, parentFolder, () => undefined)

        expect(result).toMatchObject({
            kind: 'cloned',
            result: { kind: 'failed', message: 'no access' },
            record: { exitCode: 0 }
        })
        expect(existsSync(join(clonedFolder, 'first.txt'))).toBe(true)
    })

    it('reports git progress lines and records the command that ran', async () => {
        const lines: string[] = []

        const result = await session.clone(remote.path, parentFolder, (line) => lines.push(line))

        // Git's wording is translated, but the folder it names is not.
        expect(lines.join('\n')).toContain(clonedFolder)
        expect(result).toMatchObject({
            record: {
                typedCommand: expect.stringMatching(/^git clone /),
                ranCommand: expect.stringContaining('--progress')
            }
        })
    })

    it('reports a failure and leaves no folder behind', async () => {
        const missingRemote = join(parentFolder, 'no-such-remote.git')

        const result = await session.clone(missingRemote, parentFolder, () => undefined)

        expect(result).toMatchObject({ kind: 'failed' })
        expect(existsSync(join(parentFolder, 'no-such-remote'))).toBe(false)
    })

    it('keeps a folder that was there before a failed clone', async () => {
        const existingFolder = join(parentFolder, 'no-such-remote')
        mkdirSync(existingFolder)

        const result = await session.clone(
            join(parentFolder, 'no-such-remote.git'),
            parentFolder,
            () => undefined
        )

        expect(result.kind).toBe('failed')
        expect(existsSync(existingFolder)).toBe(true)
    })

    it('refuses a URL with no repository name', async () => {
        await expect(session.clone('..', parentFolder, () => undefined)).rejects.toThrow()
    })

    it('refuses a folder that is not a full path', async () => {
        await expect(session.clone(remote.path, 'relative', () => undefined)).rejects.toThrow()
    })
})
