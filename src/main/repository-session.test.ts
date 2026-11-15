import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, normalize } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  createTestRepository,
  isolateGitEnvironment,
  testGitPath,
  type TestRepository
} from './git/test-repository'
import { createMemoryAppDataStore } from './app-data-store'
import { RepositorySession, type AppDataStore } from './repository-session'

describe('RepositorySession', () => {
  let repository: TestRepository
  let store: AppDataStore
  let session: RepositorySession

  beforeAll(() => {
    isolateGitEnvironment()
  })

  beforeEach(() => {
    repository = createTestRepository()
    store = createMemoryAppDataStore()
    session = new RepositorySession(store)
  })

  afterEach(() => {
    repository.remove()
  })

  it('reports the git it found', async () => {
    const check = await session.checkGit()

    expect(check).toMatchObject({ state: 'ok', path: testGitPath() })
  })

  it('reports missing git when PATH has none and no location is saved', async () => {
    const previousPath = process.env['PATH']
    process.env['PATH'] = ''
    try {
      await expect(session.checkGit()).resolves.toEqual({ state: 'missing' })
    } finally {
      process.env['PATH'] = previousPath
    }
  })

  it('opens an ordinary repository with no prompt, and adds it to recents', async () => {
    await session.checkGit()

    const result = await session.open(repository.path)

    expect(result).toMatchObject({
      kind: 'opened',
      repository: { path: normalize(repository.path), name: basename(repository.path) }
    })
    expect(store.get('recentRepositories')).toEqual([normalize(repository.path)])
  })

  it('opens the top of a repository from one of its folders', async () => {
    repository.writeFile('folder/a.txt', 'a\n')
    await session.checkGit()

    const result = await session.open(join(repository.path, 'folder'))

    expect(result).toMatchObject({ repository: { path: normalize(repository.path) } })
  })

  it('reports a folder that is not a repository', async () => {
    const folder = realpathSync(mkdtempSync(join(tmpdir(), 'gitlantern-not-repo-')))
    await session.checkGit()
    try {
      const result = await session.open(folder)

      expect(result).toMatchObject({ kind: 'not-a-repository', folder })
      expect(store.get('recentRepositories')).toEqual([])
    } finally {
      rmSync(folder, { recursive: true, force: true, maxRetries: 5 })
    }
  })

  it('blocks reads until a repository that can run programs is trusted', async () => {
    repository.git('config', 'core.sshCommand', 'ssh -i key')
    await session.checkGit()

    const result = await session.open(repository.path)

    expect(result).toEqual({
      kind: 'needs-trust',
      path: normalize(repository.path),
      programs: [{ kind: 'setting', name: 'core.sshcommand', value: 'ssh -i key' }]
    })
    await expect(session.readStatus()).rejects.toThrow()

    const trusted = await session.trustPending()

    expect(trusted.kind).toBe('opened')
    await expect(session.readStatus()).resolves.toMatchObject({ branchName: 'main' })
  })

  it('remembers trust until the programs change', async () => {
    repository.git('config', 'core.sshCommand', 'ssh -i key')
    await session.checkGit()
    await session.open(repository.path)
    await session.trustPending()
    session.close()

    expect((await session.open(repository.path)).kind).toBe('opened')
    session.close()

    repository.git('config', 'core.sshCommand', 'ssh -i other-key')
    expect((await session.open(repository.path)).kind).toBe('needs-trust')
  })

  it('has nothing to trust unless a repository is waiting', async () => {
    await session.checkGit()

    await expect(session.trustPending()).rejects.toThrow()
  })

  it('keeps ten recent repositories, newest first, without duplicates', async () => {
    store.set(
      'recentRepositories',
      Array.from({ length: 12 }, (_, index) => `C:\\older-${index}`)
    )
    await session.checkGit()

    await session.open(repository.path)
    await session.open(repository.path)

    const recents = store.get('recentRepositories')
    expect(recents).toHaveLength(10)
    expect(recents[0]).toBe(normalize(repository.path))
    expect(recents.filter((path) => path === normalize(repository.path))).toHaveLength(1)
  })

  it('creates a repository in an empty folder', async () => {
    const folder = realpathSync(mkdtempSync(join(tmpdir(), 'gitlantern-create-')))
    await session.checkGit()
    try {
      const { result, record } = await session.create(folder)

      expect(result.kind).toBe('opened')
      expect(record).toMatchObject({ typedCommand: 'git init', exitCode: 0 })
    } finally {
      session.close()
      rmSync(folder, { recursive: true, force: true, maxRetries: 5 })
    }
  })

  it('opens an existing repository instead of running git init again', async () => {
    await session.checkGit()

    const { result, record } = await session.create(repository.path)

    expect(result.kind).toBe('opened')
    expect(record).toBeNull()
  })

  it('reports a missing name and email', async () => {
    await session.checkGit()

    const result = await session.open(repository.path)

    expect(result).toMatchObject({ repository: { identity: { name: null, email: null } } })
  })

  it('saves a name and email globally, including a name that looks like a flag', async () => {
    const globalConfig = join(repository.path, '.git', 'test-global-config')
    const previousGlobalConfig = process.env['GIT_CONFIG_GLOBAL']
    process.env['GIT_CONFIG_GLOBAL'] = globalConfig
    await session.checkGit()
    await session.open(repository.path)
    try {
      const { identity, records } = await session.saveIdentity('--odd name', 'me@example.com')

      expect(identity).toEqual({ name: '--odd name', email: 'me@example.com' })
      expect(records[0].typedCommand).toBe('git config --global user.name "--odd name"')
    } finally {
      process.env['GIT_CONFIG_GLOBAL'] = previousGlobalConfig
    }
  })

  it('stages, unstages and commits through the session', async () => {
    repository.writeFile('a.txt', 'a\n')
    await session.checkGit()
    await session.open(repository.path)

    await session.stageFiles(['a.txt'])
    expect((await session.readStatus()).staged).toHaveLength(1)

    await session.unstageFiles(['a.txt'])
    expect((await session.readStatus()).staged).toHaveLength(0)

    await session.stageAll()
    const record = await session.commit('First commit', '')

    expect(record.exitCode).toBe(0)
    expect(await session.readStatus()).toMatchObject({
      hasCommits: true,
      unstaged: [],
      staged: []
    })
  })
})
