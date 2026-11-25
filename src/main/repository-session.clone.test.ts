import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import type { AddressInfo, Socket } from 'node:net'
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

// The real rm, which a test can replace for one call.
vi.mock('node:fs/promises', async (importOriginal) => {
    const original = await importOriginal<{ rm: typeof rm }>()
    return { ...original, rm: vi.fn(original.rm) }
})

describe('RepositorySession.clone', () => {
    let remote: ReturnType<typeof createBareRemote>
    let source: TestRepository
    let parentFolder: string
    let clonedFolder: string
    let session: RepositorySession
    let stalledRemote: Server | null = null

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
        vi.unstubAllEnvs()
        stalledRemote?.closeAllConnections()
        stalledRemote?.close()
        stalledRemote = null
        session.close()
        source.remove()
        remote.remove()
        rmSync(parentFolder, { recursive: true, force: true, maxRetries: 5 })
    })

    // Makes a clone of the remote fail when it checks out first.txt, after git has downloaded everything.
    function breakCheckout(): void {
        source.writeFile('.gitattributes', '*.txt filter=broken\n')
        source.git('add', '--', '.gitattributes')
        source.git('commit', '-qm', 'Add a filter')
        source.git('push', '-q', 'origin', 'main')
        vi.stubEnv('GIT_CONFIG_COUNT', '2')
        vi.stubEnv('GIT_CONFIG_KEY_0', 'filter.broken.smudge')
        vi.stubEnv('GIT_CONFIG_VALUE_0', 'false')
        vi.stubEnv('GIT_CONFIG_KEY_1', 'filter.broken.required')
        vi.stubEnv('GIT_CONFIG_VALUE_1', 'true')
    }

    // Starts a clone from a server that never answers, and returns once git has connected to it.
    async function startStalledClone(): Promise<{
        clone: ReturnType<RepositorySession['clone']>
        folder: string
        connectionClosed: Promise<unknown>
    }> {
        const server = createServer()
        const connected = new Promise<Socket>((resolve) => server.once('connection', resolve))
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
        stalledRemote = server
        const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/stalled.git`

        const clone = session.clone(url, parentFolder, () => undefined)
        const socket = await connected
        socket.on('error', () => undefined)
        const connectionClosed = new Promise((resolve) => socket.once('close', resolve))
        return { clone, folder: join(parentFolder, 'stalled'), connectionClosed }
    }

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

    it('removes the folder git leaves when it cannot check out the files', async () => {
        breakCheckout()

        const result = await session.clone(remote.path, parentFolder, () => undefined)

        expect(result.kind).toBe('failed')
        expect(existsSync(clonedFolder)).toBe(false)
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

    it('stops a cancelled clone and removes its folder', async () => {
        const { clone, folder } = await startStalledClone()
        expect(existsSync(folder)).toBe(true)

        session.cancelClone()

        await expect(clone).resolves.toEqual({ kind: 'cancelled' })
        expect(existsSync(folder)).toBe(false)
    })

    it('reports a stopped clone as finished only after its folder is removed', async () => {
        const { clone, folder } = await startStalledClone()

        await session.stopClone()

        expect(existsSync(folder)).toBe(false)
        await clone
    })

    it('has nothing to stop when no clone is running', () => {
        expect(session.stopClone()).toBeNull()
    })

    // Stopping git alone would leave git-remote-http connected.
    it('stops the programs git started when cancelled', async () => {
        const { clone, connectionClosed } = await startStalledClone()

        session.cancelClone()

        await clone
        await connectionClosed
    })

    it('names the folder it cannot remove after a cancel', async () => {
        const { clone, folder } = await startStalledClone()
        vi.mocked(rm).mockRejectedValueOnce(new Error('busy'))

        session.cancelClone()

        await expect(clone).resolves.toEqual({
            kind: 'failed',
            message: `The folder couldn't be removed: ${folder}`
        })
    })

    it('adds the folder it cannot remove to the message of a failed clone', async () => {
        breakCheckout()
        vi.mocked(rm).mockRejectedValueOnce(new Error('busy'))

        const result = await session.clone(remote.path, parentFolder, () => undefined)

        expect(result).toMatchObject({
            kind: 'failed',
            message: expect.stringContaining(`\n\nThe folder couldn't be removed: ${clonedFolder}`)
        })
    })

    it('refuses a URL with no repository name', async () => {
        await expect(session.clone('..', parentFolder, () => undefined)).rejects.toThrow()
    })

    it('refuses a folder that is not a full path', async () => {
        await expect(session.clone(remote.path, 'relative', () => undefined)).rejects.toThrow()
    })

    it('refuses to start a second clone while one is running', async () => {
        const first = session.clone(remote.path, parentFolder, () => undefined)

        await expect(session.clone(remote.path, parentFolder, () => undefined)).rejects.toThrow()

        session.cancelClone()
        await first
    })

    it('refuses to start a second clone while a folder is being removed', async () => {
        let secondClone: unknown
        vi.mocked(rm).mockImplementationOnce(async () => {
            secondClone = await session
                .clone(remote.path, parentFolder, () => undefined)
                .catch((error: unknown) => error)
        })

        await session.clone(join(parentFolder, 'no-such-remote.git'), parentFolder, () => undefined)

        expect(secondClone).toEqual(new Error('A clone is already running'))
    })
})
